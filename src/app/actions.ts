"use server";

import { getYoutubeTranscript } from "@/lib/youtube";
import { getArticleContent } from "@/lib/scraper";
import { repurposeAllContent } from "@/lib/ai-engine";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { sendTelegramNotification } from "@/lib/notifications";

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
          linkedin: cachedData.result_linkedin,
          instagram: cachedData.result_instagram,
          tiktok: cachedData.result_tiktok,
          newsletter: cachedData.result_newsletter,
          threads: cachedData.result_threads,
          highlights: cachedData.result_highlights,
          blog: cachedData.result_blog
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

    // 3. Call AI Engine
    const { results, modelId } = await repurposeAllContent(sourceContent, tone, user.id);

    // 4. Save to Supabase & Deduct Credit
    const { error: saveError } = await supabase
      .from('history')
      .insert([
        { 
          user_id: user.id,
          input_content: input, 
          mode, 
          tone,
          model_id: modelId,
          result_x: results.x, 
          result_linkedin: results.linkedin,
          result_instagram: results.instagram,
          result_tiktok: results.tiktok,
          result_newsletter: results.newsletter,
          result_threads: results.threads,
          result_highlights: results.highlights,
          result_blog: results.blog
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
          linkedin: item.result_linkedin,
          instagram: item.result_instagram,
          tiktok: item.result_tiktok,
          newsletter: item.result_newsletter,
          threads: item.result_threads,
          highlights: item.result_highlights,
          blog: item.result_blog
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
      const expiryTime = new Date(pendingTx.created_at).getTime() + 2 * 60 * 60 * 1000;
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
        pendingTransaction: (pendingTx && (pendingTx.status === 'pending' || pendingTx.status === 'verifying' || pendingTx.status === 'expired')) ? pendingTx : null
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
        const expiryTime = new Date(tx.created_at).getTime() + 2 * 60 * 60 * 1000;
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

    // 4. Send Telegram Notification for New Order
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const message = `
<b>🛒 Pesanan Baru Dimulai!</b>
━━━━━━━━━━━━━━━━━━
<b>User:</b> ${user.email}
<b>Paket:</b> ${planName}
<b>Total:</b> Rp ${(amount + uniqueCode).toLocaleString('id-ID')}
<b>Status:</b> Menunggu Pembayaran

<i>User baru saja membuka halaman instruksi pembayaran.</i>
    `;
    await sendTelegramNotification(message, undefined, `${siteUrl}/admin`, '👉 Buka Dashboard Admin');

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

  const adminSupabase = createAdminClient();

  try {
    // Join with profiles to get user email for display
    const { data, error } = await adminSupabase
      .from('transactions')
      .select('*')
      .eq('status', 'verifying')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const transactionsWithProfiles = await Promise.all((data || []).map(async (tx: any) => {
      const { data: profile } = await adminSupabase
        .from('profiles')
        .select('email')
        .eq('id', tx.user_id)
        .single();
      return { ...tx, profiles: profile };
    }));

    return { success: true, data: transactionsWithProfiles };
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

  const adminSupabase = createAdminClient();

  try {
    // 1. Get transaction details
    const { data: tx, error: txError } = await adminSupabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (txError || !tx) throw new Error('Transaksi tidak ditemukan');

    // 2. Get user profile
    const { data: profile, error: pError } = await adminSupabase
      .from('profiles')
      .select('credits, plan_expires_at')
      .eq('id', tx.user_id)
      .single();

    if (pError || !profile) throw new Error('Profil user tidak ditemukan');

    // 3. Determine credits
    let creditsToAdd = 0;
    if (tx.plan_name === 'Max') creditsToAdd = 50;
    else if (tx.plan_name === 'Pro') creditsToAdd = 30;
    else if (tx.plan_name === 'Plus') creditsToAdd = 10;
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
    const { error: updateError } = await adminSupabase
      .from('profiles')
      .update({ 
        credits: (profile.credits || 0) + creditsToAdd,
        plan_name: tx.plan_name,
        plan_expires_at: newExpiryDate.toISOString()
      })
      .eq('id', tx.user_id);

    if (updateError) throw updateError;

    const { error: statusError } = await adminSupabase
      .from('transactions')
      .update({ status: 'success' })
      .eq('id', transactionId);

    if (statusError) throw statusError;

    return { success: true, userId: tx.user_id };
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

  const adminSupabase = createAdminClient();

  try {
    const { data: tx, error: txError } = await adminSupabase
      .from('transactions')
      .select('user_id')
      .eq('id', transactionId)
      .single();

    const { error } = await adminSupabase
      .from('transactions')
      .update({ status: 'rejected' })
      .eq('id', transactionId);

    if (error) throw error;
    return { success: true, userId: tx?.user_id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Automatically cleanup transactions that are pending for more than 24 hours.
 */
async function cleanupTransactions() {
  const adminSupabase = createAdminClient();
  const yesterday = new Date();
  yesterday.setHours(yesterday.getHours() - 24);

  try {
    const { count, error } = await adminSupabase
      .from('transactions')
      .delete({ count: 'exact' })
      .eq('status', 'pending')
      .lt('created_at', yesterday.toISOString());
    
    if (error) throw error;
    if (count && count > 0) {
      console.log(`[Cleanup] Deleted ${count} expired pending transactions.`);
    }
  } catch (err) {
    console.error('[Cleanup Error]:', err);
  }
}

export async function getAdminStats() {
  const supabase = await createClient();
  const isAdmin = await checkIsAdmin(supabase);
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  // Trigger lazy cleanup when admin visits dashboard
  cleanupTransactions();

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
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const transactionsWithProfiles = await Promise.all((data || []).map(async (tx: any) => {
      const { data: profile } = await adminSupabase
        .from('profiles')
        .select('email')
        .eq('id', tx.user_id)
        .single();
      return { ...tx, profiles: profile };
    }));

    return { success: true, data: transactionsWithProfiles };
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
export async function updateUserAdmin(userId: string, updates: { credits?: number, plan_name?: string, plan_expires_at?: string | null }) {
  const supabase = await createClient();
  const isAdmin = await checkIsAdmin(supabase);
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  const adminSupabase = createAdminClient();

  try {
    const { error } = await adminSupabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
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
    const { data, error } = await adminSupabase
      .from('history')
      .select('*, ai_models(model_name)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const historyWithProfiles = await Promise.all((data || []).map(async (item: any) => {
      const { data: profile } = await adminSupabase
        .from('profiles')
        .select('email')
        .eq('id', item.user_id)
        .single();
      return { ...item, profiles: profile };
    }));

    return { success: true, data: historyWithProfiles };
  } catch (error: any) {
    console.error('getAllHistoryAdmin Final Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function updateTransactionProof(transactionId: string, proofUrl: string) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  
  try {
    // 1. Update proof_url and status to verifying
    const { error } = await supabase
      .from('transactions')
      .update({ 
        proof_url: proofUrl,
        status: 'verifying'
      })
      .eq('id', transactionId);

    if (error) throw error;

    // 2. Get Transaction & User Detail for Telegram
    const { data: tx } = await adminSupabase
      .from('transactions')
      .select('*, profiles(email)')
      .eq('id', transactionId)
      .single();

    if (tx) {
      const amount = (tx.amount + (tx.unique_code || 0)).toLocaleString('id-ID');
      const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const adminLink = `${siteUrl}/admin`;
      
      const message = `
<b>🔔 Bukti Bayar Baru!</b>
━━━━━━━━━━━━━━━━━━
<b>User:</b> ${tx.profiles?.email || 'Unknown'}
<b>Paket:</b> ${tx.plan_name}
<b>Total:</b> Rp ${amount}
<b>ID:</b> <code>${transactionId}</code>

<i>Silakan cek mutasi dan konfirmasi melalui tombol di bawah.</i>
      `;
      
      // Send to Telegram with Button
      await sendTelegramNotification(message, proofUrl, adminLink, '👉 Buka Dashboard Admin');
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createTicket(subject: string, message: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    // 1. Create Ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert([{
        user_id: user.id,
        subject,
        message,
        status: 'open'
      }])
      .select()
      .single();

    if (ticketError) throw ticketError;

    // 2. Create Initial Message
    const { error: msgError } = await supabase
      .from('ticket_messages')
      .insert([{
        ticket_id: ticket.id,
        sender_id: user.id,
        message: message
      }]);

    if (msgError) throw msgError;

    // 3. Send Telegram Notification
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const tgMessage = `
<b>🎫 Tiket Aduan Baru!</b>
━━━━━━━━━━━━━━━━━━
<b>User:</b> ${user.email}
<b>Subjek:</b> ${subject}
<b>Pesan:</b> <i>${message}</i>

<i>Silakan balas melalui dashboard admin.</i>
    `;
    await sendTelegramNotification(tgMessage, undefined, `${siteUrl}/admin`, '👉 Balas di Admin');

    return { success: true, data: ticket };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getTickets() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAllTicketsAdmin() {
  const supabase = await createClient();
  const isAdmin = await checkIsAdmin(supabase);
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  const adminSupabase = createAdminClient();

  try {
    const { data, error } = await adminSupabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const ticketsWithProfiles = await Promise.all((data || []).map(async (ticket: any) => {
      const { data: profile } = await adminSupabase
        .from('profiles')
        .select('email')
        .eq('id', ticket.user_id)
        .single();
      return { ...ticket, profiles: profile };
    }));

    return { success: true, data: ticketsWithProfiles };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTicketStatus(ticketId: string, status: string) {
  const supabase = await createClient();
  const isAdmin = await checkIsAdmin(supabase);
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  try {
    const { data: ticket } = await supabase
      .from('tickets')
      .update({ status })
      .eq('id', ticketId)
      .select('user_id')
      .single();

    return { success: true, userId: ticket?.user_id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getTicketMessages(ticketId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const { data, error } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    // Manual join-like mapping to profiles to avoid complex join syntax errors
    const messagesWithProfiles = await Promise.all((data || []).map(async (msg: any) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, role')
        .eq('id', msg.sender_id)
        .single();
      return { ...msg, profiles: profile };
    }));

    return { success: true, data: messagesWithProfiles };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function sendTicketMessage(ticketId: string, message: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const { error } = await supabase
      .from('ticket_messages')
      .insert([{
        ticket_id: ticketId,
        sender_id: user.id,
        message
      }]);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAIModelsAdmin() {
  const supabase = await createClient();
  const isAdmin = await checkIsAdmin(supabase);
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  try {
    const { data, error } = await supabase
      .from('ai_models')
      .select('*')
      .order('priority', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createAIModelAdmin(modelName: string, priority: number) {
  const supabase = await createClient();
  const isAdmin = await checkIsAdmin(supabase);
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  try {
    const { data, error } = await supabase
      .from('ai_models')
      .insert([{ model_name: modelName, priority, is_active: true }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateAIModelAdmin(id: string, updates: any) {
  const supabase = await createClient();
  const isAdmin = await checkIsAdmin(supabase);
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  try {
    const { error } = await supabase
      .from('ai_models')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAIModelAdmin(id: string) {
  const supabase = await createClient();
  const isAdmin = await checkIsAdmin(supabase);
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  try {
    const { error } = await supabase
      .from('ai_models')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAIErrorsAdmin() {
  const supabase = await createClient();
  const isAdmin = await checkIsAdmin(supabase);
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  // Use Admin Client to bypass RLS for logs
  const adminSupabase = createAdminClient();
  try {
    const { data, error } = await adminSupabase
      .from('ai_errors')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function clearAIErrorsAdmin() {
  const supabase = await createClient();
  const isAdmin = await checkIsAdmin(supabase);
  if (!isAdmin) return { success: false, error: 'Unauthorized' };

  // Use Admin Client to bypass RLS for logs
  const adminSupabase = createAdminClient();
  try {
    const { error } = await adminSupabase
      .from('ai_errors')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
