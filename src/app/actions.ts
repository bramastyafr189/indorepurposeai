"use server";

import { getYoutubeTranscript } from "@/lib/youtube";
import { getArticleContent } from "@/lib/scraper";
import { repurposeAllContent } from "@/lib/gemini";
import { createClient } from "@/utils/supabase/server";

export async function processContent(input: string, mode: 'url' | 'text', tone: string = "professional") {
  const supabase = await createClient();
  
  try {
    // 0. Check for Auth & Credits
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Silakan login terlebih dahulu untuk menggunakan alat ini.' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (!profile || profile.credits <= 0) {
      return { success: false, error: 'Kredit Anda habis. Silakan hubungi admin atau upgrade paket.' };
    }

    let sourceContent = input;

    // 1. Check for cached version
    const { data: cachedData, error: fetchError } = await supabase
      .from('history')
      .select('*')
      .eq('input_content', input)
      .eq('tone', tone)
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (cachedData && !fetchError) {
      return {
        success: true,
        data: {
          x: cachedData.result_x,
          whatsapp: cachedData.result_whatsapp,
          linkedin: cachedData.result_linkedin
        }
      };
    }

    // 2. Cache Miss: Get content
    if (mode === 'url') {
      const isYouTube = input.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\//);
      if (isYouTube) {
        sourceContent = await getYoutubeTranscript(input);
      } else {
        sourceContent = await getArticleContent(input);
      }
    }

    // 3. Call Gemini
    const results = await repurposeAllContent(sourceContent, tone);

    // 4. Save to Supabase & Deduct Credit
    const { error: saveError } = await supabase
      .from('history')
      .insert([
        { 
          user_id: user.id,
          input_content: input, 
          mode, 
          tone,
          result_x: results.x, 
          result_whatsapp: results.whatsapp, 
          result_linkedin: results.linkedin 
        }
      ]);

    if (!saveError) {
      // Deduct credit
      await supabase
        .from('profiles')
        .update({ credits: profile.credits - 1 })
        .eq('id', user.id);
    } else {
      console.error('Failed to save to Supabase:', saveError);
      return {
        success: false,
        error: `Gagal menyimpan: ${saveError.message}`
      };
    }

    return { success: true, data: results };
  } catch (error: any) {
    return { success: false, error: error.message || 'Terjadi kesalahan sistem.' };
  }
}

export async function getHistory() {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    // ... data mapping logic stays the same (RLS handles user filtering implicitly)
    return {
      success: true,
      data: data.map(item => ({
        id: item.id,
        timestamp: new Date(item.created_at).getTime(),
        input: item.input_content,
        mode: item.mode,
        tone: item.tone || 'professional',
        results: {
          x: item.result_x,
          whatsapp: item.result_whatsapp,
          linkedin: item.result_linkedin
        }
      }))
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteHistory(id: string) {
  const supabase = await createClient();
  try {
    const { error } = await supabase
      .from('history')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
