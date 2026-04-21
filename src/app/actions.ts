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
    
    // --- GET PENDING TRANSACTION & AUTO-EXPIRE ---
    const { data: pendingTx } = await supabase
      .from('transactions')
      .select('*')
      .or('status.eq.pending,status.eq.verifying')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (pendingTx && pendingTx.status === 'pending') {
      const expiryTime = new Date(pendingTx.created_at).getTime() + 24 * 60 * 60 * 1000;
      if (new Date().getTime() > expiryTime) {
        // Auto-expire!
        await supabase
          .from('transactions')
          .update({ status: 'expired' })
          .eq('id', pendingTx.id);
        
        pendingTx.status = 'expired';
      }
    }

    return { 
      success: true, 
      data: {
        ...profile,
        email: user.email,
        created_at: user.created_at,
        pendingTransaction: (pendingTx && (pendingTx.status === 'pending' || pendingTx.status === 'verifying')) ? pendingTx : null
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

    // Check for any 'pending' transactions in history that should be 'expired'
    const updatedData = await Promise.all((data || []).map(async (tx) => {
      if (tx.status === 'pending') {
        const expiryTime = new Date(tx.created_at).getTime() + 24 * 60 * 60 * 1000;
        if (new Date().getTime() > expiryTime) {
          await supabase.from('transactions').update({ status: 'expired' }).eq('id', tx.id);
          return { ...tx, status: 'expired' };
        }
      }
      return tx;
    }));

    return { success: true, data: updatedData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function initiateCheckout(planName: string, amount: number, paymentMethod?: string) {
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

    if (existing) {
      // Update payment method if it changed
      if (paymentMethod && existing.payment_method !== paymentMethod) {
        await supabase
          .from('transactions')
          .update({ payment_method: paymentMethod })
          .eq('id', existing.id);
      }
      return { success: true, data: existing };
    }

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
        unique_code: uniqueCode,
        payment_method: paymentMethod || null
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

export async function cancelTransaction(transactionId: string) {
  const supabase = await createClient();
  try {
    // 1. Check current status
    const { data: tx } = await supabase
      .from('transactions')
      .select('status')
      .eq('id', transactionId)
      .single();

    if (tx?.status !== 'pending') {
      return { success: false, error: 'Transaksi tidak dapat dibatalkan karena sedang dalam proses verifikasi.' };
    }

    const { error } = await supabase
      .from('transactions')
      .update({ status: 'cancelled' })
      .eq('id', transactionId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Helper to check if current user is an admin
async function checkIsAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return data?.role === 'admin';
}

export async function getVerifyingTransactions() {
  const supabase = await createClient();
  const isAdmin = await checkIsAdmin(supabase);
  
  if (!isAdmin) {
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
  const isAdmin = await checkIsAdmin(supabase);
  
  if (!isAdmin) {
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
  const isAdmin = await checkIsAdmin(supabase);
  
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'rejected' })
      .eq('id', transactionId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

import { createAdminClient } from "@/utils/supabase/admin";

export async function getAdminStats() {
  const supabase = await createClient();
  const isAdmin = await checkIsAdmin(supabase);
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  // Use admin client to bypass RLS for stats
  const adminSupabase = createAdminClient();

  try {
    // 1. Get total users
    const { count: userCount } = await adminSupabase.from('profiles').select('*', { count: 'exact', head: true });

    // 2. Get total revenue (Success transactions)
    const { data: revenueData } = await adminSupabase
      .from('transactions')
      .select('amount, unique_code')
      .eq('status', 'success');

    const totalRevenue = (revenueData || []).reduce((acc, curr) => acc + curr.amount + (curr.unique_code || 0), 0);

    // 3. Get pending verifications
    const { count: pendingCount } = await adminSupabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'verifying');

    // 4. Get active subscriptions (Non-Free & Not Expired)
    const now = new Date().toISOString();
    const { count: activeSubs } = await adminSupabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .neq('plan_name', 'Free')
      .gt('plan_expires_at', now);

    return {
      success: true,
      data: {
        totalUsers: userCount || 0,
        totalRevenue,
        pendingVerifications: pendingCount || 0,
        activeSubscriptions: activeSubs || 0
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAllTransactions() {
  const supabase = await createClient();
  const isAdmin = await checkIsAdmin(supabase);
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  const adminSupabase = createAdminClient();

  try {
    const { data, error } = await adminSupabase
      .from('transactions')
      .select(`
        *,
        profiles (
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAllUsers() {
  const supabase = await createClient();
  const isAdmin = await checkIsAdmin(supabase);
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  const adminSupabase = createAdminClient();

  try {
    const { data, error } = await adminSupabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAllHistoryAdmin() {
  const supabase = await createClient();
  const isAdmin = await checkIsAdmin(supabase);
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  const adminSupabase = createAdminClient();

  try {
    // Try with Join first
    let { data, error } = await adminSupabase
      .from('history')
      .select(`
        *,
        profiles (
          email
        )
      `)
      .order('created_at', { ascending: false });

    // If join fails (e.g. no Foreign Key defined), fallback to simple select
    if (error) {
      console.error('History Join Error:', error.message);
      const { data: simpleData, error: simpleError } = await adminSupabase
        .from('history')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (simpleError) throw simpleError;
      return { success: true, data: simpleData };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('getAllHistoryAdmin Final Error:', error.message);
    return { success: false, error: error.message };
  }
}
