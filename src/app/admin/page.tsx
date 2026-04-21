'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Mail, 
  CreditCard, 
  ArrowLeft, 
  Loader2, 
  LayoutDashboard,
  RefreshCcw,
  ShieldAlert
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { 
  getVerifyingTransactions, 
  approveTransaction, 
  rejectTransaction 
} from '../actions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const router = useRouter();

  const fetchTransactions = async () => {
    setLoading(true);
    const res = await getVerifyingTransactions();
    if (res.success) {
      setTransactions(res.data || []);
    } else {
      if (res.error === 'Unauthorized') {
        setIsAuthorized(false);
      }
      toast.error(res.error || 'Gagal mengambil data transaksi.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleApprove = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin MENYETUJUI transaksi ini dan menambah kredit user?')) return;
    
    setProcessingId(id);
    const res = await approveTransaction(id);
    if (res.success) {
      toast.success('Transaksi berhasil disetujui!');
      setTransactions(prev => prev.filter(t => t.id !== id));
    } else {
      toast.error(res.error || 'Gagal memproses persetujuan.');
    }
    setProcessingId(null);
  };

  const handleReject = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin MENOLAK transaksi ini?')) return;

    setProcessingId(id);
    const res = await rejectTransaction(id);
    if (res.success) {
      toast.info('Transaksi ditolak.');
      setTransactions(prev => prev.filter(t => t.id !== id));
    } else {
      toast.error(res.error || 'Gagal memproses penolakan.');
    }
    setProcessingId(null);
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-600 mb-6">
          <ShieldAlert size={40} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Akses Ditolak</h1>
        <p className="text-slate-500 max-w-md mb-8">Halaman ini hanya dapat diakses oleh administrator resmi. Jika Anda adalah admin, pastikan email Anda sudah terdaftar di sistem.</p>
        <Link href="/" className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold">Kembali ke Beranda</Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 text-foreground transition-colors duration-500 font-sans">
      <Navbar />

      <main className="flex-1 py-12 md:py-20 px-6 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
              <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-[0.3em] mb-2">
                <LayoutDashboard size={14} />
                Admin Control Panel
              </div>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white font-display">Verifikasi Pembayaran</h1>
            </div>
            
            <button 
              onClick={fetchTransactions}
              className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
            >
              <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
              Refresh Data
            </button>
          </header>

          <div className="space-y-6">
            {loading ? (
              <div className="py-40 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800">
                <Loader2 size={40} className="text-blue-600 animate-spin mb-4" />
                <p className="text-slate-500 font-bold">Memuat antrean verifikasi...</p>
              </div>
            ) : transactions.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                <AnimatePresence>
                  {transactions.map((tx) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-blue-500/30 transition-all"
                    >
                      <div className="flex flex-col md:flex-row items-center gap-8 w-full md:w-auto text-center md:text-left">
                        {/* Transaction Info */}
                        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 shrink-0">
                          <CreditCard size={32} />
                        </div>
                        
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center justify-center md:justify-start gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600">Verification Pending</span>
                            <span className="text-xs font-bold text-slate-400">Order ID: {tx.order_id}</span>
                          </div>
                          <h3 className="text-2xl font-black text-slate-900 dark:text-white truncate">
                            Rp {(tx.amount + (tx.unique_code || 0)).toLocaleString('id-ID')}
                          </h3>
                          <div className="flex items-center justify-center md:justify-start gap-4 text-slate-500 font-medium">
                            <div className="flex items-center gap-1.5 text-xs">
                              <Mail size={14} className="text-blue-500" />
                              {tx.profiles?.email || 'No Email'}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs">
                              <Clock size={14} className="text-blue-500" />
                              {new Date(tx.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                          onClick={() => handleReject(tx.id)}
                          disabled={!!processingId}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                        >
                          {processingId === tx.id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={18} />}
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprove(tx.id)}
                          disabled={!!processingId}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
                        >
                          {processingId === tx.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={18} />}
                          Approve Payment
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="py-40 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 mb-6">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-400 uppercase tracking-[0.25em]">Semua Beres!</h2>
                <p className="text-slate-500 mt-2 font-medium">Tidak ada transaksi yang menunggu verifikasi saat ini.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
