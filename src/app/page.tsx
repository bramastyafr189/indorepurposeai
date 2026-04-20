'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, MessageSquare, Copy, Check, Loader2, History as HistoryIcon, Trash2, ArrowUpRight, Sparkles } from 'lucide-react';
import { processContent, getHistory, deleteHistory } from './actions';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Youtube as YoutubeIcon, Twitter as TwitterIcon, Linkedin as LinkedinIcon } from '@/components/Icons';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { HowItWorks } from '@/components/HowItWorks';
import { Pricing } from '@/components/Pricing';
import { Footer } from '@/components/Footer';
import { HistorySkeleton } from '@/components/HistorySkeleton';
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
    whatsapp: string;
    linkedin: string;
  };
}

export default function Home() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'url' | 'text'>('url');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [results, setResults] = useState<{ x: string, whatsapp: string, linkedin: string } | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [tone, setTone] = useState<string>('professional');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    const res = await getHistory();
    if (res.success) {
      setHistory(res.data || []);
    }
    setHistoryLoading(false);
  };

  const handleProcess = async () => {
    if (!input) return;
    setLoading(true);
    setError('');
    setResults(null);

    const res = await processContent(input, mode, tone);
    
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
    const res = await deleteHistory(id);
    if (res.success) {
      setHistory(prev => prev.filter(item => item.id !== id));
      toast.info('Item dihapus dari histori');
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setInput(item.input);
    setMode(item.mode);
    setResults(item.results);
    window.scrollTo({ top: 500, behavior: 'smooth' });
    toast.info('Data dimuat dari histori');
  };

  const copyToClipboard = (text: string, title: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${title} disalin ke clipboard`, {
      description: "Anda siap untuk mempostingnya!",
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-500 font-sans">
      <Navbar />

      <main className="flex-1">
        <Hero />

        {/* Tool Section */}
        <section className="py-24 px-6 relative z-10 transition-colors duration-500">
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
                  IndoRepurpose AI Core v2.5
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
              <section className="py-32 px-6 transition-colors duration-500">
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
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <ResultCard 
                      index={0}
                      title="Postingan X" 
                      icon={<TwitterIcon className="text-sky-500" />} 
                      content={results.x} 
                      onCopy={() => copyToClipboard(results.x, "Postingan X")}
                    />
                    <ResultCard 
                      index={1}
                      title="Pesan WhatsApp" 
                      icon={<MessageSquare className="text-emerald-500" />} 
                      content={results.whatsapp} 
                      onCopy={() => copyToClipboard(results.whatsapp, "Pesan WhatsApp")}
                    />
                    <ResultCard 
                      index={2}
                      title="Artikel LinkedIn" 
                      icon={<LinkedinIcon className="text-blue-700" />} 
                      content={results.linkedin} 
                      onCopy={() => copyToClipboard(results.linkedin, "Postingan LinkedIn")}
                    />
                  </div>
                </div>
              </section>
            )}
          </AnimatePresence>
        </div>

        <HowItWorks />

        <Pricing />

        {/* Cloud History Section */}
        <section id="history" className="py-24 md:py-32 px-4 sm:px-6 relative z-10 border-t border-slate-100/50 dark:border-slate-800/50 transition-colors duration-500 w-full">
          <div className="container mx-auto max-w-5xl w-full">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center justify-between mb-12 md:mb-20"
            >
              <div>
                <h2 className="text-3xl md:text-4xl font-extrabold mb-3 font-display text-slate-900 dark:text-white">Arsip Proyek</h2>
                <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-sans font-medium">Riwayat transformasi Anda tersimpan aman di cloud.</p>
              </div>
            </motion.div>

            {historyLoading ? (
              <HistorySkeleton />
            ) : history.length > 0 ? (
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.1 } }
                }}
                className="grid gap-5 md:gap-6 w-full"
              >
                {history.map((item, index) => (
                  <motion.div 
                    key={item.id}
                    variants={{
                      hidden: { opacity: 0, scale: 0.95 },
                      visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } }
                    }}
                    animate={{ 
                      y: [0, -4, 0],
                    }}
                    transition={{
                      y: {
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.4
                      }
                    }}
                    whileHover={{ 
                      y: -10, 
                      scale: 1.02,
                      transition: { type: "spring", stiffness: 400, damping: 25 }
                    }}
                    onClick={() => loadFromHistory(item)}
                    className="group relative backdrop-blur-md hover:backdrop-blur-none bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] hover:bg-white dark:hover:bg-slate-900 hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500 cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 w-full max-w-full overflow-hidden"
                  >
                    <div className="flex items-center gap-4 md:gap-6 w-full">
                      <div className={cn(
                        "w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
                        item.mode === 'url' ? "bg-red-50 dark:bg-red-500/10 text-red-600" : "bg-blue-50 dark:bg-blue-500/10 text-blue-600"
                      )}>
                        {item.mode === 'url' ? <YoutubeIcon size={32} /> : <FileText size={32} />}
                      </div>
                      <div className="min-w-0 flex-1 group/text pb-1">
                        <p className="font-extrabold text-lg md:text-2xl text-slate-900 dark:text-white truncate font-display mb-1 md:mb-2 max-w-full">
                          {item.input}
                        </p>
                        <div className="flex items-center gap-3 w-fit">
                          <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.25em] px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl bg-slate-200/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-sans shadow-sm leading-none">
                            {item.mode === 'url' ? 'YouTube' : 'Artikel'}
                          </span>
                          <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.25em] px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-sans shadow-sm leading-none capitalize">
                            {item.tone}
                          </span>
                          <span className="text-xs md:text-sm font-bold text-slate-400 font-sans">
                            {new Date(item.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <button 
                        onClick={(e) => deleteHistoryItem(item.id, e)}
                        className="p-5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all duration-300"
                        title="Hapus Proyek"
                      >
                        <Trash2 size={26} />
                      </button>
                      <ArrowUpRight size={32} className="text-slate-200 group-hover:text-blue-600 group-hover:translate-x-2 group-hover:-translate-y-2 transition-all duration-500" />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="text-center py-40 bg-slate-50/50 dark:bg-slate-900/30 rounded-[4rem] border-2 border-dashed border-slate-200 dark:border-slate-800"
              >
                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner">
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
    </div>
  );
}

function ResultCard({ title, icon, content, onCopy, index }: any) {
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
      transition={{ delay: index * 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
      className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-2xl md:rounded-3xl border border-white/40 dark:border-slate-800/40 flex flex-col h-full shadow-xl shadow-blue-500/5 hover:shadow-blue-500/20 hover:border-blue-500/50 transition-all duration-700 overflow-hidden group glow-blue"
    >
      <div className="p-5 md:p-6 lg:p-8 border-b border-white/40 dark:border-slate-800/40 flex items-center justify-between bg-white/40 dark:bg-slate-900/40 group-hover:bg-white/60 dark:group-hover:bg-slate-800/60 transition-colors duration-500">
        <div className="flex items-center gap-3 md:gap-4 font-extrabold text-slate-900 dark:text-white font-display">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-2">
            {icon}
          </div>
          <span className="text-lg md:text-xl tracking-tight">{title}</span>
        </div>
        <button 
          onClick={handleCopy}
          className={cn(
            "p-3 rounded-xl transition-all duration-300 active:scale-90 border shadow-md",
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
              <Check size={20} />
            </motion.div>
          ) : (
            <Copy size={20} />
          )}
        </button>
      </div>
      <div className="p-6 md:p-8 lg:p-10 flex-1 whitespace-pre-wrap text-sm md:text-base leading-relaxed text-slate-600 dark:text-slate-300 overflow-auto max-h-[400px] md:max-h-[500px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 font-sans font-medium">
        {content}
      </div>
    </motion.div>
  );
}
