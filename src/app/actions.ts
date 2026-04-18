"use server";

import { getYoutubeTranscript } from "@/lib/youtube";
import { repurposeAllContent } from "@/lib/gemini";
import { supabase } from "@/lib/supabase";

export async function processContent(input: string, mode: 'url' | 'text') {
  try {
    let sourceContent = input;

    // 1. Check for cached version first to save Gemini quota
    const { data: cachedData, error: fetchError } = await supabase
      .from('history')
      .select('*')
      .eq('input_content', input)
      .limit(1)
      .single();

    if (cachedData && !fetchError) {
      console.log('Cache Hit: Loading from Supabase');
      return {
        success: true,
        data: {
          x: cachedData.result_x,
          whatsapp: cachedData.result_whatsapp,
          linkedin: cachedData.result_linkedin
        }
      };
    }

    // 2. Cache Miss: Get transcript if needed
    if (mode === 'url') {
      sourceContent = await getYoutubeTranscript(input);
    }

    // 3. Call Gemini
    const results = await repurposeAllContent(sourceContent);

    // 4. Save to Supabase History
    const { error: saveError } = await supabase
      .from('history')
      .insert([
        { 
          input_content: input, 
          mode, 
          result_x: results.x, 
          result_whatsapp: results.whatsapp, 
          result_linkedin: results.linkedin 
        }
      ]);

    if (saveError) {
      console.error('Failed to save to Supabase:', saveError);
      return {
        success: false,
        error: `Gagal menyimpan ke database: ${saveError.message}. Pastikan tabel sudah dibuat dan RLS sudah dikonfigurasi.`
      };
    }

    return {
      success: true,
      data: results
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Terjadi kesalahan sistem.'
    };
  }
}

export async function getHistory() {
  try {
    const { data, error } = await supabase
      .from('history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return {
      success: true,
      data: data.map(item => ({
        id: item.id,
        timestamp: new Date(item.created_at).getTime(),
        input: item.input_content,
        mode: item.mode,
        results: {
          x: item.result_x,
          whatsapp: item.result_whatsapp,
          linkedin: item.result_linkedin
        }
      }))
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

export async function deleteHistory(id: string) {
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
