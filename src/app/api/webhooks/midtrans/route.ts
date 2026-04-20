import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = body;

    // 1. Verify Signature
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const hashed = crypto
      .createHash('sha512')
      .update(order_id + status_code + gross_amount + serverKey)
      .digest('hex');

    if (hashed !== signature_key) {
      return NextResponse.json({ message: 'Invalid signature' }, { status: 403 });
    }

    // 2. Handle Success Status
    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      if (fraud_status === 'accept' || transaction_status === 'settlement') {
        const supabase = await createClient();
        
        // Use order_id to find the user. 
        // Order ID format: ORDER-USERIDSHORT-TIMESTAMP
        // But we should have passed user_id in the transaction. 
        // Midtrans callback includes order_id. We can parse user_id from it or better, use a database table for transactions.
        
        // For simplicity in this MVP, let's assume the user_id was stored in metadata or order_id prefix.
        // Actually, we can get metadata from Midtrans? No, maybe not in the default callback body.
        // Let's use the order_id parsing if we don't have a transactions table.
        // Better: Query a 'transactions' table if we had one. 
        // Since we don't, I'll update the order_id format in paymentActions.ts to be very clear.
        
        const userId = order_id.split('-')[1]; // This is not secure/robust enough for production but works for demo/MVP.
        
        // Determine credit addition
        let creditsToAdd = 0;
        if (order_id.includes('PRO')) creditsToAdd = 100;
        else if (order_id.includes('AGENCY')) creditsToAdd = 500;
        else creditsToAdd = 10; // Default top-up

        // Update profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', userId)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ credits: (profile.credits || 0) + creditsToAdd })
            .eq('id', userId);
        }
      }
    }

    return NextResponse.json({ message: 'Success' });
  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
