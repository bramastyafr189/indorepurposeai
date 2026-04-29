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
  Wallet,
  ChevronRight,
  Banknote,
  Check,
  Clock,
  Upload,
  Image as ImageIcon,
  Headphones,
  LifeBuoy
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { 
  initiateCheckout, 
  confirmPaymentSent, 
  cancelTransaction, 
  getProfile,
  updateTransactionProof 
} from '@/app/actions';
import { BUSINESS_CONFIG, openWhatsAppSupport } from '@/lib/config';

import { cn } from '@/lib/utils';
import Link from 'next/link';

type Step = 'method' | 'confirm' | 'instructions';

const PLANS = {
  'Starter': { price: 20000, color: 'amber' },
  'Plus': { price: 50000, color: 'blue' },
  'Pro': { price: 75000, color: 'indigo' }
} as const;

const METHODS = BUSINESS_CONFIG.payment.methods;

export default function CheckoutPage() {
  const params = useParams();
  const planName = params.planName as keyof typeof PLANS;
  const [step, setStep] = useState<Step>('method');
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showWAHelp, setShowWAHelp] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const activePlan = PLANS[planName] || PLANS['Pro'];
  const activeMethod = METHODS.find(m => m.id === selectedMethodId);

  useEffect(() => {
    if (step === 'instructions' && transaction) {
      const expiryTime = new Date(transaction.created_at).getTime() + 24 * 60 * 60 * 1000;
      
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const diff = expiryTime - now;
        
        if (diff <= 0) {
          setTimeLeft(0);
          clearInterval(timer);
        } else {
          setTimeLeft(diff);
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }

    // Check if 1 hour has passed for WA help button
    if (transaction && transaction.status === 'verifying') {
      const checkWA = () => {
        const hourInMs = 60 * 60 * 1000;
        const now = new Date().getTime();
        const created = new Date(transaction.created_at).getTime();
        if (now - created > hourInMs) {
          setShowWAHelp(true);
        }
      };
      checkWA();
      const interval = setInterval(checkWA, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [step, transaction]);

  const formatTimeLeft = (ms: number) => {
    if (ms === null || ms <= 0) return "Waktu Habis";
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours} Jam ${minutes} Menit ${seconds} Detik`;
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/');
      } else {
        // Auto-check for existing pending transaction without creating one
        const checkExisting = async () => {
          setLoading(true);
          const res = await getProfile();
          if (res.success && res.data.pendingTransaction && res.data.pendingTransaction.plan_name === planName) {
            setTransaction(res.data.pendingTransaction);
            setSelectedMethodId(res.data.pendingTransaction.payment_method);
            setStep('instructions');
          }
          setLoading(false);
        };
        checkExisting();
      }
    });
  }, [router, supabase.auth, planName, activePlan.price]);

  const goToConfirm = () => {
    if (!selectedMethodId) {
      toast.error('Silakan pilih metode pembayaran terlebih dahulu.');
      return;
    }
    setStep('confirm');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToInstructions = async () => {
    setLoading(true);
    const res = await initiateCheckout(planName, activePlan.price, selectedMethodId || undefined);
    if (res.success) {
      // Broadcast to Admin for new transaction
      supabase.channel('admin-global-updates').send({
        type: 'broadcast',
        event: 'new-transaction',
        payload: { order_id: res.data.order_id, plan: planName }
      });

      setTransaction(res.data);
      setStep('instructions');
    } else {
      toast.error(res.error || 'Gagal menyiapkan transaksi.');
    }
    setLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmSent = async () => {
    setConfirming(true);
    const res = await confirmPaymentSent(transaction.id);
    if (res.success) {
      toast.success('Konfirmasi berhasil!');
      router.push('/profile');
    } else {
      toast.error('Gagal melakukan konfirmasi.');
    }
    setConfirming(false);
  };

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    setUploadingProof(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${transaction.order_id}-${Math.random()}.${fileExt}`;
      const filePath = `proofs/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath);

      const res = await updateTransactionProof(transaction.id, publicUrl);
      if (res.success) {
        // Broadcast to Admin for proof upload
        supabase.channel('admin-global-updates').send({
          type: 'broadcast',
          event: 'new-transaction',
          payload: { order_id: transaction.order_id, type: 'proof_upload' }
        });

        toast.success('Bukti transfer berhasil diunggah!');
        setTransaction({ ...transaction, proof_url: publicUrl });
      } else {
        throw new Error(res.error);
      }
    } catch (error: any) {
      console.error('Upload Error:', error);
      toast.error('Gagal mengunggah bukti: ' + error.message);
    } finally {
      setUploadingProof(false);
    }
  };

  const openSupportTicket = () => {
    router.push(`/?support=true&orderId=${transaction.order_id}`);
  };

  const handleCancel = async () => {
    if (!confirm('Apakah Anda yakin ingin membatalkan pesanan ini?')) return;
    
    setConfirming(true);
    const res = await cancelTransaction(transaction.id);
    if (res.success) {
      toast.info('Pesanan berhasil dibatalkan.');
      router.push('/#pricing');
    } else {
      toast.error('Gagal membatalkan pesanan.');
    }
    setConfirming(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} disalin!`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 text-foreground transition-colors duration-500 font-sans">
      <Navbar />

      <main className="flex-1 py-12 md:py-24 px-6 relative z-10">
        <div className="container mx-auto max-w-4xl">
          {/* Header Step Indicator */}
          <div className="flex items-center justify-center gap-4 mb-16 max-w-xl mx-auto">
            <div className={cn("flex flex-col items-center gap-2 transition-all", step === 'method' ? "opacity-100 scale-110" : "opacity-40")}>
              <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-black text-xs">1</div>
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Metode</span>
            </div>
            <div className="h-px bg-slate-300 dark:bg-slate-800 flex-1 mb-6" />
            <div className={cn("flex flex-col items-center gap-2 transition-all", step === 'confirm' ? "opacity-100 scale-110" : "opacity-40")}>
              <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-black text-xs">2</div>
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Konfirmasi</span>
            </div>
            <div className="h-px bg-slate-300 dark:bg-slate-800 flex-1 mb-6" />
            <div className={cn("flex flex-col items-center gap-2 transition-all", step === 'instructions' ? "opacity-100 scale-110" : "opacity-40")}>
              <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-black text-xs">3</div>
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Transfer</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* STEP 1: METHOD SELECTION */}
            {step === 'method' && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Pilih Metode Pembayaran</h1>
                  <p className="text-slate-500 font-medium tracking-tight">Pilih cara ternyaman Anda untuk mengaktifkan paket {planName}.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {METHODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMethodId(m.id)}
                      className={cn(
                        "p-8 rounded-[2.5rem] border-2 text-left transition-all relative overflow-hidden group",
                        selectedMethodId === m.id 
                          ? "bg-white dark:bg-slate-900 border-blue-600 shadow-2xl shadow-blue-500/10" 
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                      )}
                    >
                      {selectedMethodId === m.id && (
                        <div className="absolute top-6 right-6 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white">
                          <Check size={14} strokeWidth={4} />
                        </div>
                      )}
                      
                      <div className="w-20 h-12 flex items-center justify-start mb-6 transition-transform group-hover:scale-105">
                        <img 
                          src={m.logo} 
                          alt={m.name} 
                          className="h-full w-auto object-contain object-left" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">{m.name}</h3>
                      <p className="text-sm text-slate-500 font-medium">Transfer manual ke {m.type === 'bank' ? 'Rekening' : 'E-Wallet'}</p>
                    </button>
                  ))}
                </div>

                <footer className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-12">
                  <Link href="/#pricing" className="text-slate-400 hover:text-slate-900 dark:hover:text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
                    <ArrowLeft size={16} /> Batal & Kembali
                  </Link>
                  <button
                    onClick={goToConfirm}
                    disabled={!selectedMethodId}
                    className="w-full sm:w-auto px-12 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl disabled:opacity-30 transition-all flex items-center justify-center gap-2"
                  >
                    Lanjutkan <ChevronRight size={18} />
                  </button>
                </footer>
              </motion.div>
            )}

            {/* STEP 2: CONFIRMATION */}
            {step === 'confirm' && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-xl mx-auto space-y-8"
              >
                <div className="text-center mb-12">
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Konfirmasi Detail</h1>
                  <p className="text-slate-500 font-medium tracking-tight">Mohon periksa kembali detail pesanan Anda sebelum lanjut.</p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 font-bold text-sm uppercase tracking-widest">Paket</span>
                    <span className="text-slate-900 dark:text-white font-black">IndoRepurpose {planName}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 font-bold text-sm uppercase tracking-widest">Metode</span>
                    <span className="text-slate-900 dark:text-white font-black">{activeMethod?.name}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4">
                    <span className="text-slate-900 dark:text-white font-black uppercase tracking-[0.2em] text-xs">Total Harga</span>
                    <span className="text-3xl font-black text-blue-600 tracking-tighter">Rp {activePlan.price.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-6 flex gap-4 border border-blue-100 dark:border-blue-900/20">
                  <Info className="text-blue-600 shrink-0" size={20} />
                  <p className="text-xs font-bold text-blue-800 dark:text-blue-400 leading-relaxed">
                    Pesanan Anda akan disimpan ke sistem setelah klik tombol di bawah. Segera lakukan transfer untuk aktivasi.
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <button
                    onClick={goToInstructions}
                    disabled={loading}
                    className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-500/30 flex items-center justify-center gap-3 active:scale-95"
                  >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <>Buat Pesanan & Bayar <ChevronRight size={18} /></>}
                  </button>
                  <button
                    onClick={() => setStep('method')}
                    className="w-full py-4 text-slate-400 hover:text-slate-900 dark:hover:text-white font-black text-xs uppercase tracking-widest text-center"
                  >
                    Ubah Metode Pembayaran
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: INSTRUCTIONS */}
            {step === 'instructions' && transaction && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid grid-cols-1 lg:grid-cols-5 gap-12"
              >
                <div className="lg:col-span-3 space-y-8">
                  <header>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-widest mb-4">
                      <CheckCircle2 size={14} />
                      Pesanan Berhasil Dibuat
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4 font-display">Selesaikan Pembayaran</h1>
                    <p className="text-slate-500 font-medium">Silakan transfer nominal tepat di bawah ini ke {activeMethod?.name}.</p>
                  </header>

                  {/* Final Amount Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 border-2 border-emerald-500/20 shadow-2xl relative overflow-hidden group">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center underline decoration-emerald-500 decoration-2 underline-offset-4">
                      Total Nominal (Wajib Persis)
                    </p>
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-400">Rp</span>
                        <span className="text-6xl md:text-7xl font-black text-emerald-600 tracking-tighter">
                          {(transaction.amount + (transaction.unique_code || 0)).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <button 
                        onClick={() => copyToClipboard((transaction.amount + (transaction.unique_code || 0)).toString(), 'Nominal')}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white transition-all text-xs font-black uppercase tracking-widest text-slate-500"
                      >
                        <Copy size={14} /> Salin Nominal
                      </button>
                    </div>

                    <div className="mt-8 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4 flex items-start gap-4">
                      <Info size={20} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                        PENTING: Gunakan 3 digit terakhir (**{transaction.unique_code}**) agar verifikasi bisa dilakukan lebih cepat.
                      </p>
                    </div>
                  </div>

                  {/* Target Account Card */}
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-14 flex items-center justify-center shrink-0">
                        <img 
                          src={activeMethod?.logo} 
                          alt={activeMethod?.name} 
                          className="w-full h-full object-contain" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{activeMethod?.name}</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{activeMethod?.account}</p>
                        <p className="text-xs text-slate-500 font-bold uppercase">{activeMethod?.holder}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => activeMethod && copyToClipboard(activeMethod.account.replace(/\s/g, ''), 'No Rekening')}
                      className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                    >
                      <Copy size={24} />
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6 sticky top-28 self-start">
                  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
                    <div className="space-y-6 mb-8 text-center sm:text-left">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Konfirmasi</h3>
                      <p className="text-sm text-slate-500 font-medium">Jika Anda sudah melakukan transfer, silakan klik tombol di bawah untuk konfirmasi ke Admin.</p>
                      
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-2">
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase flex items-center gap-2">
                           ID Transaksi
                        </span>
                        <div className="flex items-center justify-between gap-2 overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl">
                          <code className="text-[10px] font-bold text-blue-600 break-all">{transaction.order_id}</code>
                          <button 
                            onClick={() => copyToClipboard(transaction.order_id, 'ID Transaksi')}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors shrink-0"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {transaction.status === 'pending' ? (
                      <button 
                        onClick={handleConfirmSent}
                        disabled={confirming}
                        className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95"
                      >
                        {confirming ? <Loader2 size={20} className="animate-spin" /> : <>Saya Sudah Transfer <CheckCircle2 size={20} /></>}
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800 text-center">
                          <Loader2 size={32} className="mx-auto text-blue-600 animate-spin mb-4" />
                          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase mb-2">Menunggu Verifikasi</h4>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed">Admin sedang mengecek transferan Anda. Proses ini biasanya memakan waktu 5-15 menit.</p>
                        </div>

                        {/* Optional Upload Section */}
                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Upload Bukti Transfer (Opsional)</p>
                          {transaction.proof_url ? (
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 overflow-hidden shrink-0">
                                <img src={transaction.proof_url} alt="Proof" className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <p className="text-[10px] font-black text-emerald-600 uppercase truncate">Bukti Terunggah</p>
                                <p className="text-[8px] text-emerald-500 font-bold truncate">Akan mempercepat verifikasi admin</p>
                              </div>
                            </div>
                          ) : (
                            <div className="relative">
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleUploadProof}
                                disabled={uploadingProof}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                              />
                              <div className="py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                {uploadingProof ? (
                                  <Loader2 size={24} className="animate-spin text-blue-600" />
                                ) : (
                                  <>
                                    <Upload size={24} className="text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Pilih Foto Bukti</span>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Support Ticket - Only visible after 1 hour */}
                        {showWAHelp && (
                          <button 
                            onClick={openSupportTicket}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
                          >
                            <LifeBuoy size={16} /> Hubungi Admin via Tiket
                          </button>
                        )}
                        
                        <Link 
                          href="/profile"
                          className="block w-full py-4 text-slate-400 hover:text-slate-900 dark:hover:text-white font-black text-xs uppercase tracking-widest text-center"
                        >
                          Cek Riwayat Transaksi
                        </Link>
                      </div>
                    )}

                    {transaction.status === 'pending' && (
                      <button 
                        onClick={handleCancel}
                        disabled={confirming}
                        className="w-full py-4 text-slate-400 hover:text-red-500 font-black text-xs uppercase tracking-widest transition-all text-center"
                      >
                        Batalkan Pesanan
                      </button>
                    )}
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-lg flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bayar Dalam</p>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">
                        {timeLeft !== null ? formatTimeLeft(timeLeft) : 'Menghitung...'}
                      </p>
                      <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">
                        Batas: {new Date(new Date(transaction.created_at).getTime() + 24 * 60 * 60 * 1000).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })} WIB
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
}
