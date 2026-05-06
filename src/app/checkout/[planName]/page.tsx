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
  LifeBuoy,
  X,
  ShieldQuestion
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
  'Plus': { price: 20000, color: 'amber' },
  'Pro': { price: 50000, color: 'blue' },
  'Max': { price: 75000, color: 'indigo' }
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
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const activePlan = PLANS[planName] || PLANS['Pro'];
  const activeMethod = METHODS.find(m => m.id === selectedMethodId);

  useEffect(() => {
    if (step === 'instructions' && transaction) {
      const expiryTime = new Date(transaction.created_at).getTime() + 2 * 60 * 60 * 1000;
      
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

  const handleConfirmSent = () => {
    setShowConfirmModal(true);
  };

  const executeConfirmSent = async () => {
    setShowConfirmModal(false);
    setConfirming(true);
    const res = await confirmPaymentSent(transaction.id);
    if (res.success) {
      // Broadcast to Admin for payment confirmation (without proof yet)
      supabase.channel('admin-global-updates').send({
        type: 'broadcast',
        event: 'new-transaction',
        payload: { order_id: transaction.order_id, type: 'manual_confirmation' }
      });

      toast.success('Konfirmasi berhasil!');
      router.push('/profile');
    } else {
      toast.error('Gagal melakukan konfirmasi.');
    }
    setConfirming(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
      setPreviewFile(file);
      setShowPreviewModal(true);
    };
    reader.readAsDataURL(file);
    
    // Reset input value so same file can be selected again
    e.target.value = '';
  };

  const executeUpload = async () => {
    if (!previewFile) return;

    setUploadingProof(true);
    setShowPreviewModal(false);
    
    try {
      const fileExt = previewFile.name.split('.').pop();
      const fileName = `${transaction.order_id}-${Math.random()}.${fileExt}`;
      const filePath = `proofs/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, previewFile);

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
      setPreviewFile(null);
      setPreviewUrl(null);
    }
  };

  const openSupportTicket = () => {
    router.push(`/?support=true&orderId=${transaction.order_id}`);
  };

  const handleCancel = async () => {
    setShowCancelModal(false);
    
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
          <div className="flex items-center justify-center gap-1 sm:gap-4 mb-16 sm:mb-20 max-w-xl mx-auto">
            <div className="flex flex-col items-center relative">
              <div className={cn("w-10 h-10 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-black text-xs shadow-lg relative z-10 transition-all shrink-0", step === 'method' ? "scale-110" : "opacity-40")}>1</div>
              <span className="absolute top-full mt-2 text-[10px] font-black uppercase tracking-widest hidden sm:block whitespace-nowrap opacity-40">Metode</span>
            </div>
            <div className="h-px bg-slate-300 dark:bg-slate-800 flex-1 min-w-[20px]" />
            <div className="flex flex-col items-center relative">
              <div className={cn("w-10 h-10 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-black text-xs shadow-lg relative z-10 transition-all shrink-0", step === 'confirm' ? "scale-110" : "opacity-40")}>2</div>
              <span className="absolute top-full mt-2 text-[10px] font-black uppercase tracking-widest hidden sm:block whitespace-nowrap opacity-40">Konfirmasi</span>
            </div>
            <div className="h-px bg-slate-300 dark:bg-slate-800 flex-1 min-w-[20px]" />
            <div className="flex flex-col items-center relative">
              <div className={cn("w-10 h-10 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-black text-xs shadow-lg relative z-10 transition-all shrink-0", step === 'instructions' ? "scale-110" : "opacity-40")}>3</div>
              <span className="absolute top-full mt-2 text-[10px] font-black uppercase tracking-widest hidden sm:block whitespace-nowrap opacity-40">Transfer</span>
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
                <div className="text-center max-w-2xl mx-auto mb-8 md:mb-12 px-2">
                  <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-3 md:mb-4">Pilih Metode Pembayaran</h1>
                  <p className="text-slate-500 text-sm font-medium tracking-tight">Pilih cara ternyaman Anda untuk mengaktifkan paket {planName}.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {METHODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMethodId(m.id)}
                      className={cn(
                        "p-6 sm:p-8 rounded-[2.5rem] border-2 text-left transition-all relative overflow-hidden group",
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

                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
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
                className="w-full"
              >
                {transaction.status === 'expired' ? (
                  <div className="max-w-xl mx-auto text-center space-y-8 py-12">
                    <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-[2rem] flex items-center justify-center text-red-500 mx-auto">
                      <Clock size={48} />
                    </div>
                    <div>
                      <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Pesanan Kedaluwarsa</h1>
                      <p className="text-slate-500 font-medium leading-relaxed">
                        Batas waktu pembayaran 2 jam telah habis. Pesanan ini sudah tidak berlaku secara otomatis oleh sistem.
                      </p>
                    </div>
                    <Link 
                      href="/#pricing"
                      className="inline-flex items-center gap-3 px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                    >
                      Buat Pesanan Baru <ChevronRight size={18} />
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                <div className="lg:col-span-3 space-y-8">
                  <header>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-4">
                      <CheckCircle2 size={12} />
                      Pesanan Berhasil Dibuat
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-3 md:mb-4 font-display">Selesaikan Pembayaran</h1>
                    <p className="text-slate-500 text-sm font-medium">Silakan transfer nominal tepat di bawah ini ke {activeMethod?.name}.</p>
                  </header>

                  {/* Final Amount Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-10 border-2 border-emerald-500/20 shadow-2xl relative overflow-hidden group">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center underline decoration-emerald-500 decoration-2 underline-offset-4">
                      Total Nominal (Wajib Persis)
                    </p>
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex items-baseline gap-2 max-w-full overflow-hidden">
                        <span className="text-xl md:text-2xl font-black text-slate-400">Rp</span>
                        <span className="text-4xl sm:text-5xl md:text-7xl font-black text-emerald-600 tracking-tighter truncate">
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
                  <div className="bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 sm:gap-6">
                    <div className="flex items-center gap-3 sm:gap-6 min-w-0">
                      <div className="w-12 h-8 sm:w-24 sm:h-14 flex items-center justify-center shrink-0 bg-slate-50 dark:bg-slate-800/50 rounded-lg sm:rounded-2xl p-1">
                        <img 
                          src={activeMethod?.logo} 
                          alt={activeMethod?.name} 
                          className="w-full h-full object-contain" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1 truncate">{activeMethod?.name}</p>
                        <p className="text-sm sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">{activeMethod?.account}</p>
                        <p className="text-[9px] sm:text-xs text-slate-500 font-bold uppercase truncate">{activeMethod?.holder}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => activeMethod && copyToClipboard(activeMethod.account.replace(/\s/g, ''), 'No Rekening')}
                      className="p-3 sm:p-4 bg-slate-100 dark:bg-slate-800 rounded-xl sm:rounded-2xl hover:bg-emerald-600 hover:text-white text-slate-500 transition-all shadow-sm shrink-0 active:scale-95"
                    >
                      <Copy size={18} className="sm:hidden" />
                      <Copy size={24} className="hidden sm:block" />
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-28 self-start">
                  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
                    <div className="space-y-6 mb-8 text-center sm:text-left">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Konfirmasi</h3>
                      <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">Jika Anda sudah melakukan transfer, silakan klik tombol di bawah untuk konfirmasi ke Admin agar verifikasi bisa dilakukan lebih cepat.</p>
                    </div>

                    {transaction.status === 'pending' ? (
                      <div className="space-y-6">
                        {/* Optional Upload Section Before Confirm */}
                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Upload Bukti Transfer (Opsional)</p>
                          {transaction.proof_url ? (
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800 flex items-center justify-between gap-3 relative overflow-hidden group">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 overflow-hidden shrink-0">
                                  <img src={transaction.proof_url} alt="Proof" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                  <p className="text-[10px] font-black text-emerald-600 uppercase truncate">Bukti Terunggah</p>
                                  <p className="text-[8px] text-emerald-500 font-bold truncate">Siap untuk dikonfirmasi</p>
                                </div>
                              </div>
                              <div className="relative z-10 shrink-0">
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                onChange={handleFileSelect}
                                  disabled={uploadingProof}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                  title="Ganti Bukti Transfer"
                                />
                                <button className="px-3 py-2 bg-emerald-100 dark:bg-emerald-800/50 hover:bg-emerald-200 dark:hover:bg-emerald-700 text-emerald-700 dark:text-emerald-300 rounded-xl transition-colors text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                  {uploadingProof ? <Loader2 size={14} className="animate-spin" /> : <>Ganti <Upload size={14} /></>}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="relative">
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleFileSelect}
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

                        <button 
                          onClick={handleConfirmSent}
                          disabled={confirming}
                          className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95"
                        >
                          {confirming ? <Loader2 size={20} className="animate-spin" /> : <>Saya Sudah Transfer <CheckCircle2 size={20} /></>}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800 text-center">
                          <Loader2 size={32} className="mx-auto text-blue-600 animate-spin mb-4" />
                          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase mb-2">Menunggu Verifikasi</h4>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed">Admin sedang mengecek transferan Anda. Proses ini biasanya memakan waktu 5-15 menit.</p>
                        </div>

                        {/* Upload Section Also Available Here in Case They Haven't */}
                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Upload Bukti Transfer (Opsional)</p>
                          {transaction.proof_url ? (
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800 flex items-center justify-between gap-3 relative overflow-hidden group">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 overflow-hidden shrink-0">
                                  <img src={transaction.proof_url} alt="Proof" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                  <p className="text-[10px] font-black text-emerald-600 uppercase truncate">Bukti Terunggah</p>
                                  <p className="text-[8px] text-emerald-500 font-bold truncate">Membantu mempercepat verifikasi admin</p>
                                </div>
                              </div>
                              <div className="relative z-10 shrink-0">
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                onChange={handleFileSelect}
                                  disabled={uploadingProof}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                  title="Ganti Bukti Transfer"
                                />
                                <button className="px-3 py-2 bg-emerald-100 dark:bg-emerald-800/50 hover:bg-emerald-200 dark:hover:bg-emerald-700 text-emerald-700 dark:text-emerald-300 rounded-xl transition-colors text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                  {uploadingProof ? <Loader2 size={14} className="animate-spin" /> : <>Ganti <Upload size={14} /></>}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="relative">
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleFileSelect}
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
                        onClick={() => setShowCancelModal(true)}
                        disabled={confirming}
                        className="w-full py-4 text-slate-400 hover:text-red-500 font-black text-xs uppercase tracking-widest transition-all text-center"
                      >
                        Batalkan Pesanan
                      </button>
                    )}
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 shrink-0">
                      <Clock size={24} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Batas Waktu Bayar</p>
                      <p className="text-base font-black text-emerald-600 dark:text-emerald-400 animate-pulse truncate">
                        {timeLeft !== null ? formatTimeLeft(timeLeft) : 'Menghitung...'}
                      </p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 truncate">
                        Hingga: {new Date(new Date(transaction.created_at).getTime() + 2 * 60 * 60 * 1000).toLocaleString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })} WIB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {showPreviewModal && previewUrl && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowPreviewModal(false);
                setPreviewFile(null);
                setPreviewUrl(null);
              }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20 dark:border-slate-800"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                    <ImageIcon size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Konfirmasi Bukti</h3>
                    <p className="text-xs text-slate-500 font-medium">Pastikan foto terlihat jelas</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowPreviewModal(false);
                    setPreviewFile(null);
                    setPreviewUrl(null);
                  }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Preview Image */}
              <div className="p-6">
                <div className="aspect-[4/3] w-full rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20 flex gap-3">
                  <ShieldQuestion className="text-blue-600 shrink-0" size={18} />
                  <p className="text-[11px] font-bold text-blue-800 dark:text-blue-400 leading-relaxed">
                    Bukti ini akan membantu Admin memproses pesanan Anda lebih cepat. Gunakan foto asli dari aplikasi bank atau struk ATM.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 pt-0 flex gap-3">
                <button 
                  onClick={() => {
                    setShowPreviewModal(false);
                    setPreviewFile(null);
                    setPreviewUrl(null);
                  }}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Batal
                </button>
                <button 
                  onClick={executeUpload}
                  disabled={uploadingProof}
                  className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                >
                  {uploadingProof ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Unggah Sekarang
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCancelModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="space-y-6">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-500">
                  <Clock size={32} />
                </div>
                
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Batalkan Pesanan?</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    Pesanan Anda akan dibatalkan secara permanen. Apakah Anda yakin?
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    Lanjutkan Bayar
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-500/25 active:scale-95"
                  >
                    Ya, Batalkan
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {/* Transfer Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="space-y-6">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600">
                  <Banknote size={32} />
                </div>
                
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Sudah Transfer?</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    Pastikan Anda telah melakukan transfer dengan nominal yang **tepat** (termasuk kode unik) agar verifikasi otomatis berjalan lancar.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    Cek Lagi
                  </button>
                  <button
                    onClick={executeConfirmSent}
                    disabled={confirming}
                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/25 active:scale-95 flex items-center justify-center gap-2"
                  >
                    {confirming ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                    Ya, Sudah
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
