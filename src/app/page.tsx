'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, MessageSquare, Copy, Check, Loader2, History as HistoryIcon, Trash2, ArrowUpRight, Sparkles, Eye, LifeBuoy, Send, Clock, CheckCircle2, MessageCircle, RefreshCw, Search, ArrowLeft } from 'lucide-react';
import { processContent, getHistory, deleteHistory, createTicket, getTickets, getTicketMessages, sendTicketMessage } from './actions';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Youtube as YoutubeIcon, Twitter as TwitterIcon, Linkedin as LinkedinIcon, Instagram as InstagramIcon, Mail as MailIcon, Tiktok as TiktokIcon, Threads as ThreadsIcon } from '@/components/Icons';
import { PreviewModal } from '@/components/PreviewModal';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { HowItWorks } from '@/components/HowItWorks';
import { TransformationShowcase } from '@/components/TransformationShowcase';
import { Pricing } from '@/components/Pricing';
import { Footer } from '@/components/Footer';
import { HistorySkeleton } from '@/components/HistorySkeleton';
import { AuthModal } from '@/components/AuthModal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface HistoryItem {
  id: string;
  timestamp: number;
  input: string;
  mode: 'url' | 'text';
  tone: string;
  results: {
    x: string;
    linkedin: string;
    instagram: string;
    tiktok: string;
    newsletter: string;
    threads: string;
    highlights: string;
    blog: string;
  };
}

