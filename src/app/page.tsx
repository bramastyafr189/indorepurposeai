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
import { Footer } from '@/components/Footer';
import { HistorySkeleton } from '@/components/HistorySkeleton';
import { toast } from 'sonner';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface HistoryItem {
  id: string;
  timestamp: number;
  input: string;
  mode: 'url' | 'text';
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

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    const res = await getHistory();
    if (res.success) {
      setHistory(res.data);
    }
    setHistoryLoading(false);
  };

  const handleProcess = async () => {
    if (!input) return;
    setLoading(true);
    setError('');
    setResults(null);

    const res = await processContent(input, mode);
    
    if (res.success) {
      setResults(res.data);
      toast.success('Konten berhasil diproses!');
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
        <section className="py-24 px-6 bg-white dark:bg-slate-950 transition-colors duration-500 relative">
          <div className="container mx-auto max-w-4xl">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl shadow-blue-500/5 border border-slate-100 dark:border-slate-800 p-8 md:p-16 relative overflow-hidden glow-blue"
            >
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] dark:opacity-[0.08] pointer-events-none">
                <Sparkles size={140} className="text-blue-600" />
              </div>

              <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 relative z-10">
                <div className="flex gap-2 p-2 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl w-fit">
                  <button
                    onClick={() => setMode('url')}
                    className={cn(
                      "flex items-center gap-2 px-8 py-3.5 rounded-xl transition-all font-black text-sm uppercase tracking-wider",
                      mode === 'url' 
                        ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xl shadow-blue-500/10" 
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    <YoutubeIcon size={18} />
                    <span>YouTube</span>
                  </button>
                  <button
                    onClick={() => setMode('text')}
                    className={cn(
                      "flex items-center gap-2 px-8 py-3.5 rounded-xl transition-all font-black text-sm uppercase tracking-wider",
                      mode === 'text' 
                        ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xl shadow-blue-500/10" 
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    <FileText size={18} />
                    <span>Teks</span>
                  </button>
                </div>
                
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] hidden md:block">
                  IndoRepurpose AI Core v2.5
                </p>
              </div>

              <div className="mb-12 relative z-10">
                {mode === 'url' ? (
                  <motion.div layout>
                    <input
                      type="text"
                      placeholder="Tempel link video YouTube Anda di sini..."
                      className="w-full px-8 py-7 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-xl placeholder:text-slate-400 font-sans shadow-inner"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                    />
                  </motion.div>
                ) : (
                  <motion.div layout>
                    <textarea
                      placeholder="Masukkan ide, artikel, atau draf konten Anda di sini..."
                      className="w-full px-8 py-7 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all min-h-[300px] text-xl placeholder:text-slate-400 font-sans shadow-inner leading-relaxed"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                    />
                  </motion.div>
                )}
              </div>

              <button
                onClick={handleProcess}
                disabled={loading || !input}
                className="group relative w-full overflow-hidden bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black py-7 rounded-[2rem] flex items-center justify-center gap-4 transition-all shadow-2xl shadow-blue-500/30 active:scale-[0.98] text-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    <span>Menganalisis Konten...</span>
                  </>
                ) : (
                  <>
                    <span>TRANSFORMASI KONTEN</span>
                    <ArrowUpRight size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </>
                )}
              </button>

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
        <div id="results">
          <AnimatePresence>
            {results && (
              <section className="py-32 px-6 bg-slate-50 dark:bg-slate-900/30 transition-colors duration-500">
                <div className="container mx-auto max-w-7xl">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center mb-24"
                  >
                    <div className="inline-block px-5 py-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 mb-8 font-black text-xs uppercase tracking-[0.3em]">
                      Transformation Complete
                    </div>
                    <h2 className="text-5xl md:text-6xl font-extrabold mb-8 font-display tracking-tight text-slate-900 dark:text-white">Konten Siap Publikasi</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-xl max-w-2xl mx-auto font-sans leading-relaxed">
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

        {/* Cloud History Section */}
        <section id="history" className="py-32 px-6 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 transition-colors duration-500">
          <div className="container mx-auto max-w-5xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center justify-between mb-20"
            >
              <div>
                <h2 className="text-5xl font-extrabold mb-4 font-display text-slate-900 dark:text-white">Arsip Proyek</h2>
                <p className="text-slate-500 dark:text-slate-400 text-xl font-sans font-medium">Riwayat transformasi Anda tersimpan aman di cloud.</p>
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
                className="grid gap-6"
              >
                {history.map((item) => (
                  <motion.div 
                    key={item.id}
                    variants={{
                      hidden: { opacity: 0, scale: 0.95 },
                      visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
                    }}
                    onClick={() => loadFromHistory(item)}
                    className="group relative bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-10 rounded-[2.5rem] hover:bg-white dark:hover:bg-slate-900 hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 cursor-pointer flex flex-col md:flex-row items-center justify-between gap-8"
                  >
                    <div className="flex items-center gap-8 w-full overflow-hidden">
                      <div className={cn(
                        "w-20 h-20 rounded-3xl flex items-center justify-center shrink-0 shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
                        item.mode === 'url' ? "bg-red-50 dark:bg-red-500/10 text-red-600" : "bg-blue-50 dark:bg-blue-500/10 text-blue-600"
                      )}>
                        {item.mode === 'url' ? <YoutubeIcon size={40} /> : <FileText size={40} />}
                      </div>
                      <div className="overflow-hidden w-full">
                        <p className="font-extrabold text-2xl text-slate-900 dark:text-white truncate font-display mb-3">
                          {item.input}
                        </p>
                        <div className="flex items-center gap-5">
                          <span className="text-[10px] font-black uppercase tracking-[0.25em] px-4 py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-sans shadow-sm">
                            {item.mode === 'url' ? 'YouTube' : 'Artikel'}
                          </span>
                          <span className="text-sm font-bold text-slate-400 font-sans">
                            {new Date(item.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
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
  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-2xl shadow-blue-500/5 hover:shadow-blue-500/10 hover:border-blue-500/30 transition-all duration-700 overflow-hidden group glow-blue"
    >
      <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 group-hover:bg-slate-50/30 dark:group-hover:bg-slate-800/30 transition-colors duration-500">
        <div className="flex items-center gap-5 font-extrabold text-slate-900 dark:text-white font-display">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-2">
            {icon}
          </div>
          <span className="text-2xl tracking-tight">{title}</span>
        </div>
        <button 
          onClick={onCopy}
          className="p-4.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white text-slate-400 border border-slate-100 dark:border-slate-700 shadow-md transition-all duration-300 active:scale-90"
        >
          <Copy size={24} />
        </button>
      </div>
      <div className="p-12 flex-1 whitespace-pre-wrap text-lg leading-[1.8] text-slate-600 dark:text-slate-300 overflow-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 font-sans font-medium">
        {content}
      </div>
    </motion.div>
  );
}
