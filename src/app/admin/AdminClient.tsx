'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
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
  Search,
  ChevronRight,
  RefreshCw,
  LifeBuoy,
  MessageCircle,
  Send,
  Eye,
  RefreshCcw,
  ShieldAlert,
  Filter,
  DollarSign,
  Crown,
  History as HistoryIcon,
  FileText,
  Check,
  Trash2,
  Users,
  TrendingUp,
  Newspaper as NewsletterIcon,
  Sparkles as HighlightsIcon,
  BookOpen as BlogIcon,
  Edit,
  Cpu,
  Plus,
  ExternalLink
} from 'lucide-react';
import { 
  Instagram as InstagramIcon,
  Threads as ThreadsIcon,
  Tiktok as TiktokIcon,
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
  getAllHistoryAdmin,
  getAllTicketsAdmin,
  updateTicketStatus,
  getTicketMessages,
  sendTicketMessage,
  updateUserAdmin,
  getAIModelsAdmin,
  createAIModelAdmin,
  updateAIModelAdmin,
  deleteAIModelAdmin,
  getAIErrorsAdmin,
  clearAIErrorsAdmin
} from '../actions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type TabType = 'overview' | 'verifikasi' | 'transaksi' | 'pengguna' | 'laporan' | 'aduan' | 'mesin' | 'ai_errors';