export default function Home() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'url' | 'text'>('url');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [results, setResults] = useState<{ x: string, linkedin: string, instagram: string, tiktok: string, newsletter: string, threads: string, highlights: string, blog: string } | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [tone, setTone] = useState<string>('professional');
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{ platform: string, content: string }>({ platform: '', content: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean, id: string }>({ show: false, id: '' });
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketForm, setTicketForm] = useState({ subject: '', message: '' });
  const [ticketLoading, setTicketLoading] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [replyMessage, setReplyMessage] = useState("");
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [unreadTicketIds, setUnreadTicketIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<'all' | 'url' | 'text'>('all');
  const [displayLimit, setDisplayLimit] = useState(5);
  const resultsRef = React.useRef<HTMLDivElement>(null);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ticketMessages]);

  useEffect(() => {
    let interval: any;
    if (selectedTicketId && showSupportModal) {
      interval = setInterval(() => {
        loadTicketMessages(selectedTicketId);
        fetchTickets(); // Also refresh tickets to catch status changes
      }, 30000); // Poll every 30 seconds to save data/battery
    }
    return () => clearInterval(interval);
  }, [selectedTicketId, showSupportModal]);

  useEffect(() => {
    if (currentUser) {
      const supabase = createClient();
      const channel = supabase
        .channel(`user-updates:${currentUser.id}`)
        .on('broadcast', { event: 'ticket-status-updated' }, () => {
          console.log('Global ticket status update received');
          fetchTickets();
          setHasUnreadMessages(true);
        })
        .on('broadcast', { event: 'new-chat-message' }, (envelope) => {
          const payload = envelope.payload;
          const isViewingThisTicket = showSupportModal && selectedTicketId === payload?.ticketId;
          
          if (!isViewingThisTicket) {
            setHasUnreadMessages(true);
            if (payload?.ticketId) {
              setUnreadTicketIds(prev => [...new Set([...prev, payload.ticketId])]);
            }
          }
          fetchTickets();
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUser]);

  useEffect(() => {
    fetchHistory();
    
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    fetchUser();

    // Auto-open support from URL parameter
    const params = new URLSearchParams(window.location.search);
    if (params.get('support') === 'true') {
      setShowSupportModal(true);
      const orderId = params.get('orderId');
      if (orderId) {
        setTicketForm(prev => ({ 
          ...prev, 
          subject: `Konfirmasi Pembayaran #${orderId.slice(-8)}` 
        }));
      }
    }
  }, []);

  // Prevent accidental refresh/close during processing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (loading) {
        e.preventDefault();
        e.returnValue = 'Proses sedang berjalan. Jika Anda keluar sekarang, hasil mungkin tidak tersimpan (Kredit tetap utuh).';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [loading]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    const res = await getHistory();
    if (res.success) {
      setHistory(res.data || []);
    }
    setHistoryLoading(false);
  };

  const cleanYouTubeUrl = (url: string) => {
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) return url;
    
    try {
      const urlObj = new URL(url);
      
      // Handle youtu.be
      if (url.includes('youtu.be')) {
        return `https://youtu.be${urlObj.pathname}`;
      }
      
      // Handle youtube.com/watch
      if (urlObj.pathname === '/watch') {
        const v = urlObj.searchParams.get('v');
        if (v) return `https://www.youtube.com/watch?v=${v}`;
      }
      
      // Handle youtube.com/shorts
      if (urlObj.pathname.startsWith('/shorts/')) {
        return `https://www.youtube.com${urlObj.pathname}`;
      }
      
      return url;
    } catch (e) {
      return url;
    }
  };

  const handleProcess = async () => {
    if (!input) return;

    let processedInput = input;
    if (mode === 'url') {
      processedInput = cleanYouTubeUrl(input.trim());
      setInput(processedInput);
    }

    // Check for Login
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    const res = await processContent(processedInput, mode, tone);
    
    if (res.success) {
      setResults(res.data);
      toast.success('Konten berhasil diproses!');
      
      // Notify components to refresh credits
      window.dispatchEvent(new CustomEvent('credits-updated'));
      
      fetchHistory();
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    } else {
      setError(res.error || 'Terjadi kesalahan sistem.');
      toast.error('Gagal memproses konten');
    }
    setLoading(false);
  };

  const deleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm({ show: true, id });
  };

  const confirmDelete = async () => {
    const { id } = deleteConfirm;
    const res = await deleteHistory(id);
    if (res.success) {
      setHistory(prev => prev.filter(item => item.id !== id));
      toast.info('Proyek berhasil dihapus');
    }
    setDeleteConfirm({ show: false, id: '' });
  };

  const loadFromHistory = (item: HistoryItem) => {
    setInput(item.input);
    setMode(item.mode);
    setTone(item.tone); // Add this to sync tone
    setResults(item.results);
    
    // Smooth scroll to results
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    toast.info('Proyek dimuat dari arsip');
  };

  const fetchTickets = async () => {
    const res = await getTickets();
    if (res.success) {
      setTickets(res.data || []);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.subject || !ticketForm.message) return;
    
    setTicketLoading(true);
    const res = await createTicket(ticketForm.subject, ticketForm.message);
    if (res.success) {
      // Broadcast to Admin
      const supabase = createClient();
      supabase.channel('admin-global-updates').send({
        type: 'broadcast',
        event: 'new-ticket',
        payload: { subject: ticketForm.subject }
      });

      toast.success('Aduan berhasil dikirim', {
        description: 'Tim kami akan segera memproses laporan Anda.'
      });
      setTicketForm({ subject: '', message: '' });
      fetchTickets();
      
      // Switch to history tab and automatically select the new ticket
      setPreviewData(prev => ({ ...prev, platform: 'history' }));
      if (res.data?.id) {
        selectTicket(res.data.id);
      }
    } else {
      toast.error('Gagal mengirim aduan');
    }
    setTicketLoading(false);
  };

  useEffect(() => {
    if (showSupportModal) {
      fetchTickets();
    }
  }, [showSupportModal]);

  const loadTicketMessages = async (ticketId: string) => {
    const res = await getTicketMessages(ticketId);
    if (res.success) {
      const messages = res.data || [];
      setTicketMessages(messages);
      if (messages.length > 0 && currentUser) {
        // If last message sender is NOT current user, then Admin has replied
        setIsWaitingForAdmin(messages[messages.length - 1]?.sender_id === currentUser.id);
      } else {
        setIsWaitingForAdmin(false);
      }
    }
  };

  const [isWaitingForAdmin, setIsWaitingForAdmin] = useState(false);

  const selectTicket = (id: string) => {
    setSelectedTicketId(id);
    setUnreadTicketIds(prev => prev.filter(tid => tid !== id));
    loadTicketMessages(id);
  };

  const handleSendUserReply = async () => {
    if (!selectedTicketId || !replyMessage.trim()) return;
    setTicketLoading(true);
    const res = await sendTicketMessage(selectedTicketId, replyMessage);
    if (res.success) {
      // Broadcast to Admin
      const supabase = createClient();
      supabase.channel(`chat:${selectedTicketId}`).send({
        type: 'broadcast',
        event: 'new-chat-message',
        payload: { text: replyMessage }
      });

      setReplyMessage("");
      setIsWaitingForAdmin(true); // Immediate lockout
      loadTicketMessages(selectedTicketId);
    } else {
      toast.error(res.error);
    }
    setTicketLoading(false);
  };

  useEffect(() => {
    if (selectedTicketId) {
      const supabase = createClient();
      const channel = supabase
        .channel(`chat:${selectedTicketId}`) // Changed to match admin channel name exactly
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${selectedTicketId}`
        }, () => {
          loadTicketMessages(selectedTicketId);
        })
        .on('broadcast', { event: 'new-chat-message' }, () => {
          console.log('New chat message broadcast received by User');
          loadTicketMessages(selectedTicketId);
        })
        .on('broadcast', { event: 'ticket-status-updated' }, () => {
          console.log('Ticket status updated broadcast received by User');
          fetchTickets();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedTicketId]);

  const copyToClipboard = (text: string, title: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${title} disalin ke clipboard`, {
      description: "Anda siap untuk mempostingnya!",
    });
  };

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.input.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || item.mode === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-500 font-sans">
      <Navbar />

      <main className="flex-1">
        <Hero />

        {/* Tool Section */}
        <section id="transform" className="py-12 md:py-24 px-6 relative z-10 transition-colors duration-500">
          <div className="container mx-auto max-w-4xl">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] as const }}
              className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl rounded-[2rem] md:rounded-[3rem] shadow-2xl shadow-blue-500/10 border border-white/40 dark:border-slate-800/60 p-6 sm:p-8 md:p-10 relative overflow-hidden glow-blue"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.08] pointer-events-none">
                <Sparkles size={100} className="text-blue-600" />
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 relative z-10 w-full">
                <div className="flex gap-2 p-2 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md rounded-full w-full sm:w-fit relative overflow-hidden">
                  <button
                    onClick={() => setMode('url')}
                    className={cn(
                      "relative flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 sm:px-8 py-3.5 rounded-full transition-colors duration-500 font-black text-xs uppercase tracking-wider z-10",
                      mode === 'url' ? "text-blue-600 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    {mode === 'url' && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute inset-0 bg-white dark:bg-slate-700 shadow-xl shadow-blue-500/10 rounded-full"
                        transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}
                      />
                    )}
                    <div className="relative z-20 flex items-center gap-2">
                      <div className="flex -space-x-1 items-center">
                        <YoutubeIcon size={18} />
                        <div className="bg-white dark:bg-slate-700 rounded-full p-0.5 border border-slate-200 dark:border-slate-800 -ml-1.5 mt-2">
                          <ArrowUpRight size={10} className="text-blue-600" />
                        </div>
                      </div>
                      <span>Tautan</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setMode('text')}
                    className={cn(
                      "relative flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 sm:px-8 py-3.5 rounded-full transition-colors duration-500 font-black text-xs uppercase tracking-wider z-10",
                      mode === 'text' ? "text-blue-600 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    {mode === 'text' && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute inset-0 bg-white dark:bg-slate-700 shadow-xl shadow-blue-500/10 rounded-full"
                        transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}
                      />
                    )}
                    <div className="relative z-20 flex items-center gap-2">
                      <FileText size={18} />
                      <span>Teks</span>
                    </div>
                  </button>
                </div>
                
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] hidden md:block">
                  IndoRepurpose Intelligence Engine v1.0
                </p>
              </div>

              <motion.div 
                layout 
                transition={{ duration: 0.85, ease: [0.65, 0, 0.35, 1] as const }} 
                className="mb-8 relative z-10"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {mode === 'url' ? (
                    <motion.div 
                      key="url"
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: 10 }}
                      transition={{ 
                        duration: 0.85, 
                        ease: [0.65, 0, 0.35, 1] as const
                      }}
                      className="overflow-hidden p-4 -m-4"
                    >
                      <input
                        type="text"
                        placeholder="Tempel URL YouTube atau link artikel berita/blog..."
                        className="w-full px-5 md:px-6 py-4 rounded-2xl md:rounded-[2rem] border-2 border-white/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition-all text-base md:text-lg placeholder:text-slate-400 font-sans shadow-inner"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                      />
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="text"
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: 10 }}
                      transition={{ 
                        duration: 0.85, 
                        ease: [0.65, 0, 0.35, 1] as const
                      }}
                      className="overflow-hidden p-4 -m-4"
                    >
                      <textarea
                        placeholder="Tuliskan draf kasar atau ide brilian Anda di sini..."
                        className="w-full px-5 md:px-6 py-4 rounded-2xl md:rounded-[2rem] border-2 border-white/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition-all min-h-[250px] text-base md:text-lg placeholder:text-slate-400 font-sans shadow-inner leading-relaxed"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Brand Voice Selector */}
              <div className="mb-10 relative z-10">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 ml-2">
                  Pilih Gaya Bahasa AI (Brand Voice)
                </p>
                <div className="flex flex-wrap gap-2 md:gap-3">
                  {[
                    { id: 'professional', label: 'Profesional', icon: '👔' },
                    { id: 'casual', label: 'Santai', icon: '😎' },
                    { id: 'inspirational', label: 'Inspiratif', icon: '✨' },
                    { id: 'witty', label: 'Witty', icon: '🧠' },
                    { id: 'genz', label: 'Gen-Z', icon: '🚀' },
                    { id: 'persuasive', label: 'Persuasif', icon: '🎯' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTone(t.id)}
                      className={cn(
                        "relative flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 font-bold text-xs border shadow-sm",
                        tone === t.id 
                          ? "bg-blue-600 border-blue-600 text-white shadow-blue-500/20 scale-105 z-10" 
                          : "bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800"
                      )}
                    >
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                      {tone === t.id && (
                        <motion.div 
                          layoutId="activeTone"
                          className="absolute inset-0 bg-blue-600 rounded-xl -z-10"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <motion.button
                layout
                transition={{ duration: 0.85, ease: [0.65, 0, 0.35, 1] as const }}
                onClick={handleProcess}
                disabled={loading || !input}
                className="group relative w-full overflow-hidden bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black py-4 md:py-5 rounded-2xl md:rounded-[2rem] flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-500/30 active:scale-[0.98] text-base md:text-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    <span>Menganalisis Konten...</span>
                  </>
                ) : (
                  <>
                    <span className="tracking-widest">MULAI TRANSFORMASI ✨</span>
                    <ArrowUpRight size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </>
                )}
              </motion.button>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-8 p-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-600 dark:text-red-400 text-sm font-black flex items-center gap-4"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0 shadow-[0_0_15px_rgba(220,38,38,0.5)] animate-pulse" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </section>

        {/* Results Section */}
        <div id="results" className="relative z-10">
          <AnimatePresence>
            {results && (
              <section ref={resultsRef} className="py-32 px-6 transition-colors duration-500 scroll-mt-24">
                <div className="container mx-auto max-w-7xl">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center mb-24"
                  >
                    <div className="inline-block px-5 py-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 mb-8 font-black text-xs uppercase tracking-[0.3em]">
                      Transformation Complete
                    </div>
                    <h2 className="text-3xl md:text-5xl font-extrabold mb-4 md:mb-6 font-display tracking-tight text-slate-900 dark:text-white">Konten Siap Publikasi</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto font-sans leading-relaxed">
                      AI telah mengoptimalkan konten Anda untuk setiap platform. Salin hasil di bawah dan mulai bagikan ide Anda!
                    </p>
                  </motion.div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {results.x && (
                      <ResultCard 
                        index={0}
                        title="X (Twitter)" 
                        icon={<TwitterIcon size={20} />} 
                        color="text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800"
                        content={results.x} 
                        onCopy={() => copyToClipboard(results.x, "Postingan X")}
                        onPreview={() => {
                          setPreviewData({ platform: 'X', content: results.x });
                          setShowPreview(true);
                        }}
                      />
                    )}
                    {results.linkedin && (
                      <ResultCard 
                        index={1}
                        title="LinkedIn Post" 
                        icon={<LinkedinIcon size={20} />} 
                        color="text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                        content={results.linkedin} 
                        onCopy={() => copyToClipboard(results.linkedin, "Postingan LinkedIn")}
                        onPreview={() => {
                          setPreviewData({ platform: 'LinkedIn', content: results.linkedin });
                          setShowPreview(true);
                        }}
                      />
                    )}
                    {results.instagram && (
                      <ResultCard 
                        index={2}
                        title="Instagram Caption" 
                        icon={<InstagramIcon size={20} />} 
                        color="text-pink-600 bg-pink-50 dark:bg-pink-900/20"
                        content={results.instagram} 
                        onCopy={() => copyToClipboard(results.instagram, "Caption Instagram")}
                        onPreview={() => {
                          setPreviewData({ platform: 'Instagram', content: results.instagram });
                          setShowPreview(true);
                        }}
                      />
                    )}
                    {results.tiktok && (
                      <ResultCard 
                        index={3}
                        title="TikTok Script" 
                        icon={<TiktokIcon size={20} />} 
                        color="text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800"
                        content={results.tiktok} 
                        onCopy={() => copyToClipboard(results.tiktok, "Script TikTok")}
                        onPreview={() => {
                          setPreviewData({ platform: 'TikTok', content: results.tiktok });
                          setShowPreview(true);
                        }}
                      />
                    )}
                    {results.newsletter && (
                      <ResultCard 
                        index={4}
                        title="Newsletter" 
                        icon={<MessageSquare size={20} />} 
                        color="text-amber-600 bg-amber-50 dark:bg-amber-900/20"
                        content={results.newsletter} 
                        onCopy={() => copyToClipboard(results.newsletter, "Ringkasan Newsletter")}
                        onPreview={() => {
                          setPreviewData({ platform: 'Newsletter', content: results.newsletter });
                          setShowPreview(true);
                        }}
                      />
                    )}
                    {results.threads && (
                      <ResultCard 
                        index={5}
                        title="Threads" 
                        icon={<ThreadsIcon size={20} />} 
                        color="text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800"
                        content={results.threads} 
                        onCopy={() => copyToClipboard(results.threads, "Postingan Threads")}
                        onPreview={() => {
                          setPreviewData({ platform: 'Threads', content: results.threads });
                          setShowPreview(true);
                        }}
                      />
                    )}
                    {results.highlights && (
                      <ResultCard 
                        index={6}
                        title="Highlights" 
                        icon={<Sparkles size={20} />} 
                        color="text-purple-600 bg-purple-50 dark:bg-purple-900/20"
                        content={results.highlights} 
                        onCopy={() => copyToClipboard(results.highlights, "Video Highlights")}
                        onPreview={() => {
                          setPreviewData({ platform: 'Highlights', content: results.highlights });
                          setShowPreview(true);
                        }}
                      />
                    )}
                    {results.blog && (
                      <ResultCard 
                        index={7}
                        title="Blog Post" 
                        icon={<FileText size={20} />} 
                        color="text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                        content={results.blog} 
                        onCopy={() => copyToClipboard(results.blog, "SEO Blog Post")}
                        onPreview={() => {
                          setPreviewData({ platform: 'Blog', content: results.blog });
                          setShowPreview(true);
                        }}
                      />
                    )}
                  </div>
                </div>
              </section>
            )}
          </AnimatePresence>
        </div>

      {/* Floating Support Button */}
      <button 
        onClick={() => {
          setShowSupportModal(true);
          setHasUnreadMessages(false);
        }}
        className="fixed bottom-8 right-8 z-[90] w-14 h-14 md:w-16 md:h-16 bg-blue-600 text-white rounded-full shadow-2xl shadow-blue-500/40 flex items-center justify-center hover:scale-110 hover:rotate-12 transition-all duration-300 group"
      >
        <LifeBuoy size={28} className="group-hover:animate-pulse" />
        
        {hasUnreadMessages && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full animate-bounce shadow-lg" />
        )}

        <div className="absolute right-full mr-4 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Pusat Bantuan
        </div>
      </button>

      {/* Support Modal */}
      <AnimatePresence>
        {showSupportModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSupportModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl border border-white/20 dark:border-slate-800"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                      <LifeBuoy className="text-blue-600" /> Pusat Bantuan
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Kami siap membantu kendala Anda</p>
                  </div>
                  <button 
                    onClick={() => setShowSupportModal(false)}
                    className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
                  >
                    <Trash2 size={20} className="rotate-45" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 bg-slate-50 dark:bg-slate-950/50 m-6 rounded-2xl">
                  <button 
                    onClick={() => setPreviewData({ platform: 'new', content: '' })}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-xl text-sm font-black transition-all",
                      previewData.platform !== 'history' ? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    Kirim Aduan
                  </button>
                  <button 
                    onClick={() => setPreviewData({ platform: 'history', content: '' })}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-xl text-sm font-black transition-all",
                      previewData.platform === 'history' ? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    Riwayat Tiket ({tickets.length})
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 pt-0">
                  {previewData.platform !== 'history' ? (
                    <form onSubmit={handleCreateTicket} className="space-y-6">
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Subjek Masalah</label>
                        <input 
                          type="text"
                          value={ticketForm.subject}
                          onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})}
                          placeholder="Misal: Gagal memproses video YouTube"
                          className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-white font-bold"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Detail Aduan</label>
                        <textarea 
                          rows={5}
                          value={ticketForm.message}
                          onChange={(e) => setTicketForm({...ticketForm, message: e.target.value})}
                          placeholder="Jelaskan kendala Anda secara detail agar tim kami bisa membantu lebih cepat..."
                          className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-white font-bold resize-none"
                          required
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={ticketLoading}
                        className="w-full py-5 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 disabled:opacity-50"
                      >
                        {ticketLoading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                        Kirim Aduan Sekarang
                      </button>
                    </form>
                  ) : selectedTicketId ? (
                    <div className="flex flex-col h-full min-h-[400px]">
                      <div className="flex items-center justify-between mb-6">
                        <button 
                          onClick={() => setSelectedTicketId(null)}
                          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-blue-500/50 group transition-all"
                        >
                          <ArrowLeft size={14} className="text-slate-400 group-hover:text-blue-600 group-hover:-translate-x-1 transition-all" />
                          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Kembali ke Riwayat</span>
                        </button>
                        <button 
                          onClick={() => loadTicketMessages(selectedTicketId!)}
                          disabled={ticketLoading}
                          className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-all"
                        >
                          <RefreshCw size={14} className={cn(ticketLoading && "animate-spin")} />
                        </button>
                      </div>

                      <div className="flex-1 space-y-6 mb-6 overflow-y-auto pr-2 max-h-[400px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                        {ticketMessages.map((msg) => (
                          <div key={msg.id} className={cn(
                            "flex flex-col max-w-[85%]",
                            currentUser && msg.sender_id === currentUser.id ? "ml-auto items-end" : "mr-auto items-start"
                          )}>
                            <div className={cn(
                              "p-4 rounded-2xl text-sm font-medium shadow-sm",
                              currentUser && msg.sender_id === currentUser.id
                                ? "bg-blue-600 text-white rounded-tr-none" 
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none" 
                            )}>
                              {msg.message}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1 px-1">
                              {currentUser && msg.sender_id === currentUser.id ? 'Anda' : 'Admin'} • {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                        {ticketMessages.length === 0 && (
                          <div className="text-center py-10 opacity-50">
                            <p className="text-sm font-bold">Menunggu respon tim kami...</p>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
                        {tickets.find(t => t.id === selectedTicketId)?.status === 'resolved' ? (
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center text-emerald-600">
                              <CheckCircle2 size={16} />
                            </div>
                            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 leading-relaxed">
                              Masalah ini telah selesai diselesaikan. Chat ditutup.
                            </p>
                          </div>
                        ) : isWaitingForAdmin ? (
                          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-800/50 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center text-amber-600">
                              <Clock size={16} />
                            </div>
                            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                              Mohon tunggu balasan dari Admin sebelum mengirim pesan berikutnya.
                            </p>
                          </div>
                        ) : (
                          <div className="flex gap-3">
                            <input
                              type="text"
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSendUserReply()}
                              placeholder="Tulis balasan..."
                              className="flex-1 px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                            <button
                              onClick={handleSendUserReply}
                              disabled={!replyMessage.trim() || ticketLoading}
                              className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                            >
                              <Send size={20} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="max-h-[500px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                      {tickets.length === 0 ? (
                        <div className="text-center py-12">
                          <MessageCircle size={48} className="mx-auto text-slate-200 mb-4" />
                          <p className="text-slate-400 font-bold">Belum ada riwayat aduan</p>
                        </div>
                      ) : (
                        tickets.map((ticket) => (
                          <div 
                            key={ticket.id} 
                            onClick={() => selectTicket(ticket.id)}
                            className={cn(
                              "relative p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border group hover:border-blue-500/30 transition-all cursor-pointer",
                              unreadTicketIds.includes(ticket.id) ? "border-blue-500/50 ring-2 ring-blue-500/5 shadow-lg shadow-blue-500/5" : "border-slate-100 dark:border-slate-800"
                            )}
                          >
                            {unreadTicketIds.includes(ticket.id) && (
                              <div className="absolute top-2 right-2 flex h-3.5 w-3.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-600 border-2 border-white dark:border-slate-900"></span>
                              </div>
                            )}
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-black text-slate-900 dark:text-white pr-4 group-hover:text-blue-600 transition-colors">
                                {ticket.subject}
                              </h4>
                              <span className={cn(
                                "shrink-0 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                ticket.status === 'open' ? "bg-amber-100 text-amber-600" :
                                ticket.status === 'in_progress' ? "bg-blue-100 text-blue-600" :
                                "bg-emerald-100 text-emerald-600"
                              )}>
                                {ticket.status}
                              </span>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">{ticket.message}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                                <span className="flex items-center gap-1.5"><Clock size={14} /> {new Date(ticket.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                {ticket.status === 'resolved' && <span className="flex items-center gap-1.5 text-emerald-500"><CheckCircle2 size={14} /> Terselesaikan</span>}
                              </div>
                              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Lihat Chat &rarr;</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        <PreviewModal 
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        platform={previewData.platform}
        content={previewData.content}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm({ show: false, id: '' })}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 text-center"
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400 mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Hapus Proyek?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
                Tindakan ini tidak dapat dibatalkan. Data proyek ini akan dihapus permanen dari arsip Anda.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirm({ show: false, id: '' })}
                  className="flex-1 px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-500/20 transition-colors"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        <HowItWorks />
        <TransformationShowcase />

        <Pricing />

        <section id="history" className="py-24 md:py-32 px-4 sm:px-6 relative overflow-hidden z-10 border-t border-slate-100/50 dark:border-slate-800/50 transition-colors duration-500 w-full flex flex-col justify-center min-h-[80vh] bg-transparent">

          {/* Mesh Gradient Background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] z-0">
            <div className="absolute top-[10%] -left-[5%] w-[40%] h-[40%] bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[150px] animate-pulse" />
            <div className="absolute bottom-[10%] -right-[5%] w-[40%] h-[40%] bg-indigo-400/20 dark:bg-indigo-600/10 rounded-full blur-[150px] animate-pulse delay-1000" />
          </div>

          <div className="container mx-auto max-w-5xl w-full relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12 md:mb-20"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4 border border-blue-100 dark:border-blue-800/50">
                <HistoryIcon size={14} /> Cloud Archive
              </div>
              <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                Arsip <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Proyek Anda</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium font-sans leading-relaxed">
                Akses kembali semua hasil transformasi konten Anda yang tersimpan aman di cloud.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row items-center gap-4 mb-10"
            >
              <div className="relative flex-1 w-full group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Search size={18} />
                </div>
                <input 
                  type="text"
                  placeholder="Cari judul video atau teks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-14 pl-14 pr-6 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 dark:focus:ring-blue-500/10 transition-all text-slate-700 dark:text-slate-200 font-medium"
                />
              </div>
              
              <div className="flex items-center p-1.5 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700 w-full md:w-auto">
                <button 
                  onClick={() => setActiveFilter('all')}
                  className={cn(
                    "flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    activeFilter === 'all' ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  Semua
                </button>
                <button 
                  onClick={() => setActiveFilter('url')}
                  className={cn(
                    "flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    activeFilter === 'url' ? "bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  YouTube
                </button>
                <button 
                  onClick={() => setActiveFilter('text')}
                  className={cn(
                    "flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    activeFilter === 'text' ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  Teks
                </button>
              </div>
            </motion.div>

            {historyLoading ? (
              <HistorySkeleton />
            ) : filteredHistory.length > 0 ? (
              <div className="space-y-6">
                <div className="grid gap-6 w-full">
                  <AnimatePresence mode="popLayout">
                    {filteredHistory.slice(0, displayLimit).map((item) => (
                      <motion.div 
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ 
                          duration: 0.5,
                          layout: { type: "spring", stiffness: 300, damping: 30 }
                        }}
                        onClick={() => loadFromHistory(item)}
                        className="group relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-slate-800/40 p-5 md:p-7 rounded-[2.5rem] hover:border-blue-500/50 transition-all duration-500 cursor-pointer hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6"
                      >
                        <div className="flex items-center gap-5 flex-1 min-w-0 overflow-hidden">
                          <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
                            item.mode === 'url' 
                              ? "bg-red-500 text-white shadow-red-500/20" 
                              : "bg-blue-600 text-white shadow-blue-600/20"
                          )}>
                            {item.mode === 'url' ? <YoutubeIcon size={24} /> : <FileText size={24} />}
                          </div>
                          
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className={cn(
                                "text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border",
                                item.mode === 'url' 
                                  ? "bg-red-50 dark:bg-red-900/20 text-red-600 border-red-100 dark:border-red-900/30" 
                                  : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100 dark:border-blue-900/30"
                              )}>
                                {item.mode === 'url' ? 'YouTube' : 'Teks'}
                              </span>
                              <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                                {item.tone}
                              </span>
                            </div>
                            <h3 className="font-black text-lg md:text-xl text-slate-900 dark:text-white line-clamp-1 break-all leading-tight">
                              {item.input}
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider flex items-center gap-2">
                              <Clock size={10} />
                              {new Date(item.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} • {new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-6 md:border-l border-slate-100 dark:border-slate-800 md:pl-6">
                          <div className="flex items-center gap-3">
                            <div className="flex -space-x-1.5">
                              {item.results.x && <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 border-2 border-white dark:border-slate-900 shadow-sm"><TwitterIcon size={12} /></div>}
                              {item.results.linkedin && <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 border-2 border-white dark:border-slate-900 shadow-sm"><LinkedinIcon size={12} /></div>}
                              {item.results.instagram && <div className="w-8 h-8 rounded-lg bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center text-pink-600 border-2 border-white dark:border-slate-900 shadow-sm"><InstagramIcon size={12} /></div>}
                              {item.results.tiktok && <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white border-2 border-white dark:border-slate-900 shadow-sm"><TiktokIcon size={12} /></div>}
                              {item.results.newsletter && <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 border-2 border-white dark:border-slate-900 shadow-sm"><MessageSquare size={12} /></div>}
                              {item.results.threads && <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white border-2 border-white dark:border-slate-900 shadow-sm"><ThreadsIcon size={12} /></div>}
                              {item.results.highlights && <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 border-2 border-white dark:border-slate-900 shadow-sm"><Sparkles size={12} /></div>}
                              {item.results.blog && <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 border-2 border-white dark:border-slate-900 shadow-sm"><FileText size={12} /></div>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteHistoryItem(item.id, e);
                              }}
                              className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-300"
                              title="Hapus Proyek"
                            >
                              <Trash2 size={18} />
                            </button>
                            <div className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-all duration-500">
                              <ArrowUpRight size={18} />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {filteredHistory.length > displayLimit && (
                  <div className="mt-12 flex justify-center">
                    <button 
                      onClick={() => setDisplayLimit(prev => prev + 5)}
                      className="px-10 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-[0.2em] hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-xl active:scale-95"
                    >
                      Muat Lebih Banyak
                    </button>
                  </div>
                )}
              </div>
            ) : searchQuery ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-24 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800"
              >
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-400">
                  <Search size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Hasil tidak ditemukan</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Tidak ada proyek yang sesuai dengan "{searchQuery}"</p>
                <button 
                  onClick={() => { setSearchQuery(""); setActiveFilter("all"); }}
                  className="mt-6 text-blue-600 font-bold hover:underline"
                >
                  Reset Pencarian
                </button>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="text-center py-40 bg-slate-50/50 dark:bg-slate-900/30 rounded-[4rem] border-2 border-dashed border-slate-200 dark:border-slate-800"
              >
                <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-10 shadow-xl">
                  <HistoryIcon size={48} className="text-slate-300" />
                </div>
                <h3 className="text-3xl font-extrabold text-slate-400 font-display">Belum Ada Proyek</h3>
                <p className="text-slate-500 max-w-xs mx-auto mt-4 font-sans text-lg">Mulai buat konten pertama Anda untuk melihat histori di sini.</p>
              </motion.div>
            )}
          </div>
        </section>
      </main>

      <Footer />
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
}

function ResultCard({ title, icon, content, onCopy, onPreview, index, color }: any) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
      className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/40 dark:border-slate-800/40 flex flex-col h-full shadow-xl shadow-blue-500/5 hover:shadow-blue-500/20 hover:border-blue-500/50 transition-all duration-700 overflow-hidden group"
    >
      <div className="p-6 border-b border-white/40 dark:border-slate-800/40 flex items-center justify-between bg-white/40 dark:bg-slate-900/40 group-hover:bg-white/60 dark:group-hover:bg-slate-800/60 transition-colors duration-500">
        <div className="flex items-center gap-4 font-black text-slate-900 dark:text-white">
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3", color)}>
            {icon}
          </div>
          <span className="text-lg tracking-tight">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onPreview}
            className="p-2.5 bg-white/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all duration-300 border border-slate-100 dark:border-slate-700"
            title="Lihat Preview"
          >
            <Eye size={18} />
          </button>
          <button 
            onClick={handleCopy}
            className={cn(
              "p-2.5 rounded-xl transition-all duration-300 active:scale-90 border shadow-md",
              copied 
                ? "bg-emerald-500 text-white border-emerald-400" 
                : "bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white"
            )}
          >
            {copied ? (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <Check size={18} />
              </motion.div>
            ) : (
              <Copy size={18} />
            )}
          </button>
        </div>
      </div>
      <div className="p-5 md:p-6 flex-1 whitespace-pre-wrap text-sm md:text-[15px] leading-relaxed text-slate-600 dark:text-slate-300 overflow-auto max-h-[400px] md:max-h-[500px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 font-sans font-medium">
        {content}
      </div>
    </motion.div>
  );
}
