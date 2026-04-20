"use server";

// @ts-ignore
import Midtrans from 'midtrans-client';
import { createClient } from '@/utils/supabase/server';

const snap = new Midtrans.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '',
});

export async function createTransaction(planName: string, amount: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Silakan login terlebih dahulu.' };
  }

  const orderId = `ORDER-${planName.toUpperCase()}-${user.id.slice(0, 8)}-${Date.now()}`;

  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: amount,
    },
    customer_details: {
      email: user.email,
    },
    item_details: [
      {
        id: planName.toLowerCase(),
        price: amount,
        quantity: 1,
        name: `Paket ${planName} - IndoRepurpose AI`,
      },
    ],
    metadata: {
      user_id: user.id,
      plan_name: planName,
    },
  };

  try {
    const transaction = await snap.createTransaction(parameter);
    return { success: true, token: transaction.token, orderId };
  } catch (error: any) {
    console.error('Midtrans Error:', error);
    return { success: false, error: error.message };
  }
}
