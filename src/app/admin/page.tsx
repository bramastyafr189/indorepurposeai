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
  Loader2, 
  LayoutDashboard,
  RefreshCcw,
  ShieldAlert,
  Users,
  TrendingUp,
  History,
  Search,
  ChevronRight,
  Filter,
  DollarSign,
  Crown,
  History as HistoryIcon,
  Eye,
  MessageCircle,
  FileText
} from 'lucide-react';
import { 
  Twitter as TwitterIcon, 
  Linkedin as LinkedinIcon 
} from '@/components/Icons';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { 
  getVerifyingTransactions, 
  approveTransaction, 
  rejectTransaction,
  getAdminStats,
  getAllTransactions,
  getAllUsers,
  getAllHistoryAdmin
} from '../actions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type TabType = 'overview' | 'verifikasi' | 'transaksi' | 'pengguna' | 'laporan';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' });
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, verifyingRes, allTxRes, usersRes, historyRes] = await Promise.all([
        getAdminStats(),
        getVerifyingTransactions(),
        getAllTransactions(),
        getAllUsers(),
        getAllHistoryAdmin()
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (verifyingRes.success) setTransactions(verifyingRes.data || []);
      if (allTxRes.success) setAllTransactions(allTxRes.data || []);
      if (usersRes.success) setUsers(usersRes.data || []);
      if (historyRes.success) setHistory(historyRes.data || []);

      if (!statsRes.success && statsRes.error === 'Unauthorized') {
        setIsAuthorized(false);
      }
    } catch (error) {
      toast.error('Gagal mengambil data dashboard');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id: string) => {
    if (!confirm('Setujui transaksi ini?')) return;
    setProcessingId(id);
    const res = await approveTransaction(id);
    if (res.success) {
      toast.success('Disetujui!');
      fetchData(); // Refresh all to update stats
    } else {
      toast.error(res.error);
    }
    setProcessingId(null);
  };

  const handleReject = async (id: string) => {
    if (!confirm('Tolak transaksi ini?')) return;
    setProcessingId(id);
    const res = await rejectTransaction(id);
    if (res.success) {
      toast.info('Ditolak');
      fetchData();
    } else {
      toast.error(res.error);
    }
    setProcessingId(null);
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedHistory = [...history].sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    // Handle nested profiles for sorting by email
    if (sortConfig.key === 'email') {
      aValue = a.profiles?.email || '';
      bValue = b.profiles?.email || '';
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-600 mb-6">
          <ShieldAlert size={40} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4 font-display">Akses Ditolak</h1>
        <p className="text-slate-500 max-w-md mb-8 font-medium">Halaman ini hanya dapat diakses oleh administrator resmi.</p>
        <Link href="/" className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20">Kembali ke Beranda</Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 text-foreground transition-colors duration-500 font-sans">
      <Navbar />

      <main className="flex-1 py-12 md:py-20 px-4 sm:px-6 relative z-10">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-12">
            <div>
              <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.4em] mb-3">
                <div className="w-6 h-px bg-blue-600" />
                Control Center v3.0
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white font-display tracking-tight">Admin Dashboard</h1>
            </div>
            
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Cari data..."
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                onClick={fetchData}
                className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm group"
              >
                <RefreshCcw size={20} className={cn("text-slate-500 transition-transform group-active:rotate-180", loading && "animate-spin")} />
              </button>
            </div>
          </header>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/50 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl mb-10 w-fit">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'verifikasi', label: 'Verifikasi', icon: CheckCircle2, badge: transactions.length },
              { id: 'transaksi', label: 'Semua Transaksi', icon: History },
              { id: 'pengguna', label: 'Pengguna', icon: Users },
              { id: 'laporan', label: 'Laporan', icon: HistoryIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  "relative flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                  activeTab === tab.id 
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-xl shadow-slate-200/50 dark:shadow-none translate-y-[-1px]" 
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                <tab.icon size={14} />
                <span>{tab.label}</span>
                {tab.badge ? (
                  <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white rounded-md text-[8px] animate-pulse">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="min-h-[500px]">
            {loading ? (
              <div className="py-40 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/20">
                <Loader2 size={48} className="text-blue-600 animate-spin mb-6" />
                <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Sinkronisasi Data...</p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <StatsCard 
                        title="Total Pendapatan" 
                        value={`Rp ${stats?.totalRevenue?.toLocaleString('id-ID')}`} 
                        icon={<DollarSign size={24} />} 
                        color="bg-emerald-500"
                        trend="+12% bulan ini"
                      />
                      <StatsCard 
                        title="Total Pengguna" 
                        value={stats?.totalUsers} 
                        icon={<Users size={24} />} 
                        color="bg-blue-600"
                        trend="Pertumbuhan Aktif"
                      />
                      <StatsCard 
                        title="Aktif Berlangganan" 
                        value={stats?.activeSubscriptions} 
                        icon={<Crown size={24} />} 
                        color="bg-amber-500"
                        trend={`${((stats?.activeSubscriptions / stats?.totalUsers) * 100).toFixed(1)}% konversi`}
                      />
                      <StatsCard 
                        title="Menunggu Verifikasi" 
                        value={stats?.pendingVerifications} 
                        icon={<Clock size={24} />} 
                        color="bg-slate-800"
                        trend="Quick action required"
                        isActive={stats?.pendingVerifications > 0}
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Recent Activity Mini List */}
                      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/20">
                        <div className="flex items-center justify-between mb-8">
                          <h3 className="text-xl font-black text-slate-900 dark:text-white font-display">Transaksi Terbaru</h3>
                          <button onClick={() => setActiveTab('transaksi')} className="text-blue-600 font-bold text-xs hover:underline flex items-center gap-1">
                            Lihat Semua <ChevronRight size={14} />
                          </button>
                        </div>
                        <div className="space-y-4">
                          {allTransactions.slice(0, 5).map(tx => (
                            <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                                  <CreditCard size={18} className="text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-900 dark:text-white">Rp {tx.amount.toLocaleString('id-ID')}</p>
                                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">{tx.profiles?.email}</p>
                                </div>
                              </div>
                              <div className={cn(
                                "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider",
                                tx.status === 'success' ? "bg-emerald-100 text-emerald-600" : 
                                tx.status === 'pending' ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"
                              )}>
                                {tx.status}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* New Users Mini List */}
                      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/20">
                        <div className="flex items-center justify-between mb-8">
                          <h3 className="text-xl font-black text-slate-900 dark:text-white font-display">User Terbaru</h3>
                          <button onClick={() => setActiveTab('pengguna')} className="text-blue-600 font-bold text-xs hover:underline flex items-center gap-1">
                            Lihat Semua <ChevronRight size={14} />
                          </button>
                        </div>
                        <div className="space-y-4">
                          {users.slice(0, 5).map(user => (
                            <div key={user.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                                  <User size={18} className="text-indigo-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-900 dark:text-white">{user.email?.split('@')[0]}</p>
                                  <p className="text-[10px] text-slate-400 font-medium tracking-tight">{user.email}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{user.plan_name}</p>
                                <p className="text-[10px] text-slate-400 font-medium italic">Kredit: {user.credits}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'verifikasi' && (
                  <motion.div
                    key="verifikasi"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {transactions.length > 0 ? (
                      <div className="grid grid-cols-1 gap-6">
                        {transactions.map((tx) => (
                          <VerifikasiCard 
                            key={tx.id} 
                            tx={tx} 
                            processingId={processingId}
                            onApprove={handleApprove}
                            onReject={handleReject}
                          />
                        ))}
                      </div>
                    ) : (
                      <EmptyState message="Semua pembayaran sudah diverifikasi." />
                    )}
                  </motion.div>
                )}

                {activeTab === 'transaksi' && (
                  <motion.div
                    key="transaksi"
                    initial={{ opacity: 0, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                    className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">ID Order</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Pengguna</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Plan</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Total</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Tanggal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                          {allTransactions.filter(tx => 
                            tx.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            tx.profiles?.email.toLowerCase().includes(searchQuery.toLowerCase())
                          ).map(tx => (
                            <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-8 py-5 text-xs font-bold text-slate-500">{tx.order_id}</td>
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 text-[10px] font-black">
                                    {tx.profiles?.email?.[0].toUpperCase()}
                                  </div>
                                  <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{tx.profiles?.email}</span>
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                <span className={cn(
                                  "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                                  tx.plan_name === 'Agency' ? "bg-purple-100 text-purple-600" :
                                  tx.plan_name === 'Pro' ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
                                )}>
                                  {tx.plan_name}
                                </span>
                              </td>
                              <td className="px-8 py-5 text-sm font-black text-slate-900 dark:text-white">
                                Rp {(tx.amount + (tx.unique_code || 0)).toLocaleString('id-ID')}
                              </td>
                              <td className="px-8 py-5">
                                <span className={cn(
                                  "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5",
                                  tx.status === 'success' ? "text-emerald-500" :
                                  tx.status === 'pending' ? "text-amber-500" :
                                  tx.status === 'verifying' ? "text-blue-500" : "text-slate-400"
                                )}>
                                  <div className={cn("w-1.5 h-1.5 rounded-full", 
                                    tx.status === 'success' ? "bg-emerald-500" :
                                    tx.status === 'pending' ? "bg-amber-500" :
                                    tx.status === 'verifying' ? "bg-blue-500 animate-pulse" : "bg-slate-400"
                                  )} />
                                  {tx.status}
                                </span>
                              </td>
                              <td className="px-8 py-5 text-xs text-slate-400">
                                {new Date(tx.created_at).toLocaleDateString('id-ID')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'pengguna' && (
                  <motion.div
                    key="pengguna"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {users.filter(u => 
                      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map(user => (
                      <div key={user.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/10 dark:shadow-none hover:border-blue-500/30 transition-all group">
                        <div className="flex items-center justify-between mb-6">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl font-black">
                            {user.email ? user.email[0].toUpperCase() : '?'}
                          </div>
                          <div className={cn(
                            "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em]",
                            user.plan_name === 'Agency' ? "bg-purple-100 text-purple-600" :
                            user.plan_name === 'Pro' ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
                          )}>
                            {user.role === 'admin' ? 'SYSTEM ADMIN' : `PAKET ${user.plan_name}`}
                          </div>
                        </div>
                        <h4 className="text-lg font-black text-slate-900 dark:text-white truncate mb-1">{user.email?.split('@')[0]}</h4>
                        <p className="text-xs text-slate-400 truncate mb-6 flex items-center gap-2">
                          <Mail size={12} className="text-blue-500" />
                          {user.email}
                        </p>
                        <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-800">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kredit Sisa</p>
                            <p className="text-xl font-black text-blue-600">{user.credits}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Terdaftar</p>
                            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{new Date(user.created_at).toLocaleDateString('id-ID')}</p>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Masa Aktif</p>
                          <p className={cn(
                            "text-xs font-black",
                            user.plan_name === 'Free' ? "text-slate-400" : "text-amber-500"
                          )}>
                            {user.plan_name === 'Free' ? 'SELAMANYA' : user.plan_expires_at ? new Date(user.plan_expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'laporan' && (
                  <motion.div
                    key="laporan"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    {history.length > 0 ? (
                      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <th 
                                  onClick={() => handleSort('email')}
                                  className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-blue-600 transition-colors"
                                >
                                  Pengguna {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Konten Input</th>
                                <th 
                                  onClick={() => handleSort('mode')}
                                  className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-blue-600 transition-colors"
                                >
                                  Mode {sortConfig.key === 'mode' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Tone</th>
                                <th 
                                  onClick={() => handleSort('created_at')}
                                  className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-blue-600 transition-colors"
                                >
                                  Waktu {sortConfig.key === 'created_at' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                              {sortedHistory.filter(h => 
                                (h.profiles?.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                                (h.input_content?.toLowerCase() || '').includes(searchQuery.toLowerCase())
                              ).map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-8 py-5">
                                <span className="text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                  {item.profiles?.email || 'Unknown User'}
                                </span>
                              </td>
                              <td className="px-8 py-5">
                                <div className="max-w-[300px]">
                                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800 flex items-center gap-2 group/input">
                                    <div className="flex-1 overflow-x-auto whitespace-nowrap hide-scrollbar text-[10px] text-slate-500 font-medium italic select-all cursor-text">
                                      {item.input_content}
                                    </div>
                                  </div>
                                </div>
                              </td>
                                  <td className="px-8 py-5">
                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded">
                                      {item.mode}
                                    </span>
                                  </td>
                                  <td className="px-8 py-5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                      {item.tone || 'professional'}
                                    </span>
                                  </td>
                                  <td className="px-8 py-5 text-xs text-slate-400 tabular-nums">
                                    {new Date(item.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </td>
                                  <td className="px-8 py-5 text-right">
                                    <button 
                                      onClick={() => setSelectedLog(item)}
                                      className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                      title="Lihat Detail Transformasi"
                                    >
                                      <Eye size={18} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <EmptyState message="Belum ada riwayat transformasi konten." />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </main>

      <Footer />
      
      {/* Detail Log Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <div>
                  <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest mb-1">
                    <HistoryIcon size={14} />
                    Detail Transformasi
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Log Riwayat Konten</h3>
                </div>
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                {/* Source Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                    <FileText size={14} />
                    Sumber Konten (Input)
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{selectedLog.input_content}</p>
                  </div>
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <ResultColumn 
                    title="X (Twitter)" 
                    icon={<TwitterIcon size={16} />} 
                    content={selectedLog.result_x} 
                    color="text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800"
                  />
                  <ResultColumn 
                    title="WhatsApp" 
                    icon={<MessageCircle size={16} />} 
                    content={selectedLog.result_whatsapp} 
                    color="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
                  />
                  <ResultColumn 
                    title="LinkedIn" 
                    icon={<LinkedinIcon size={16} />} 
                    content={selectedLog.result_linkedin} 
                    color="text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                  />
                </div>
              </div>
              
              <div className="p-8 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                  <Clock size={12} />
                  Dibuat pada {new Date(selectedLog.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatsCard({ title, value, icon, color, trend, isActive }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/20 relative overflow-hidden group">
      {isActive && (
        <div className="absolute top-0 right-0 p-4">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
        </div>
      )}
      <div className={cn("w-14 h-14 rounded-2xl mb-6 flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3", color)}>
        {icon}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">{title}</p>
      <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2 font-display">{value}</h3>
      <p className="text-xs font-bold text-slate-500">{trend}</p>
    </div>
  );
}

function VerifikasiCard({ tx, onApprove, onReject, processingId }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/20 flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-blue-500/30 transition-all"
    >
      <div className="flex flex-col md:flex-row items-center gap-8 w-full md:w-auto text-center md:text-left">
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

      <div className="flex items-center gap-3 w-full md:w-auto">
        <button
          onClick={() => onReject(tx.id)}
          disabled={!!processingId}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
        >
          {processingId === tx.id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={18} />}
          Reject
        </button>
        <button
          onClick={() => onApprove(tx.id)}
          disabled={!!processingId}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
        >
          {processingId === tx.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={18} />}
          Approve
        </button>
      </div>
    </motion.div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-40 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
      <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 mb-6">
        <CheckCircle2 size={40} />
      </div>
      <h2 className="text-2xl font-black text-slate-400 uppercase tracking-[0.25em]">Mulus!</h2>
      <p className="text-slate-500 mt-2 font-medium">{message}</p>
    </div>
  );
}

function ResultColumn({ title, icon, content, color }: { title: string, icon: any, content: string, color: string }) {
  return (
    <div className="space-y-4">
      <div className={cn("flex items-center gap-2 font-black text-[10px] uppercase tracking-widest", color.split(' ')[0])}>
        {icon}
        {title}
      </div>
      <div className={cn("p-5 rounded-2xl border text-xs leading-relaxed h-[300px] overflow-y-auto whitespace-pre-wrap", 
        color.includes('emerald') ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800" :
        color.includes('blue') ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800" :
        "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800"
      )}>
        {content || '-'}
      </div>
    </div>
  );
}
