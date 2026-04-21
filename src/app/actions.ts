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

export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    // --- AUTO-DOWNGRADE LOGIC ---
    if (profile.plan_name !== 'Free' && profile.plan_expires_at) {
      const expiryDate = new Date(profile.plan_expires_at);
      const now = new Date();

      if (now > expiryDate) {
        // Plan has expired! Reset to Free.
        const { error: downgradeError } = await supabase
          .from('profiles')
          .update({ 
            plan_name: 'Free',
            credits: 0 // Reset credits upon expiry
          })
          .eq('id', user.id);

        if (!downgradeError) {
          profile.plan_name = 'Free';
          profile.credits = 0;
        }
      }
    }
    
    return { 
      success: true, 
      data: {
        ...profile,
        email: user.email,
        created_at: user.created_at // Use Auth user registration date
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getTransactionHistory() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function initiateCheckout(planName: string, amount: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { success: false, error: 'Silakan login terlebih dahulu.' };

  try {
    // 1. Check if there's an existing 'pending' checkout for this user and plan
    const { data: existing } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_name', planName)
      .eq('status', 'pending')
      .single();

    if (existing) return { success: true, data: existing };

    // 2. Generate unique code (1-999)
    const uniqueCode = Math.floor(Math.random() * 999) + 1;
    const orderId = `MANUAL-${user.id.slice(0, 5)}-${Date.now()}`;

    // 3. Create new pending transaction
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        order_id: orderId,
        amount: amount,
        plan_name: planName,
        status: 'pending',
        unique_code: uniqueCode
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function confirmPaymentSent(transactionId: string) {
  const supabase = await createClient();
  try {
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'verifying' })
      .eq('id', transactionId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- ADMIN ACTIONS ---

const ADMIN_EMAILS = ['bramastyafr@gmail.com']; // GANTI DENGAN EMAIL ANDA

export async function getVerifyingTransactions() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Join with profiles to get user email for display
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        profiles (
          email
        )
      `)
      .eq('status', 'verifying')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function approveTransaction(transactionId: string) {
  const supabase = await createClient();
  const { data: { user: adminUser } } = await supabase.auth.getUser();
  
  if (!adminUser || !ADMIN_EMAILS.includes(adminUser.email || '')) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // 1. Get transaction details
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (txError || !tx) throw new Error('Transaksi tidak ditemukan');

    // 2. Get user profile
    const { data: profile, error: pError } = await supabase
      .from('profiles')
      .select('credits, plan_expires_at')
      .eq('id', tx.user_id)
      .single();

    if (pError || !profile) throw new Error('Profil user tidak ditemukan');

    // 3. Determine credits
    let creditsToAdd = 0;
    if (tx.plan_name === 'Pro') creditsToAdd = 100;
    else if (tx.plan_name === 'Agency') creditsToAdd = 500;
    else creditsToAdd = 10; // Default

    // 4. Calculate New Expiry Date (Stacking Logic)
    const now = new Date();
    let newExpiryDate = new Date();
    
    // If user has a future expiry date, add 30 days to it
    if (profile.plan_expires_at && new Date(profile.plan_expires_at) > now) {
      newExpiryDate = new Date(profile.plan_expires_at);
      newExpiryDate.setDate(newExpiryDate.getDate() + 30);
    } else {
      // Otherwise, add 30 days from now
      newExpiryDate.setDate(now.getDate() + 30);
    }

    // 5. Atomic Updates (Credits, Status, & Expiry)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        credits: (profile.credits || 0) + creditsToAdd,
        plan_name: tx.plan_name,
        plan_expires_at: newExpiryDate.toISOString()
      })
      .eq('id', tx.user_id);

    if (updateError) throw updateError;

    const { error: statusError } = await supabase
      .from('transactions')
      .update({ status: 'success' })
      .eq('id', transactionId);

    if (statusError) throw statusError;

    return { success: true };
  } catch (error: any) {
    console.error('Approve Error:', error);
    return { success: false, error: error.message };
  }
}

export async function rejectTransaction(transactionId: string) {
  const supabase = await createClient();
  const { data: { user: adminUser } } = await supabase.auth.getUser();
  
  if (!adminUser || !ADMIN_EMAILS.includes(adminUser.email || '')) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'failed' })
      .eq('id', transactionId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
