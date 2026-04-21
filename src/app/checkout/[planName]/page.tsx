'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Copy, 
  CreditCard, 
  ExternalLink, 
  Info, 
  Loader2, 
  MessageSquare, 
  ShieldCheck, 
  Smartphone, 
  Wallet 
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { confirmPaymentSent } from '@/app/actions';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function CheckoutPage() {
  const params = useParams();
  const planName = params.planName as string;
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchTransaction() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('plan_name', planName)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        toast.error('Data transaksi tidak ditemukan.');
        router.push('/#pricing');
        return;
      }

      setTransaction(data);
      setLoading(false);
    }

    fetchTransaction();
  }, [planName, router]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} disalin!`);
  };

  const handleConfirm = async () => {
    setConfirming(true);
    const res = await confirmPaymentSent(transaction.id);
    if (res.success) {
      toast.success('Konfirmasi berhasil! Mengarahkan ke WhatsApp...');
      
      const phoneNumber = "628123456789"; // GANTI DENGAN NOMOR ANDA
      const totalAmount = (transaction.amount + (transaction.unique_code || 0)).toLocaleString('id-ID');
      const message = `Halo Admin IndoRepurpose AI, saya telah melakukan transfer untuk paket *${transaction.plan_name}*.%0A%0AEmail: ${transaction.user_email || 'User'}%0AID Transaksi: ${transaction.order_id}%0ANominal: *Rp ${totalAmount}*%0A%0A[Lampirkan Bukti Transfer]`;
      
      window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
      router.push('/profile');
    } else {
      toast.error('Gagal melakukan konfirmasi.');
    }
    setConfirming(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 font-sans">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-bold animate-pulse">Menyiapkan Detail Pembayaran...</p>
      </div>
    );
  }

  const baseAmount = transaction.amount;
  const uniqueCode = transaction.unique_code || 0;
  const totalAmount = baseAmount + uniqueCode;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 text-foreground transition-colors duration-500 font-sans">
      <Navbar />

      <main className="flex-1 py-12 md:py-24 px-6 relative z-10">
        <div className="container mx-auto max-w-4xl">
          <Link 
            href="/#pricing"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors mb-10 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Batal & Kembali
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Left Column: Instructions */}
            <div className="lg:col-span-3 space-y-8">
              <header>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest mb-4">
                  <ShieldCheck size={14} />
                  Amankan Akses Anda
                </div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4 font-display">
                  Selesaikan Pembayaran
                </h1>
                <p className="text-slate-500 font-medium">
                  Transfer tepat sesuai nominal hingga 3 digit terakhir untuk aktivasi otomatis yang lebih cepat.
                </p>
              </header>

              {/* Amount Card */}
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 border-2 border-blue-600/20 dark:border-blue-500/20 shadow-2xl shadow-blue-500/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                  <CreditCard size={180} />
                </div>
                
                <div className="relative z-10">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 text-center underline decoration-blue-500 decoration-2 underline-offset-4">
                    Total Yang Harus Dibayar
                  </p>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-400">Rp</span>
                      <span className="text-6xl md:text-7xl font-black text-blue-600 tracking-tighter">
                        {totalAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(totalAmount.toString(), 'Nominal')}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white transition-all text-xs font-black uppercase tracking-widest text-slate-500"
                    >
                      <Copy size={14} />
                      Salin Nominal
                    </button>
                  </div>
                </div>

                <div className="mt-8 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4 flex items-start gap-4">
                  <Info size={20} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                    PENTING: Pastikan nominal transfer sama persis! 3 digit terakhir (**{uniqueCode}**) adalah kode unik identifikasi Anda.
                  </p>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3 ml-2">
                   Pilih Rekening Tujuan
                </h3>
                
                {/* BCA Card */}
                <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex items-center justify-between group hover:border-blue-500/30 transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white font-black text-sm italic shrink-0">
                      BCA
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Bank Central Asia</p>
                      <p className="text-xl font-black text-slate-900 dark:text-white">1234 - 5678 - 90</p>
                      <p className="text-xs text-slate-500 font-bold uppercase">A.N. [NAMA ANDA]</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => copyToClipboard('1234567890', 'No Rekening')}
                    className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-blue-600 hover:text-white transition-all group-hover:scale-110"
                  >
                    <Copy size={20} />
                  </button>
                </div>

                {/* Mandiri Card */}
                <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex items-center justify-between group hover:border-blue-500/30 transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-10 bg-amber-500 rounded-lg flex items-center justify-center text-white font-black text-sm italic shrink-0">
                      MANDIRI
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Bank Mandiri</p>
                      <p className="text-xl font-black text-slate-900 dark:text-white">9876 - 5432 - 10</p>
                      <p className="text-xs text-slate-500 font-bold uppercase">A.N. [NAMA ANDA]</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => copyToClipboard('9876543210', 'No Rekening')}
                    className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-blue-600 hover:text-white transition-all group-hover:scale-110"
                  >
                    <Copy size={20} />
                  </button>
                </div>

                {/* GoPay Card */}
                <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white shrink-0">
                      <Wallet size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">E-Wallet GoPay</p>
                      <p className="text-xl font-black text-slate-900 dark:text-white">0812 - 3456 - 7890</p>
                      <p className="text-xs text-slate-500 font-bold uppercase">A.N. [NAMA ANDA]</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => copyToClipboard('081234567890', 'Nomor GoPay')}
                    className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-emerald-600 hover:text-white transition-all group-hover:scale-110"
                  >
                    <Copy size={20} />
                  </button>
                </div>

                {/* ShopeePay Card */}
                <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex items-center justify-between group hover:border-orange-500/30 transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-10 bg-orange-600 rounded-lg flex items-center justify-center text-white shrink-0">
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-1">E-Wallet ShopeePay</p>
                      <p className="text-xl font-black text-slate-900 dark:text-white">0812 - 3456 - 7890</p>
                      <p className="text-xs text-slate-500 font-bold uppercase">A.N. [NAMA ANDA]</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => copyToClipboard('081234567890', 'Nomor ShopeePay')}
                    className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-orange-600 hover:text-white transition-all group-hover:scale-110"
                  >
                    <Copy size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Summary & Button */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 sticky top-28">
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest text-xs">Ringkasan Pesanan</h3>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-slate-500">Paket Terpilih</span>
                    <span className="text-slate-900 dark:text-white font-black">{transaction.plan_name}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-slate-500">Harga Dasar</span>
                    <span className="text-slate-900 dark:text-white font-bold">Rp {baseAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-slate-500">Kode Unik</span>
                    <span className="text-blue-600 font-bold">+{uniqueCode}</span>
                  </div>
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-base font-black text-slate-900 dark:text-white">Total</span>
                    <span className="text-xl font-black text-blue-600">Rp {totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={handleConfirm}
                    disabled={confirming}
                    className="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-500/30 flex items-center justify-center gap-3 leading-none"
                  >
                    {confirming ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 size={20} />
                        Saya Sudah Transfer
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-tighter">
                    Klik tombol di atas untuk aktivasi & konfirmasi WA
                  </p>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex gap-4 items-center opacity-60">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <ExternalLink size={16} />
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                      Butuh bantuan? Tim kami tersedia 24/7 untuk membantu aktivasi akun Anda.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
