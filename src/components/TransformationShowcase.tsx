'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  FileText, 
  MessageSquare, 
  CheckCircle2,
  Zap,
  Copy,
  Eye,
  Share2
} from 'lucide-react';
import { 
  Youtube as YoutubeIcon, 
  Twitter as TwitterIcon, 
  Linkedin as LinkedinIcon, 
  Instagram as InstagramIcon,
  Tiktok as TiktokIcon,
  Threads as ThreadsIcon
} from '@/components/Icons';
import { cn } from '@/lib/utils';

const platforms = [
  { 
    id: 'x', 
    name: 'Postingan X', 
    icon: TwitterIcon, 
    color: 'bg-slate-100 dark:bg-slate-800', 
    textColor: 'text-slate-900 dark:text-white', 
    delay: 0.1,
    preview: '1/10 Kenapa video ini mengubah hidup saya... 🧵'
  },
  { 
    id: 'linkedin', 
    name: 'Postingan LinkedIn', 
    icon: LinkedinIcon, 
    color: 'bg-blue-50 dark:bg-blue-900/20', 
    textColor: 'text-blue-600', 
    delay: 0.15,
    preview: 'Insight hari ini: Strategi konten masa depan...'
  },
  { 
    id: 'instagram', 
    name: 'Caption Instagram', 
    icon: InstagramIcon, 
    color: 'bg-pink-50 dark:bg-pink-900/20', 
    textColor: 'text-pink-600', 
    delay: 0.2,
    preview: 'Caption: 3 Tips rahasia produktivitas 🚀 #tips #viral'
  },
  { 
    id: 'tiktok', 
    name: 'Script TikTok', 
    icon: TiktokIcon, 
    color: 'bg-slate-100 dark:bg-slate-800', 
    textColor: 'text-slate-900 dark:text-white', 
    delay: 0.25,
    preview: 'Hook: "Ternyata ini rahasia sukses..." \n[Visual: Cut to black]'
  },
  { 
    id: 'newsletter', 
    name: 'Ringkasan Newsletter', 
    icon: MessageSquare, 
    color: 'bg-amber-50 dark:bg-amber-900/20', 
    textColor: 'text-amber-600', 
    delay: 0.3,
    preview: 'Subject: Update eksklusif minggu ini untuk Anda!'
  },
  { 
    id: 'threads', 
    name: 'Postingan Threads', 
    icon: ThreadsIcon, 
    color: 'bg-slate-100 dark:bg-slate-800', 
    textColor: 'text-slate-900 dark:text-white', 
    delay: 0.35,
    preview: 'Pernah terpikir nggak sih kalau AI bisa sejauh ini? 🧵'
  },
  { 
    id: 'highlights', 
    name: 'Video Highlights', 
    icon: Sparkles, 
    color: 'bg-purple-50 dark:bg-purple-900/20', 
    textColor: 'text-purple-600', 
    delay: 0.4,
    preview: '[00:45 - 01:20] | Strategi Viral | Penjelasan mendalam...'
  },
  { 
    id: 'blog', 
    name: 'SEO Blog Post', 
    icon: FileText, 
    color: 'bg-indigo-50 dark:bg-indigo-900/20', 
    textColor: 'text-indigo-600', 
    delay: 0.45,
    preview: '<h2>Panduan Lengkap Transformasi Konten</h2><p>...</p>'
  },
];

const StatusText = () => {
  const [index, setIndex] = useState(0);
  const statuses = [
    "Menganalisis Video...",
    "Mengekstrak Insight...",
    "Optimasi Algoritma...",
    "Menyusun Format Viral...",
    "Finalisasi Konten..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % statuses.length);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.span
      key={index}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
    >
      {statuses[index]}
    </motion.span>
  );
};