export default function AdminClient() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [replyMessage, setReplyMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ credits: 0, plan_name: '', plan_expires_at: '' });
  const [updating, setUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [aiModels, setAiModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [modelForm, setModelForm] = useState({ model_name: '', priority: 1, is_active: true });
  const [aiErrors, setAiErrors] = useState<any[]>([]);
  const [clearingErrors, setClearingErrors] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean,
    title: string,
    message: string,
    onConfirm: () => void,
    type: 'danger' | 'success' | 'info'
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info'
  });
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' });
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<string>('connecting');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const lastFetchRef = useRef<number>(0);
  const debouncedFetchData = () => {
    const now = Date.now();
    const COOLDOWN = 5000; // Minimal 5 seconds between fetches

    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    
    // If it's been more than 10s since last fetch, fetch now
    if (now - lastFetchRef.current > 10000) {
      fetchData(true); // background fetch
    } else {
      fetchTimeoutRef.current = setTimeout(() => {
        fetchData(true); // background fetch
      }, 3000);
    }
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ticketMessages]);

  useEffect(() => {
    if (selectedTicketId) {
      const supabase = createClient();
      const channel = supabase
        .channel(`chat:${selectedTicketId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${selectedTicketId}`
        }, () => {
          loadMessages(selectedTicketId);
        })
        .on('broadcast', { event: 'new-chat-message' }, () => {
          console.log('New chat message broadcast received');
          loadMessages(selectedTicketId);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedTicketId]);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    fetchUser();
    fetchData();

    // Supabase Realtime for Global Updates
    const supabaseClient = createClient();
    const globalChannel = supabaseClient
      .channel('admin-global-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tickets' 
      }, (payload) => {
        console.log('Realtime Ticket Change:', payload);
        debouncedFetchData();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'transactions' 
      }, (payload) => {
        console.log('Realtime Transaction Change:', payload);
        debouncedFetchData();
      })
      .on('broadcast', { event: 'new-ticket' }, (payload) => {
        console.log('Broadcast New Ticket Received:', payload);
        debouncedFetchData();
      })
      .on('broadcast', { event: 'new-transaction' }, (payload) => {
        console.log('Broadcast New Transaction Received:', payload);
        debouncedFetchData();
      })
      .on('broadcast', { event: 'new-ai-error' }, (payload) => {
        console.log('Broadcast New AI Error Received:', payload);
        debouncedFetchData();
      })
      .subscribe((status) => {
        console.log('Admin Realtime Status:', status);
        setRealtimeStatus(status);
      });

    // Fallback polling every 1 minute just in case
    const fallbackInterval = setInterval(() => {
      fetchData(true);
    }, 60000);

    return () => {
      supabaseClient.removeChannel(globalChannel);
      clearInterval(fallbackInterval);
    };
  }, []);

  // Payment Method Mapping for Admin Display
  const PAYMENT_METHODS: Record<string, { name: string, logo: string }> = {
    'jago': { name: 'Bank Jago', logo: 'https://raw.githubusercontent.com/Zyknn/paymentlogo/main/Bank/Bank%20Logo/Jago.png' },
    'seabank': { name: 'SeaBank', logo: 'https://raw.githubusercontent.com/Zyknn/paymentlogo/main/Bank/Bank%20Logo/SeaBank.png' },
    'gopay': { name: 'GoPay', logo: 'https://raw.githubusercontent.com/Zyknn/paymentlogo/main/Payment%20Channel/E-Wallet/Gopay.png' },
    'shopeepay': { name: 'ShopeePay', logo: 'https://raw.githubusercontent.com/Zyknn/paymentlogo/main/Payment%20Channel/E-Wallet/Shopee%20Pay.png' },
    'blu': { name: 'blu by BCA Digital', logo: 'https://raw.githubusercontent.com/Zyknn/paymentlogo/main/Bank/Bank%20Logo/Blu%20BCA.png' }
  };

  const fetchData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    lastFetchRef.current = Date.now();
    
    try {
      const [statsRes, verifyingRes, allTxRes, usersRes, historyRes, ticketsRes, aiModelsRes, aiErrorsRes] = await Promise.all([
        getAdminStats(),
        getVerifyingTransactions(),
        getAllTransactions(),
        getAllUsers(),
        getAllHistoryAdmin(),
        getAllTicketsAdmin(),
        getAIModelsAdmin(),
        getAIErrorsAdmin()
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (verifyingRes.success) setTransactions(verifyingRes.data || []);
      if (allTxRes.success) setAllTransactions(allTxRes.data || []);
      if (usersRes.success) setUsers(usersRes.data || []);
      if (historyRes.success) setHistory(historyRes.data || []);
      if (ticketsRes && (ticketsRes as any).success) setTickets((ticketsRes as any).data || []);
      if (aiModelsRes.success) setAiModels(aiModelsRes.data || []);
      if (aiErrorsRes.success) {
        setAiErrors(aiErrorsRes.data || []);
      } else {
        toast.error('Gagal memuat log AI: ' + aiErrorsRes.error);
      }

      if (!statsRes.success && statsRes.error === 'Unauthorized') {
        setIsAuthorized(false);
      }
    } catch (error) {
      if (!isBackground) toast.error('Gagal mengambil data dashboard');
    }
    if (!isBackground) setLoading(false);
  };

  const handleAddModel = async () => {
    if (!modelForm.model_name) return toast.error('Nama model tidak boleh kosong');
    setUpdating(true);
    const res = await createAIModelAdmin(modelForm.model_name, modelForm.priority);
    if (res.success) {
      toast.success('Model AI berhasil ditambahkan');
      setIsModelModalOpen(false);
      setModelForm({ model_name: '', priority: 1, is_active: true });
      fetchData();
    } else {
      toast.error(res.error || 'Gagal menambahkan model');
    }
    setUpdating(false);
  };

  const handleUpdateModelStatus = async (id: string, isActive: boolean) => {
    setProcessingId(id);
    const res = await updateAIModelAdmin(id, { is_active: isActive });
    if (res.success) {
      toast.success('Status model diperbarui');
      fetchData();
    } else {
      toast.error(res.error || 'Gagal memperbarui status');
    }
    setProcessingId(null);
  };

  const handleUpdateModelPriority = async (id: string, priority: number) => {
    setProcessingId(id);
    const res = await updateAIModelAdmin(id, { priority });
    if (res.success) {
      toast.success('Prioritas diperbarui');
      fetchData();
    } else {
      toast.error(res.error || 'Gagal memperbarui prioritas');
    }
    setProcessingId(null);
  };

  const handleDeleteModel = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Model AI?',
      message: 'Tindakan ini tidak dapat dibatalkan. Model akan dihapus permanen dari sistem.',
      type: 'danger',
      onConfirm: async () => {
        setProcessingId(id);
        const res = await deleteAIModelAdmin(id);
        if (res.success) {
          toast.success('Model AI berhasil dihapus');
          fetchData();
        } else {
          toast.error(res.error || 'Gagal menghapus model');
        }
        setProcessingId(null);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleClearAIErrors = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Bersihkan Log Error?',
      message: 'Semua riwayat kesalahan AI akan dihapus secara permanen.',
      type: 'danger',
      onConfirm: async () => {
        setProcessingId('clear-logs');
        setClearingErrors(true);
        const res = await clearAIErrorsAdmin();
        if (res.success) {
          toast.success('Log error berhasil dibersihkan');
          fetchData(true);
        } else {
          toast.error('Gagal membersihkan log: ' + res.error);
        }
        setClearingErrors(false);
        setProcessingId(null);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleApprove = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Setujui Transaksi?',
      message: 'Apakah Anda yakin ingin menyetujui transaksi ini? Kredit akan otomatis ditambahkan ke akun pengguna.',
      type: 'success',
      onConfirm: async () => {
        setProcessingId(id);
        const res = await approveTransaction(id);
        if (res.success && res.userId) {
          const supabase = createClient();
          supabase.channel(`user-updates:${res.userId}`).send({
            type: 'broadcast',
            event: 'profile-updated',
            payload: { status: 'success' }
          });
          toast.success('Transaksi Disetujui!');
          fetchData();
        } else if (!res.success) {
          toast.error(res.error);
        }
        setProcessingId(null);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleReject = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Tolak Transaksi?',
      message: 'Apakah Anda yakin ingin menolak transaksi ini? Pengguna akan diberitahu melalui status transaksi mereka.',
      type: 'danger',
      onConfirm: async () => {
        setProcessingId(id);
        const res = await rejectTransaction(id);
        if (res.success && res.userId) {
          const supabase = createClient();
          supabase.channel(`user-updates:${res.userId}`).send({
            type: 'broadcast',
            event: 'profile-updated',
            payload: { status: 'rejected' }
          });
          toast.info('Transaksi Ditolak');
          fetchData();
        } else if (!res.success) {
          toast.error(res.error);
        }
        setProcessingId(null);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    setConfirmModal({
      isOpen: true,
      title: status === 'resolved' ? 'Selesaikan Tiket?' : 'Buka Kembali Tiket?',
      message: status === 'resolved' 
        ? 'Tiket ini akan ditandai sebagai selesai. Pastikan semua aduan pengguna sudah tertangani.'
        : 'Tiket ini akan dibuka kembali untuk percakapan lebih lanjut.',
      type: status === 'resolved' ? 'success' : 'info',
        onConfirm: async () => {
          setProcessingId(id);
          const res = await updateTicketStatus(id, status);
          if (res.success) {
            // Broadcast to User
            // Broadcast to User (Specific Chat Channel)
            const supabase = createClient();
            const chatChannel = supabase.channel(`chat:${id}`);
            chatChannel.subscribe((status) => {
              if (status === 'SUBSCRIBED') {
                chatChannel.send({
                  type: 'broadcast',
                  event: 'ticket-status-updated',
                  payload: { status }
                });
                setTimeout(() => supabase.removeChannel(chatChannel), 2000);
              }
            });

            // Broadcast to User (Global Updates Channel for List Refresh)
            if (res.userId) {
              const userChannel = supabase.channel(`user-updates:${res.userId}`);
              userChannel.subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                  userChannel.send({
                    type: 'broadcast',
                    event: 'ticket-status-updated',
                    payload: { id, status }
                  });
                  setTimeout(() => supabase.removeChannel(userChannel), 2000);
                }
              });
            }
            toast.success(`Tiket berhasil diupdate ke ${status}`);
            fetchData();
          } else {
            toast.error(res.error);
          }
          setProcessingId(null);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
    });
  };

  const loadMessages = async (ticketId: string) => {
    const res = await getTicketMessages(ticketId);
    if (res.success) {
      setTicketMessages(res.data || []);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicketId || !replyMessage.trim()) return;
    setProcessingId(selectedTicketId);
    const res = await sendTicketMessage(selectedTicketId, replyMessage);
    if (res.success) {
      // Broadcast to User (Specific Chat Channel)
      const supabase = createClient();
      supabase.channel(`chat:${selectedTicketId}`).send({
        type: 'broadcast',
        event: 'new-chat-message',
        payload: { text: replyMessage }
      });

      // Broadcast to User (Global Updates Channel for Notification Badge)
      const currentTicket = tickets.find(t => t.id === selectedTicketId);
      if (currentTicket) {
        const userChannel = supabase.channel(`user-updates:${currentTicket.user_id}`);
        userChannel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            userChannel.send({
              type: 'broadcast',
              event: 'new-chat-message',
              payload: { text: replyMessage, ticketId: selectedTicketId }
            });
            setTimeout(() => supabase.removeChannel(userChannel), 2000);
          }
        });
      }

      setReplyMessage("");
      loadMessages(selectedTicketId);
      toast.success("Balasan terkirim");
    } else {
      toast.error(res.error);
    }
    setProcessingId(null);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    setUpdating(true);
    const res = await updateUserAdmin(selectedUser.id, {
      credits: editForm.credits,
      plan_name: editForm.plan_name,
      plan_expires_at: editForm.plan_expires_at || null
    });
    
    if (res.success) {
      toast.success('User berhasil diupdate');
      setSelectedUser(null);
      fetchData();
    } else {
      toast.error(res.error || 'Gagal update user');
    }
    setUpdating(false);
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
              
              <div className="flex items-center gap-4 w-full lg:w-auto">
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest",
                  realtimeStatus === 'SUBSCRIBED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                  realtimeStatus === 'connecting' ? "bg-amber-50 text-amber-600 border-amber-100" :
                  "bg-red-50 text-red-600 border-red-100"
                )}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  realtimeStatus === 'SUBSCRIBED' ? "bg-emerald-500 animate-pulse" :
                  realtimeStatus === 'connecting' ? "bg-amber-500 animate-bounce" :
                  "bg-red-500"
                )} />
                {realtimeStatus === 'SUBSCRIBED' ? 'Live System' : 
                 realtimeStatus === 'connecting' ? 'Connecting...' : 
                 realtimeStatus === 'closed' ? 'Offline' : 'Reconnecting...'}
                
                {realtimeStatus !== 'SUBSCRIBED' && (
                  <button 
                    onClick={() => window.location.reload()}
                    className="ml-1 p-0.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                    title="Muat ulang halaman untuk menyambung kembali"
                  >
                    <RefreshCw size={10} className={cn(realtimeStatus === 'connecting' && "animate-spin")} />
                  </button>
                )}
              </div>

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
                onClick={() => fetchData()}
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
              { id: 'transaksi', label: 'Semua Transaksi', icon: HistoryIcon },
              { id: 'pengguna', label: 'Pengguna', icon: Users },
              { id: 'laporan', label: 'Log', icon: HistoryIcon },
              { id: 'aduan', label: 'Aduan', icon: LifeBuoy },
              { id: 'mesin', label: 'Mesin AI', icon: Cpu },
              { id: 'ai_errors', label: 'AI Errors', icon: ShieldAlert, badge: aiErrors.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as TabType);
                  setCurrentPage(1);
                }}
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
                      <>
                        <div className="grid grid-cols-1 gap-6">
                          {transactions
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((tx) => (
                              <VerifikasiCard 
                                key={tx.id} 
                                tx={tx} 
                                processingId={processingId}
                                onApprove={handleApprove}
                                onReject={handleReject}
                                methodInfo={PAYMENT_METHODS[tx.payment_method]}
                              />
                            ))}
                        </div>
                        <Pagination 
                          current={currentPage} 
                          total={transactions.length} 
                          perPage={itemsPerPage} 
                          onPageChange={setCurrentPage} 
                        />
                      </>
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
                    className="space-y-6"
                  >
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">ID Order</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Pengguna</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Plan</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Metode</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Total</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Tanggal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {allTransactions
                              .filter(tx => 
                                tx.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                tx.profiles?.email.toLowerCase().includes(searchQuery.toLowerCase())
                              )
                              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                              .map(tx => (
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
                                      tx.plan_name === 'Max' ? "bg-indigo-100 text-indigo-600" :
                                      tx.plan_name === 'Pro' ? "bg-blue-100 text-blue-600" :
                                      tx.plan_name === 'Plus' ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"
                                    )}>
                                      {tx.plan_name}
                                    </span>
                                  </td>
                                  <td className="px-8 py-5">
                                    {tx.payment_method && PAYMENT_METHODS[tx.payment_method] ? (
                                      <div className="flex items-center gap-2">
                                        <img src={PAYMENT_METHODS[tx.payment_method].logo} alt="" className="w-4 h-4 object-contain" />
                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{PAYMENT_METHODS[tx.payment_method].name}</span>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 italic">Manual/Lama</span>
                                    )}
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
                    </div>
                    <Pagination 
                      current={currentPage} 
                      total={allTransactions.filter(tx => 
                        tx.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        tx.profiles?.email.toLowerCase().includes(searchQuery.toLowerCase())
                      ).length} 
                      perPage={itemsPerPage} 
                      onPageChange={setCurrentPage} 
                    />
                  </motion.div>
                )}

                 {activeTab === 'pengguna' && (
                  <motion.div
                    key="pengguna"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Pengguna</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Paket</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Kredit</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Masa Aktif</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Terdaftar</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {users
                              .filter(u => 
                                u.email?.toLowerCase().includes(searchQuery.toLowerCase())
                              )
                              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                              .map(user => (
                                <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                  <td className="px-8 py-5">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-lg">
                                        {user.email ? user.email[0].toUpperCase() : '?'}
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{user.email?.split('@')[0]}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">{user.email}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-8 py-5">
                                    <span className={cn(
                                      "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em]",
                                      user.plan_name === 'Max' ? "bg-indigo-100 text-indigo-600" :
                                      user.plan_name === 'Pro' ? "bg-blue-100 text-blue-600" :
                                      user.plan_name === 'Plus' ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"
                                    )}>
                                      {user.plan_name}
                                    </span>
                                  </td>
                                  <td className="px-8 py-5">
                                    <span className="text-sm font-black text-blue-600">{user.credits}</span>
                                  </td>
                                  <td className="px-8 py-5">
                                    <span className={cn(
                                      "text-[10px] font-black uppercase tracking-widest",
                                      user.plan_name === 'Free' ? "text-slate-400" : "text-amber-500"
                                    )}>
                                      {user.plan_name === 'Free' ? 'SELAMANYA' : user.plan_expires_at ? new Date(user.plan_expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                    </span>
                                  </td>
                                  <td className="px-8 py-5 text-xs text-slate-400">
                                    {new Date(user.created_at).toLocaleDateString('id-ID')}
                                  </td>
                                  <td className="px-8 py-5 text-right">
                                    <button 
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setEditForm({ 
                                          credits: user.credits, 
                                          plan_name: user.plan_name,
                                          plan_expires_at: user.plan_expires_at ? new Date(user.plan_expires_at).toISOString().split('T')[0] : ''
                                        });
                                      }}
                                      className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-blue-600 hover:text-white rounded-xl text-slate-500 transition-all shadow-sm"
                                    >
                                      <Edit size={16} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <Pagination 
                      current={currentPage} 
                      total={users.filter(u => u.email?.toLowerCase().includes(searchQuery.toLowerCase())).length} 
                      perPage={itemsPerPage} 
                      onPageChange={setCurrentPage} 
                    />
                  </motion.div>
                )}

                 {activeTab === 'laporan' && (
                  <motion.div
                    key="laporan"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <HistoryIcon size={22} className="text-blue-600" /> Log Aktivitas Konten
                      </h3>
                      <p className="text-sm text-slate-500">Monitor seluruh riwayat transformasi konten oleh pengguna.</p>
                    </div>
                    {history.length > 0 ? (
                      <>
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
                                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Model AI</th>
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
                                {sortedHistory
                                  .filter(h => 
                                    (h.profiles?.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                                    (h.input_content?.toLowerCase() || '').includes(searchQuery.toLowerCase())
                                  )
                                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                  .map((item) => (
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
                                      <td className="px-8 py-5">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded">
                                          {item.ai_models?.model_name || 'IndoRepurpose v1.0'}
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
                        <Pagination 
                          current={currentPage} 
                          total={sortedHistory.filter(h => 
                            (h.profiles?.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                            (h.input_content?.toLowerCase() || '').includes(searchQuery.toLowerCase())
                          ).length} 
                          perPage={itemsPerPage} 
                          onPageChange={setCurrentPage} 
                        />
                      </>
                    ) : (
                      <EmptyState message="Belum ada log riwayat transformasi konten." />
                    )}
                  </motion.div>
                )}
                  {activeTab === 'aduan' && (
                  <motion.div
                    key="aduan"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {tickets.length > 0 ? (
                      <>
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Subjek & Pesan</th>
                                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Pengguna</th>
                                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Aksi</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {tickets
                                  .filter(t => 
                                    t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    (t.profiles?.email || '').toLowerCase().includes(searchQuery.toLowerCase())
                                  )
                                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                  .map((ticket) => (
                                    <tr key={ticket.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                      <td className="px-8 py-5">
                                        <span className={cn(
                                          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                          ticket.status === 'open' ? "bg-amber-100 text-amber-600" :
                                          "bg-emerald-100 text-emerald-600"
                                        )}>
                                          {ticket.status}
                                        </span>
                                      </td>
                                      <td className="px-8 py-5 max-w-md">
                                        <p className="text-sm font-black text-slate-900 dark:text-white truncate mb-1">{ticket.subject}</p>
                                        <p className="text-xs text-slate-400 line-clamp-1">{ticket.message}</p>
                                      </td>
                                      <td className="px-8 py-5">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{ticket.profiles?.email}</p>
                                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                          <Clock size={10} /> {new Date(ticket.created_at).toLocaleDateString('id-ID')}
                                        </p>
                                      </td>
                                      <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          <button 
                                            onClick={() => {
                                              setSelectedTicketId(ticket.id);
                                              loadMessages(ticket.id);
                                            }}
                                            className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-blue-600 hover:text-white rounded-xl text-slate-500 transition-all shadow-sm group/btn"
                                            title="Buka Percakapan"
                                          >
                                            <MessageCircle size={16} />
                                          </button>
                                          {ticket.status !== 'resolved' ? (
                                            <button 
                                              onClick={() => handleUpdateStatus(ticket.id, 'resolved')}
                                              className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white rounded-xl text-slate-500 transition-all shadow-sm"
                                              title="Selesaikan"
                                            >
                                              <CheckCircle2 size={16} />
                                            </button>
                                          ) : (
                                            <button 
                                              onClick={() => handleUpdateStatus(ticket.id, 'open')}
                                              className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-amber-600 hover:text-white rounded-xl text-slate-500 transition-all shadow-sm"
                                              title="Aktifkan Kembali"
                                            >
                                              <RefreshCcw size={16} />
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <Pagination 
                          current={currentPage} 
                          total={tickets.filter(t => 
                            t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (t.profiles?.email || '').toLowerCase().includes(searchQuery.toLowerCase())
                          ).length} 
                          perPage={itemsPerPage} 
                          onPageChange={setCurrentPage} 
                        />
                      </>
                    ) : (
                      <EmptyState message="Semua masalah pengguna telah terselesaikan." />
                    )}
                  </motion.div>
                )}
                {activeTab === 'mesin' && (
                  <motion.div
                    key="mesin"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                      <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                          <Cpu className="text-blue-600" /> Koneksi Mesin AI
                        </h3>
                        <p className="text-sm text-slate-500">
                          Kelola model AI dari OpenRouter yang akan memproses konten. 
                          <a 
                            href="https://openrouter.ai/models?order=per_token_price&q=free" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-2 text-blue-600 hover:underline font-bold inline-flex items-center gap-1"
                          >
                            Lihat Model Gratis <ExternalLink size={12} />
                          </a>
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          setModelForm({ model_name: '', priority: 1, is_active: true });
                          setIsModelModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                      >
                        <Plus size={18} /> Tambah Model
                      </button>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Prioritas</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Model & Provider</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {aiModels.map((model) => (
                              <tr key={model.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                <td className="px-8 py-5">
                                  <div className="flex items-center gap-3">
                                    <input 
                                      type="number"
                                      value={model.priority}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        handleUpdateModelPriority(model.id, isNaN(val) ? 0 : val);
                                      }}
                                      className="w-12 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-[10px] font-bold text-slate-400 italic">#{model.priority}</span>
                                  </div>
                                </td>
                                <td className="px-8 py-5">
                                  <div className="flex items-center gap-4">
                                    <div className={cn(
                                      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0",
                                      model.is_active ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600" : "bg-slate-50 dark:bg-slate-800 text-slate-400"
                                    )}>
                                      <Cpu size={20} />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-black text-slate-900 dark:text-white truncate">{model.model_name}</p>
                                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">OpenRouter</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-8 py-5">
                                  <button 
                                    onClick={() => handleUpdateModelStatus(model.id, !model.is_active)}
                                    className={cn(
                                      "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                                      model.is_active 
                                        ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200" 
                                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    )}
                                  >
                                    {model.is_active ? 'Aktif' : 'Non-Aktif'}
                                  </button>
                                </td>
                                <td className="px-8 py-5 text-right">
                                  <button 
                                    onClick={() => handleDeleteModel(model.id)}
                                    className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                    title="Hapus Model"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {aiModels.length === 0 && (
                        <div className="py-20 flex flex-col items-center justify-center bg-white dark:bg-slate-900">
                          <Cpu size={48} className="text-slate-200 mb-4" />
                          <p className="text-slate-500 font-bold">Belum ada model AI yang terkonfigurasi.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
                {activeTab === 'ai_errors' && (
                  <motion.div
                    key="ai_errors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                      <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                          <ShieldAlert className="text-red-500" /> Log Kesalahan AI
                        </h3>
                        <p className="text-sm text-slate-500">
                          Daftar kegagalan teknis dari penyedia AI untuk kebutuhan audit dan debugging.
                        </p>
                      </div>
                      <button 
                        onClick={handleClearAIErrors}
                        disabled={clearingErrors || aiErrors.length === 0}
                        className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                      >
                        {clearingErrors ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                        Bersihkan Log
                      </button>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Waktu</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Model</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Pesan Kesalahan</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Input Preview</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
                            {aiErrors.map((err) => (
                              <tr key={err.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-8 py-5 whitespace-nowrap text-slate-500 font-medium">
                                  {new Date(err.created_at).toLocaleString('id-ID', { 
                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                                  }).replace(/\./g, ':')}
                                </td>
                                <td className="px-8 py-5">
                                  <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                    {err.model_name}
                                  </span>
                                </td>
                                <td className="px-8 py-5">
                                  <p className="text-red-500 font-bold max-w-xs break-words">{err.error_message}</p>
                                </td>
                                <td className="px-8 py-5">
                                  <p className="text-slate-400 italic text-xs max-w-xs truncate">{err.input_preview}</p>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {aiErrors.length === 0 && (
                        <div className="py-20 flex flex-col items-center justify-center bg-white dark:bg-slate-900">
                          <CheckCircle2 size={48} className="text-emerald-500 mb-4 opacity-20" />
                          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Semua Sistem AI Lancar</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </main>

      {/* Add AI Model Modal */}
      <AnimatePresence>
        {isModelModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModelModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Cpu size={20} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Tambah Model Baru</h3>
                </div>
                <button 
                  onClick={() => setIsModelModalOpen(false)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Nama Model OpenRouter</label>
                  <input 
                    type="text"
                    placeholder="Contoh: google/gemini-flash-1.5-8b:free"
                    value={modelForm.model_name}
                    onChange={(e) => setModelForm({...modelForm, model_name: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-bold transition-all"
                  />
                  <p className="text-[10px] text-slate-400 italic px-1">Pastikan nama model sesuai dengan identifier di OpenRouter.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Prioritas Eksekusi</label>
                  <input 
                    type="number"
                    value={modelForm.priority || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setModelForm({...modelForm, priority: isNaN(val) ? 0 : val});
                    }}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-bold transition-all"
                  />
                  <p className="text-[10px] text-slate-400 italic px-1">Angka lebih rendah (misal: 1) akan dicoba lebih dulu.</p>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <button 
                    onClick={() => setIsModelModalOpen(false)}
                    className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleAddModel}
                    disabled={updating}
                    className="flex-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {updating ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Simpan Model'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedLog.result_x && (
                    <ResultColumn 
                      title="X (Twitter)" 
                      icon={<TwitterIcon size={16} />} 
                      content={selectedLog.result_x} 
                      color="text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800"
                    />
                  )}
                  {selectedLog.result_linkedin && (
                    <ResultColumn 
                      title="LinkedIn" 
                      icon={<LinkedinIcon size={16} />} 
                      content={selectedLog.result_linkedin} 
                      color="text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                    />
                  )}
                  {selectedLog.result_instagram && (
                    <ResultColumn 
                      title="Instagram" 
                      icon={<InstagramIcon size={16} />} 
                      content={selectedLog.result_instagram} 
                      color="text-pink-600 bg-pink-50 dark:bg-pink-900/20"
                    />
                  )}
                  {selectedLog.result_tiktok && (
                    <ResultColumn 
                      title="TikTok" 
                      icon={<TiktokIcon size={16} />} 
                      content={selectedLog.result_tiktok} 
                      color="text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800"
                    />
                  )}
                  {selectedLog.result_newsletter && (
                    <ResultColumn 
                      title="Newsletter" 
                      icon={<NewsletterIcon size={16} />} 
                      content={selectedLog.result_newsletter} 
                      color="text-amber-600 bg-amber-50 dark:bg-amber-900/20"
                    />
                  )}
                  {selectedLog.result_threads && (
                    <ResultColumn 
                      title="Threads" 
                      icon={<ThreadsIcon size={16} />} 
                      content={selectedLog.result_threads} 
                      color="text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800"
                    />
                  )}
                  {selectedLog.result_highlights && (
                    <ResultColumn 
                      title="Highlights" 
                      icon={<HighlightsIcon size={16} />} 
                      content={selectedLog.result_highlights} 
                      color="text-purple-600 bg-purple-50 dark:bg-purple-900/20"
                    />
                  )}
                  {selectedLog.result_blog && (
                    <ResultColumn 
                      title="Blog Post" 
                      icon={<BlogIcon size={16} />} 
                      content={selectedLog.result_blog} 
                      color="text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                    />
                  )}
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

      <AnimatePresence>
        {selectedTicketId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicketId(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                    <LifeBuoy size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Chat Support</h3>
                    <p className="text-xs font-bold text-slate-400">ID Tiket: {selectedTicketId.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => loadMessages(selectedTicketId)}
                    disabled={!!processingId}
                    className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-blue-500 transition-colors"
                  >
                    <RefreshCw size={20} className={cn(processingId === 'refresh' && "animate-spin")} />
                  </button>
                  <button 
                    onClick={() => setSelectedTicketId(null)}
                    className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30 dark:bg-slate-900/30">
                {ticketMessages.map((msg) => (
                  <div key={msg.id} className={cn(
                    "flex flex-col max-w-[85%]",
                    currentUser && msg.sender_id === currentUser.id ? "ml-auto items-end" : "mr-auto items-start"
                  )}>
                    <div className={cn(
                      "p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm",
                      currentUser && msg.sender_id === currentUser.id
                        ? "bg-blue-600 text-white rounded-tr-none" 
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-tl-none"
                    )}>
                      {msg.message}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1 px-1">
                      {currentUser && msg.sender_id === currentUser.id ? 'Anda (Admin)' : (msg.profiles?.email || 'Pengguna')} • {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                <div ref={chatEndRef} />
                {ticketMessages.length === 0 && (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                      <MessageCircle size={32} />
                    </div>
                    <p className="text-sm font-bold text-slate-400">Belum ada percakapan</p>
                  </div>
                )}
              </div>

              <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                {tickets.find(t => t.id === selectedTicketId)?.status === 'resolved' ? (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 size={16} />
                    </div>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 leading-relaxed text-center flex-1">
                      Tiket telah selesai diselesaikan. Chat ditutup.
                    </p>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                      placeholder="Tulis balasan..."
                      className="flex-1 px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={!replyMessage.trim() || !!processingId}
                      className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {selectedUser && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                  <Edit className="text-blue-600" /> Edit User Profile
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">{selectedUser.email}</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Kredit</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="number"
                      value={editForm.credits}
                      onChange={(e) => setEditForm({ ...editForm, credits: parseInt(e.target.value) || 0 })}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Paket Layanan</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Free', 'Plus', 'Pro', 'Max'].map((plan) => (
                      <button
                        key={plan}
                        onClick={() => setEditForm({ ...editForm, plan_name: plan })}
                        className={cn(
                          "py-3 rounded-xl text-xs font-black transition-all border",
                          editForm.plan_name === plan 
                            ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20" 
                            : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-500 hover:border-blue-500/30"
                        )}
                      >
                        {plan}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Masa Aktif Paket (Opsional)</label>
                  <input 
                    type="date"
                    value={editForm.plan_expires_at}
                    onChange={(e) => setEditForm({ ...editForm, plan_expires_at: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-4">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 py-4 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-200 dark:border-slate-800 hover:bg-slate-100 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleUpdateUser}
                  disabled={updating}
                  className="flex-2 px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {updating ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                  Simpan Perubahan
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Custom Confirmation Modal */}
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className={cn(
                  "w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg transition-transform",
                  confirmModal.type === 'danger' ? "bg-red-50 text-red-600 shadow-red-500/20" :
                  confirmModal.type === 'success' ? "bg-emerald-50 text-emerald-600 shadow-emerald-500/20" :
                  "bg-blue-50 text-blue-600 shadow-blue-500/20"
                )}>
                  {confirmModal.type === 'danger' ? <ShieldAlert size={40} /> : 
                   confirmModal.type === 'success' ? <CheckCircle2 size={40} /> : <Clock size={40} />}
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 font-display">{confirmModal.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">{confirmModal.message}</p>
                
                <div className="flex gap-4">
                  <button
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    onClick={confirmModal.onConfirm}
                    disabled={!!processingId}
                    className={cn(
                      "flex-1 py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2",
                      confirmModal.type === 'danger' ? "bg-red-600 hover:bg-red-700 shadow-red-500/20" :
                      confirmModal.type === 'success' ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" :
                      "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                    )}
                  >
                    {!!processingId ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    Konfirmasi
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

function Pagination({ current, total, perPage, onPageChange }: any) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-6">
      <button
        disabled={current === 1}
        onClick={() => onPageChange(current - 1)}
        className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 disabled:opacity-30 hover:bg-slate-50 transition-all"
      >
        <ChevronRight size={18} className="rotate-180" />
      </button>
      
      <div className="flex items-center gap-1">
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i + 1}
            onClick={() => onPageChange(i + 1)}
            className={cn(
              "w-10 h-10 rounded-xl font-black text-xs transition-all",
              current === i + 1 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-50"
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <button
        disabled={current === totalPages}
        onClick={() => onPageChange(current + 1)}
        className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 disabled:opacity-30 hover:bg-slate-50 transition-all"
      >
        <ChevronRight size={18} />
      </button>
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

function VerifikasiCard({ tx, onApprove, onReject, processingId, methodInfo }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/20 flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-blue-500/30 transition-all"
    >
      <div className="flex flex-col md:flex-row items-center gap-8 w-full md:w-auto text-center md:text-left">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 shrink-0 overflow-hidden">
          {tx.proof_url ? (
            <a href={tx.proof_url} target="_blank" rel="noopener noreferrer" className="w-full h-full group/proof relative">
              <img src={tx.proof_url} alt="Proof" className="w-full h-full object-cover transition-transform group-hover/proof:scale-110" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/proof:opacity-100 flex items-center justify-center transition-opacity">
                <Eye size={16} className="text-white" />
              </div>
            </a>
          ) : (
            <CreditCard size={32} />
          )}
        </div>
        
        <div className="space-y-1 min-w-0">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600">Verification Pending</span>
            <span className="text-xs font-bold text-slate-400">Order ID: {tx.order_id}</span>
            {tx.proof_url && (
              <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center gap-1">
                <Check size={8} /> Bukti Tersedia
              </span>
            )}
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white truncate">
            Rp {(tx.amount + (tx.unique_code || 0)).toLocaleString('id-ID')}
          </h3>
          <div className="flex items-center justify-center md:justify-start gap-4 text-slate-500 font-medium">
            <div className="flex items-center gap-1.5 text-xs">
              <Mail size={14} className="text-blue-500" />
              {tx.profiles?.email || `ID: ${tx.user_id.slice(0, 8)}...`}
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Clock size={14} className="text-blue-500" />
              {new Date(tx.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          {methodInfo && (
            <div className="mt-2 flex items-center justify-center md:justify-start gap-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800 w-fit mx-auto md:mx-0">
              <img src={methodInfo.logo} alt="" className="w-5 h-5 object-contain" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                via {methodInfo.name}
              </span>
            </div>
          )}
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
