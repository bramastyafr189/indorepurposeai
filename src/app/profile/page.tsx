'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Calendar, Zap, Shield, Sparkles, CreditCard, ArrowLeft, Loader2, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { getProfile, getTransactionHistory } from '../actions';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview');
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
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
    }
    loadData();
  }, [router]);

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
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
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
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 text-foreground transition-colors duration-500 font-sans">
      <Navbar />

      <main className="flex-1 py-12 md:py-20 px-6 relative z-10">
        <div className="container mx-auto max-w-5xl">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors mb-10 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Kembali ke Beranda
          </Link>

          <header className="mb-12">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2 font-display">Akun Saya</h1>
            <p className="text-slate-500 font-medium">Kelola langganan dan pantau riwayat kredit Anda.</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Sidebar / User Info */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-4 space-y-6"
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
              <div className="flex gap-4 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl w-fit font-black text-xs uppercase tracking-widest">
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
                    {/* Credit Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group">
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
                            href="/#pricing"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98]"
                          >
                            Isi Ulang Kredit
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Active Plan Perks */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden">
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
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="transactions"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {transactions.length > 0 ? (
                      transactions.map((tx) => (
                        <div 
                          key={tx.id}
                          className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between group hover:border-blue-500/30 transition-all"
                        >
                          <div className="flex items-center gap-5">
                            <div className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center",
                              tx.status === 'settlement' || tx.status === 'capture' 
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500" 
                                : "bg-amber-50 dark:bg-amber-500/10 text-amber-500"
                            )}>
                              {tx.status === 'settlement' || tx.status === 'capture' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest mb-1">
                                Paket {tx.plan_name}
                              </p>
                              <p className="text-sm font-bold text-slate-500">{formatDate(tx.created_at)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-slate-900 dark:text-white text-lg leading-none mb-1">
                              {formatCurrency(tx.amount)}
                            </p>
                            <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">
                              {tx.order_id}
                            </p>
                          </div>
                        </div>
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

      <Footer />
    </div>
  );
}