export function TransformationShowcase() {
  const [status, setStatus] = useState<'idle' | 'typing' | 'processing' | 'done'>('idle');
  const [inputValue, setInputValue] = useState('');
  const fullLink = 'https://www.youtube.com/watch?v=xyz123';

  // Autoplay simulation on scroll or mount
  useEffect(() => {
    const timer = setTimeout(() => {
      startSimulation();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const startSimulation = async () => {
    if (status !== 'idle') return;
    
    // Step 1: Typing
    setStatus('typing');
    for (let i = 0; i <= fullLink.length; i++) {
      setInputValue(fullLink.slice(0, i));
      await new Promise(r => setTimeout(r, 50));
    }

    // Step 2: Processing
    await new Promise(r => setTimeout(r, 500));
    setStatus('processing');
    
    // Step 3: Done
    await new Promise(r => setTimeout(r, 3000));
    setStatus('done');

    // Step 4: Auto Loop (wait 15s then restart to save CPU)
    await new Promise(r => setTimeout(r, 15000));
    reset();
  };

  const reset = () => {
    setInputValue('');
    setStatus('idle');
    setTimeout(startSimulation, 800);
  };

  return (
    <section id="showcase" className="py-24 relative overflow-hidden z-10 bg-transparent">
      <div className="container mx-auto px-6">
        <div className="max-w-5xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
              Satu Link, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Ribuan Peluang</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">
              Lihat bagaimana AI kami bekerja secara instan mengekstraksi ide terbaik dari video Anda.
            </p>
          </div>

          {/* Showcase Dashboard */}
          <div className="relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2rem] md:rounded-[3rem] border border-white/60 dark:border-slate-800/60 shadow-2xl overflow-hidden min-h-[600px] md:min-h-[850px] flex flex-col">
            
            {/* Top Bar / Input Area */}
            <div className="p-6 md:p-12 border-b border-white/20 dark:border-slate-800/20">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-red-500">
                    <YoutubeIcon size={24} />
                  </div>
                  <input 
                    readOnly
                    value={inputValue}
                    placeholder="Tempel link video YouTube di sini..."
                    className="w-full h-16 pl-14 pr-6 rounded-2xl bg-white/50 dark:bg-slate-950/50 border border-white/50 dark:border-slate-800 outline-none text-slate-700 dark:text-slate-200 font-mono text-sm md:text-lg shadow-inner"
                  />
                  {status === 'typing' && (
                    <motion.div 
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                      className="absolute left-[calc(3.5rem+4px)] top-1/2 -translate-y-1/2 w-0.5 h-6 bg-blue-500"
                      style={{ left: `calc(3.5rem + ${inputValue.length * 10.8}px)` }}
                    />
                  )}
                </div>
                
                <button 
                  onClick={reset}
                  disabled={status === 'processing'}
                  className={cn(
                    "h-16 px-10 rounded-2xl font-black text-white transition-all flex items-center gap-3 shadow-xl active:scale-95 group overflow-hidden relative w-full md:w-auto",
                    status === 'done' ? "bg-emerald-500" : "bg-blue-600 hover:bg-blue-700"
                  )}
                >
                  {status === 'processing' ? (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    >
                      <Sparkles size={20} />
                    </motion.div>
                  ) : status === 'done' ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <Zap size={20} className="fill-current" />
                  )}
                  <span>{status === 'processing' ? 'Memproses...' : status === 'done' ? 'Selesai!' : 'Mulai Transformasi'}</span>
                </button>
              </div>
            </div>

            {/* Content Display Area */}
            <div className="flex-1 p-4 md:p-12 relative flex items-center justify-center">
              
              <AnimatePresence mode="wait">
                {status === 'idle' || status === 'typing' ? (
                  <motion.div 
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center"
                  >
                    <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-6 text-blue-500">
                      <YoutubeIcon size={48} />
                    </div>
                    <p className="text-slate-400 font-medium">Menunggu link input...</p>
                  </motion.div>
                ) : status === 'processing' ? (
                  <motion.div 
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative w-full max-w-2xl aspect-[21/9] md:aspect-video flex items-center justify-center overflow-hidden"
                  >
                    {/* Futuristic Background Elements */}
                    <div className="absolute inset-0 bg-slate-50/50 dark:bg-slate-950/50 rounded-[3rem] border border-white/20 dark:border-slate-800/50 backdrop-blur-sm" />
                    
                    {/* Intelligence Orb & Sonar Ripples */}
                    <div className="relative z-20 flex flex-col items-center">
                      <div className="relative mb-8">
                        {/* Ripples */}
                        {[1, 2, 3].map((i) => (
                          <motion.div
                            key={i}
                            initial={{ scale: 1, opacity: 0.5 }}
                            animate={{ scale: 2.5, opacity: 0 }}
                            transition={{ 
                              repeat: Infinity, 
                              duration: 3, 
                              delay: i * 1,
                              ease: "easeOut"
                            }}
                            className="absolute inset-0 rounded-full border border-blue-500/30"
                          />
                        ))}
                        
                        {/* Main Glowing Orb */}
                        <motion.div
                          animate={{ 
                            scale: [1, 1.1, 1],
                            boxShadow: [
                              "0 0 20px rgba(59, 130, 246, 0.2)",
                              "0 0 40px rgba(59, 130, 246, 0.5)",
                              "0 0 20px rgba(59, 130, 246, 0.2)"
                            ]
                          }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white relative z-10 shadow-2xl shadow-blue-500/50"
                        >
                          <Sparkles size={32} className="animate-pulse" />
                        </motion.div>
                      </div>

                      {/* Dynamic Processing Text */}
                      <div className="text-center h-12 flex flex-col items-center">
                        <h4 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                          AI Sedang Beraksi...
                        </h4>
                        <div className="mt-2 text-blue-600 dark:text-blue-400 font-mono text-xs md:text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                          <motion.span
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="w-2 h-2 rounded-full bg-current"
                          />
                          <StatusText />
                        </div>
                      </div>
                    </div>

                    {/* Orbital Particles */}
                    <div className="absolute inset-0 pointer-events-none">
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ 
                            rotate: 360,
                            scale: [0.8, 1.2, 0.8],
                          }}
                          transition={{ 
                            rotate: { repeat: Infinity, duration: 10 + i * 2, ease: "linear" },
                            scale: { repeat: Infinity, duration: 3 + i, ease: "easeInOut" }
                          }}
                          className="absolute top-1/2 left-1/2 w-full h-full"
                          style={{ width: `${150 + i * 40}px`, height: `${150 + i * 40}px`, marginLeft: `-${(150 + i * 40)/2}px`, marginTop: `-${(150 + i * 40)/2}px` }}
                        >
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-500/20 dark:bg-blue-400/20 blur-[1px]" />
                        </motion.div>
                      ))}
                    </div>

                    {/* Laser Scan Line */}
                    <motion.div 
                      initial={{ top: '-10%' }}
                      animate={{ top: '110%' }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                      className="absolute left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent z-30"
                    />
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full">
                    {platforms.map((p, idx) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: p.delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        whileHover={{ y: -5 }}
                        className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] border border-white/40 dark:border-slate-800/40 flex flex-col h-full shadow-xl shadow-blue-500/5 hover:shadow-blue-500/20 hover:border-blue-500/50 transition-all duration-700 overflow-hidden group"
                      >
                        {/* Card Header - Optimized for Showcase */}
                        <div className="p-4 border-b border-white/40 dark:border-slate-800/40 flex items-center justify-between bg-white/40 dark:bg-slate-900/40 group-hover:bg-white/60 dark:group-hover:bg-slate-800/60 transition-colors duration-500">
                          <div className="flex items-center gap-3 font-black text-slate-900 dark:text-white">
                            <div className={cn(
                              "w-9 h-9 rounded-xl flex items-center justify-center shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
                              p.color,
                              p.textColor
                            )}>
                              <p.icon size={18} />
                            </div>
                            <span className="text-xs md:text-sm tracking-tight">{p.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="p-1.5 bg-white/50 dark:bg-slate-800/50 text-slate-400 rounded-lg border border-slate-100 dark:border-slate-700">
                              <Eye size={12} />
                            </div>
                            <div className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                              <Copy size={12} />
                            </div>
                          </div>
                        </div>
                        
                        {/* Card Content - Optimized for Showcase */}
                        <div className="p-4 flex-1 whitespace-pre-wrap text-[11px] md:text-[12px] leading-relaxed text-slate-500 dark:text-slate-400 font-sans font-medium min-h-[100px]">
                          {p.preview}
                          <div className="mt-3 flex items-center gap-1.5 text-emerald-500 text-[9px] font-black uppercase tracking-widest">
                            <CheckCircle2 size={10} />
                            Ready
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
