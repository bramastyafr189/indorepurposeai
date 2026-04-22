'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Calendar, Zap, Shield, Sparkles, 
  CreditCard, ArrowLeft, Loader2, CheckCircle2, 
  Clock, ChevronRight, Check, X, Download, Copy,
  Wallet, Smartphone, Banknote, AlertCircle, ExternalLink,
  Upload, MessageSquare, Loader2 as LoaderIcon
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { 
  getProfile, 
  getTransactionHistory, 
  cancelTransaction, 
  updateTransactionProof 
} from '../actions';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview');
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [showWAHelp, setShowWAHelp] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const printRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    const [profileRes, transRes] = await Promise.all([
      getProfile(),
      getTransactionHistory()
    ]);

    if (profileRes.success) {
      setProfile(profileRes.data);
    } else {
      router.push('/');
    }

    if (transRes.success) {
      setTransactions(transRes.data || []);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [router]);

  // Timer for pending transaction
  useEffect(() => {
    if (profile?.pendingTransaction && profile.pendingTransaction.status === 'pending') {
      const expiryTime = new Date(profile.pendingTransaction.created_at).getTime() + 24 * 60 * 60 * 1000;
      
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
    if (profile?.pendingTransaction && profile.pendingTransaction.status === 'verifying') {
      const checkWA = () => {
        const hourInMs = 60 * 60 * 1000;
        const now = new Date().getTime();
        const created = new Date(profile.pendingTransaction.created_at).getTime();
        if (now - created > hourInMs) {
          setShowWAHelp(true);
        }
      };
      checkWA();
      const interval = setInterval(checkWA, 60000);
      return () => clearInterval(interval);
    }
  }, [profile?.pendingTransaction]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 font-sans">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Baru Saja';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTimeLeft = (ms: number) => {
    if (ms <= 0) return "Waktu Habis";
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours}:${minutes}:${seconds}`;
  };

  const handleCancelTx = async (id: string) => {
    if (!confirm('Batalkan pesanan ini?')) return;
    setCancelling(true);
    const res = await cancelTransaction(id);
    if (res.success) {
      toast.success('Pesanan dibatalkan.');
      loadData();
    } else {
      toast.error('Gagal membatalkan.');
    }
    setCancelling(false);
  };

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.pendingTransaction) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    setUploadingProof(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.pendingTransaction.order_id}-${Math.random()}.${fileExt}`;
      const filePath = `proofs/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath);

      const res = await updateTransactionProof(profile.pendingTransaction.id, publicUrl);
      if (res.success) {
        toast.success('Bukti transfer berhasil diunggah!');
        loadData(); // Refresh profile to show proof
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

  const openWhatsApp = () => {
    if (!profile?.pendingTransaction) return;
    const phoneNumber = "628123456789";
    const tx = profile.pendingTransaction;
    const totalAmountWithCode = (tx.amount + (tx.unique_code || 0)).toLocaleString('id-ID');
    const message = `Halo Admin IndoRepurpose AI, saya ingin menanyakan status verifikasi paket *${tx.plan_name}* saya.%0A%0AEmail: ${profile.email || 'User'}%0AID Transaksi: ${tx.order_id}%0ANominal: *Rp ${totalAmountWithCode}*`;
    
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const getMethodIcon = (method: string) => {
    if (!method) return Banknote;
    if (method.includes('pay')) return Wallet;
    if (['gopay', 'shopeepay'].includes(method.toLowerCase())) return Smartphone;
    return Banknote;
  };

  const planColors: any = {
    'Free': 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    'Pro': 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
    'Agency': 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400'
  };

  const planIcons: any = {
    'Free': Zap,
    'Pro': Sparkles,
    'Agency': Shield
  };

  const PlanIcon = planIcons[profile?.plan_name || 'Free'] || Zap;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 text-foreground transition-colors duration-500 font-sans print:bg-white print:text-black">
      <Navbar />

      <main className="flex-1 py-12 md:py-20 px-6 relative z-10 print:p-0">
        <div className="container mx-auto max-w-5xl print:max-w-none">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors mb-10 group print:hidden"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Kembali ke Beranda
          </Link>

          <header className="mb-12 print:hidden">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2 font-display">Akun Saya</h1>
            <p className="text-slate-500 font-medium">Kelola langganan dan pantau riwayat pembayaran Anda.</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Sidebar / User Info */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-4 space-y-6 sticky top-28 self-start print:hidden"
            >
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none text-center">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 mx-auto flex items-center justify-center text-white text-3xl font-black mb-6 border-4 border-slate-50 dark:border-slate-800 shadow-xl shadow-blue-500/20 rotate-3">
                  {profile?.email?.[0].toUpperCase()}
                </div>
                <h2 className="text-xl font-black mb-1 text-slate-900 dark:text-white truncate">
                  {profile?.email?.split('@')[0]}
                </h2>
                <p className="text-slate-500 text-sm font-medium mb-6 truncate">{profile?.email}</p>
                
                <div className={cn(
                  "inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest",
                  planColors[profile?.plan_name || 'Free']
                )}>
                  <PlanIcon size={14} />
                  Paket {profile?.plan_name || 'Free'}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none font-medium">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Informasi Akun</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Mail size={16} className="text-blue-500" />
                    </div>
                    <span className="text-sm truncate">{profile?.email}</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Calendar size={16} className="text-blue-500" />
                    </div>
                    <span className="text-sm">Terdaftar {formatDate(profile?.created_at)}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Main Content Area */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-8 space-y-8"
            >
              {/* Tabs */}
              <div className="flex gap-4 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl w-fit font-black text-xs uppercase tracking-widest print:hidden">
                <button 
                  onClick={() => setActiveTab('overview')}
                  className={cn(
                    "px-6 py-3 rounded-xl transition-all",
                    activeTab === 'overview' ? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  Ringkasan
                </button>
                <button 
                  onClick={() => setActiveTab('transactions')}
                  className={cn(
                    "px-6 py-3 rounded-xl transition-all",
                    activeTab === 'transactions' ? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  Transaksi
                </button>
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'overview' ? (
                  <motion.div 
                    key="overview"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    {/* PENDING TRANSACTION ALERT */}
                    {profile?.pendingTransaction && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-amber-50 dark:bg-transparent backdrop-blur-xl border-2 border-amber-200 dark:border-amber-900/30 rounded-[2.5rem] p-8 relative overflow-hidden group shadow-xl shadow-amber-500/5"
                      >
                         <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform duration-700">
                          <AlertCircle size={150} className="text-amber-500" />
                        </div>
                        
                        <div className="relative z-10">
                          <div className="flex items-start justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                                <Clock size={20} className="animate-pulse" />
                              </div>
                              <div>
                                <h3 className="text-lg font-black text-amber-900 dark:text-amber-400 uppercase tracking-tight leading-none">
                                  Menunggu Pembayaran
                                </h3>
                                <p className="text-xs font-bold text-amber-600 dark:text-amber-500 mt-1 uppercase tracking-widest">
                                  ID: {profile.pendingTransaction.order_id.slice(-8)}
                                </p>
                              </div>
                            </div>
                            
                            {profile.pendingTransaction.status === 'pending' && timeLeft !== null && (
                              <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Berakhir Dalam</p>
                                <p className="text-xl font-black text-amber-700 dark:text-amber-300 font-mono">
                                  {formatTimeLeft(timeLeft)}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="bg-white/50 dark:bg-black/20 rounded-2xl p-6 mb-8 border border-amber-200/50 dark:border-amber-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Paket Pilihan</p>
                              <p className="text-xl font-black text-slate-900 dark:text-white uppercase leading-none mt-1">
                                {profile.pendingTransaction.plan_name}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest leading-none">Total Tagihan</p>
                              <p className="text-2xl font-black text-amber-600 mt-1">
                                Rp {(profile.pendingTransaction.amount + (profile.pendingTransaction.unique_code || 0)).toLocaleString('id-ID')}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-4">
                            {profile.pendingTransaction.status === 'pending' ? (
                              <>
                                <Link 
                                  href={`/checkout/${profile.pendingTransaction.plan_name}`}
                                  className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-amber-500/25 flex items-center gap-2"
                                >
                                  Selesaikan Pembayaran <ChevronRight size={18} />
                                </Link>
                                <button 
                                  onClick={() => handleCancelTx(profile.pendingTransaction.id)}
                                  disabled={cancelling}
                                  className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-500 hover:text-red-500 rounded-2xl font-black text-sm uppercase tracking-widest transition-all border border-slate-200 dark:border-slate-700"
                                >
                                  {cancelling ? <Loader2 size={18} className="animate-spin" /> : 'Batalkan'}
                                </button>
                              </>
                            ) : (
                              <div className="w-full space-y-6">
                                <div className="flex flex-col sm:flex-row items-center gap-4 p-6 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 rounded-3xl">
                                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
                                    <LoaderIcon size={24} className="animate-spin" />
                                  </div>
                                  <div className="text-center sm:text-left">
                                    <h4 className="text-sm font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-tight">Sedang Diverifikasi</h4>
                                    <p className="text-xs text-emerald-600 dark:text-emerald-500 font-medium leading-relaxed">Admin sedang mengecek transferan Anda (5-15 menit).</p>
                                  </div>
                                </div>

                                {/* Optional Upload Section in Profile */}
                                <div className="space-y-3">
                                  <p className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">Unggah Bukti Transfer (Opsional)</p>
                                  {profile.pendingTransaction.proof_url ? (
                                    <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-amber-200 dark:border-amber-800/50 flex items-center gap-3">
                                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 overflow-hidden shrink-0">
                                        <img src={profile.pendingTransaction.proof_url} alt="Proof" className="w-full h-full object-cover" />
                                      </div>
                                      <div className="flex-1 overflow-hidden">
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-tight">Bukti Terunggah</p>
                                        <p className="text-[8px] text-slate-400 font-bold">Akan mempercepat verifikasi admin</p>
                                      </div>
                                      <CheckCircle2 size={20} className="text-emerald-500" />
                                    </div>
                                  ) : (
                                    <div className="relative group">
                                      <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleUploadProof}
                                        disabled={uploadingProof}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                      />
                                      <div className="py-6 border-2 border-dashed border-amber-300 dark:border-amber-800/50 rounded-2xl flex flex-col items-center justify-center gap-2 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all">
                                        {uploadingProof ? (
                                          <Loader2 size={24} className="animate-spin text-amber-500" />
                                        ) : (
                                          <>
                                            <Upload size={24} className="text-amber-500" />
                                            <span className="text-[10px] font-bold text-amber-600 uppercase">Klik untuk Pilih Foto Bukti</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {showWAHelp && (
                                  <button 
                                    onClick={openWhatsApp}
                                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                                  >
                                    <MessageSquare size={18} /> Hubungi Admin via WA
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Credit Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group print:hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform duration-700">
                        <Zap size={150} className="text-blue-600" />
                      </div>
                      
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                              <CreditCard size={20} />
                            </div>
                            Kredit Saat Ini
                          </h3>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2 mb-8">
                          <span className="text-7xl font-black text-blue-600 tracking-tighter">
                            {profile?.credits || 0}
                          </span>
                          <span className="text-xl font-bold text-slate-400 mb-3">Unit Kredit</span>
                        </div>

                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-10">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(((profile?.credits || 0) / 100) * 100, 100)}%` }}
                            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
                          />
                        </div>

                        <div className="flex flex-wrap gap-4">
                          <Link 
                            href="/#transform"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98]"
                          >
                            Mulai Repurpose Konten <Sparkles size={18} />
                          </Link>
                          <Link 
                            href="/#pricing"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl font-black text-sm uppercase tracking-widest transition-all border border-slate-200 dark:border-slate-700 active:scale-[0.98]"
                          >
                            Isi Ulang Kredit
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Active Plan Perks */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden print:hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                        <PlanIcon size={120} />
                      </div>
                      <h3 className="text-xl font-black mb-2 tracking-tight">Manfaat Paket {profile?.plan_name || 'Free'}</h3>
                      <p className="text-slate-400 font-medium mb-8 max-w-sm">
                        {profile?.plan_name === 'Agency' 
                          ? 'Mendukung pengelolaan 10+ brand sekaligus dengan AI prioritas.'
                          : profile?.plan_name === 'Pro'
                          ? 'Hasil transformasi lebih natural dengan dukungan Brand Voice.'
                          : 'Sempurna untuk kreator konten pemula yang ingin mencoba AI.'}
                      </p>
                      <div className="flex items-center gap-2 text-blue-400 font-black text-xs uppercase tracking-widest">
                        <span>Akses Penuh</span>
                        <CheckCircle2 size={14} />
                      </div>

                      {profile?.plan_expires_at && (
                        <div className="mt-8 pt-8 border-t border-white/10 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-blue-400">
                            <Clock size={16} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Berakhir Pada</p>
                            <p className="text-sm font-bold">{formatDate(profile.plan_expires_at)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="transactions"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4 print:hidden"
                  >
                    {transactions.length > 0 ? (
                      transactions.map((tx) => (
                        <button 
                          key={tx.id}
                          onClick={() => setSelectedTx(tx)}
                          className="w-full text-left bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between group hover:border-blue-500 transition-all hover:translate-x-1"
                        >
                          <div className="flex items-center gap-5">
                            <div className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                              tx.status === 'success' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500" :
                              (tx.status === 'cancelled' || tx.status === 'rejected') ? "bg-red-50 dark:bg-red-500/10 text-red-500" :
                              tx.status === 'expired' ? "bg-slate-100 dark:bg-slate-500/10 text-slate-500" :
                              "bg-amber-50 dark:bg-amber-500/10 text-amber-500"
                            )}>
                              {tx.status === 'success' ? <Check size={24} /> : 
                               (tx.status === 'cancelled' || tx.status === 'rejected' || tx.status === 'expired') ? <X size={24} /> : 
                               <Clock size={24} />}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Paket {tx.plan_name}</p>
                              <p className="text-xs text-slate-500 font-medium lowercase">
                                {tx.order_id.slice(-8)} • {new Date(tx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm font-black text-slate-900 dark:text-white">
                                Rp {(tx.amount + (tx.unique_code || 0)).toLocaleString('id-ID')}
                              </p>
                              <p className={cn(
                                "text-[10px] font-black uppercase tracking-widest",
                                tx.status === 'success' ? "text-emerald-500" :
                                tx.status === 'cancelled' ? "text-slate-400" :
                                tx.status === 'rejected' ? "text-red-500" :
                                tx.status === 'expired' ? "text-amber-700" :
                                "text-amber-500"
                              )}>
                                {tx.status === 'success' ? 'Sukses' : 
                                 tx.status === 'cancelled' ? 'Dibatalkan' : 
                                 tx.status === 'rejected' ? 'Ditolak' : 
                                 tx.status === 'expired' ? 'Kedaluwarsa' : 'Proses'}
                              </p>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <CreditCard className="mx-auto text-slate-300 mb-4" size={48} />
                        <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest">Belum Ada Transaksi</h3>
                        <p className="text-slate-500 text-sm mt-2">Setiap pembelian kredit Anda akan muncul di sini.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </main>

      {/* TRANSACTION DETAIL MODAL */}
      <AnimatePresence>
        {selectedTx && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTx(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm print:hidden"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden print:shadow-none print:bg-white print:text-black print:rounded-none"
            >
              {/* Modal Content */}
              <div ref={printRef} className="p-8 sm:p-12 space-y-8">
                {/* Brand Header */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl rotate-3">
                    <Sparkles size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">IndoRepurpose AI</h2>
                    <p className="text-[10px] font-black tracking-[0.3em] text-blue-600 uppercase mt-2">Struk Pembayaran Digital</p>
                  </div>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800 border-dashed border-t-2" />

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-y-6 text-sm">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">ID Transaksi</p>
                    <p className="font-bold text-slate-900 dark:text-white font-mono break-all">{selectedTx.order_id}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tanggal</p>
                    <p className="font-bold text-slate-900 dark:text-white">{formatDate(selectedTx.created_at)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Produk</p>
                    <p className="font-black text-blue-600 uppercase whitespace-nowrap">Paket {selectedTx.plan_name}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</p>
                    <div className={cn(
                      "inline-flex items-center gap-1 font-black uppercase tracking-widest text-[10px]",
                      selectedTx.status === 'success' ? "text-emerald-500" :
                      selectedTx.status === 'cancelled' ? "text-slate-400" :
                      selectedTx.status === 'rejected' ? "text-red-500" :
                      selectedTx.status === 'expired' ? "text-amber-700" : "text-amber-500"
                    )}>
                      {selectedTx.status === 'success' ? 'Sukses' : 
                       selectedTx.status === 'cancelled' ? 'Dibatalkan' : 
                       selectedTx.status === 'rejected' ? 'Ditolak' : 
                       selectedTx.status === 'expired' ? 'Kedaluwarsa' : 'Proses'}
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        selectedTx.status === 'success' ? "bg-emerald-500" :
                        selectedTx.status === 'rejected' ? "bg-red-500" :
                        selectedTx.status === 'cancelled' ? "bg-slate-400" :
                        selectedTx.status === 'expired' ? "bg-amber-700" : "bg-amber-500 animate-pulse"
                      )} />
                    </div>
                  </div>
                </div>

                {/* Amount Table */}
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-6 space-y-4">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span>Harga Paket</span>
                    <span className="text-slate-900 dark:text-white">Rp {selectedTx.amount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span>Kode Unik</span>
                    <span className="text-blue-600">+{selectedTx.unique_code || 0}</span>
                  </div>
                  <div className="h-px bg-slate-200 dark:bg-slate-700" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Total Bayar</span>
                    <span className="text-2xl font-black text-blue-600">
                      Rp {(selectedTx.amount + (selectedTx.unique_code || 0)).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                 <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 border border-blue-100 dark:border-blue-900/20">
                    {selectedTx.payment_method && (
                      <>
                       <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm p-1.5">
                         {(() => {
                           const PAYMENT_LOGOS: Record<string, string> = {
                             'jago': 'https://raw.githubusercontent.com/Zyknn/paymentlogo/main/Bank/Bank%20Logo/Jago.png',
                             'seabank': 'https://raw.githubusercontent.com/Zyknn/paymentlogo/main/Bank/Bank%20Logo/SeaBank.png',
                             'gopay': 'https://raw.githubusercontent.com/Zyknn/paymentlogo/main/Payment%20Channel/E-Wallet/Gopay.png',
                             'shopeepay': 'https://raw.githubusercontent.com/Zyknn/paymentlogo/main/Payment%20Channel/E-Wallet/Shopee%20Pay.png',
                             'blu': 'https://raw.githubusercontent.com/Zyknn/paymentlogo/main/Bank/Bank%20Logo/Blu%20BCA.png'
                           };
                           const logoUrl = PAYMENT_LOGOS[selectedTx.payment_method.toLowerCase()];
                           if (logoUrl) return <img src={logoUrl} alt="" className="w-full h-full object-contain" />;
                           const Icon = getMethodIcon(selectedTx.payment_method);
                           return <Icon size={20} />;
                         })()}
                       </div>
                       <div className="flex-1">
                         <p className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-none mb-1">Metode Pembayaran</p>
                         <p className="text-xs font-black uppercase">
                            {(() => {
                              const NAMES: Record<string, string> = { 'jago': 'Bank Jago', 'seabank': 'SeaBank', 'gopay': 'GoPay', 'shopeepay': 'ShopeePay', 'blu': 'blu by BCA Digital' };
                              return NAMES[selectedTx.payment_method.toLowerCase()] || selectedTx.payment_method;
                            })()}
                         </p>
                       </div>
                      </>
                    )}
                 </div>

                <div className="text-center print:hidden">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                    Struk ini adalah bukti pembayaran yang sah.<br/>Terima kasih telah berlangganan!
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex border-t border-slate-100 dark:border-slate-800 p-4 gap-4 print:hidden">
                <button 
                  onClick={handlePrint}
                  className="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <Download size={16} /> Cetak Struk
                </button>
                <button 
                  onClick={() => setSelectedTx(null)}
                  className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
