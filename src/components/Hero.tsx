'use client';

import { motion } from 'framer-motion';
import { Sparkles, ArrowDown } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden py-32 px-6 lg:py-48">
      {/* Animated Mesh Gradient Background - Transparent to let Antigravity show through */}
      <div className="absolute inset-0 -z-20 transition-colors duration-700" />
      
      {/* Background sudah sepenuhnya di-handle oleh AntigravityEffect */}
      
      <div className="container mx-auto max-w-5xl text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex items-center gap-2 rounded-full border border-blue-200/50 bg-blue-50/30 dark:border-blue-900/40 dark:bg-blue-900/20 px-5 py-2 text-xs font-bold text-blue-700 dark:text-blue-400 mb-10 shadow-xl shadow-blue-500/10 backdrop-blur-xl"
          >
            <Sparkles size={16} className="animate-pulse" />
            <span className="tracking-wide">AI GENERATIVE 2026 TERBARU</span>
          </motion.div>
          
          <h1 className="mb-6 text-[2.75rem] sm:text-6xl md:text-7xl lg:text-[6.5rem] font-extrabold tracking-tighter text-slate-900 dark:text-white leading-[0.9] md:leading-[0.85] font-display break-words max-w-full mx-auto">
            Lipat Gandakan <br />
            <motion.span 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient"
            >
              Konten Anda
            </motion.span>
          </h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1.2 }}
            className="mx-auto mb-14 max-w-2xl text-base md:text-lg lg:text-xl text-slate-700 dark:text-slate-300 leading-relaxed font-sans font-medium px-4 md:px-0"
          >
            Platform AI all-in-one untuk kreator Indonesia. Ubah YouTube menjadi konten viral dalam sekejap.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col items-center gap-10"
          >
            <div className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-[0.4em]">
              <span className="h-px w-12 bg-gradient-to-r from-transparent to-slate-200 dark:to-slate-800" />
              Proudly Supporting Local Creators
              <span className="h-px w-12 bg-gradient-to-l from-transparent to-slate-200 dark:to-slate-800" />
            </div>
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 2, duration: 2, repeat: Infinity, repeatType: 'reverse' }}
          className="absolute bottom-[-100px] left-1/2 -translate-x-1/2"
        >
          <ArrowDown size={32} className="text-blue-500 animate-bounce" />
        </motion.div>
      </div>
    </section>
  );
}
