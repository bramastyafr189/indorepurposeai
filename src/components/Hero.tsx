'use client';

import { motion } from 'framer-motion';
import { Sparkles, ArrowDown } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden py-32 px-6 lg:py-48">
      {/* Animated Mesh Gradient Background */}
      <div className="absolute inset-0 -z-20 bg-white dark:bg-slate-950 transition-colors duration-700" />
      
      {/* Mesh blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-40 dark:opacity-20 transition-opacity duration-700">
        <motion.div 
          animate={{ 
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-400 blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            x: [0, -80, 0],
            y: [0, 100, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-indigo-400 blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[20%] left-[30%] w-[40%] h-[40%] rounded-full bg-sky-300 blur-[120px] opacity-50" 
        />
      </div>
      
      <div className="container mx-auto max-w-5xl text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-900/20 px-6 py-2.5 text-sm font-bold text-blue-600 dark:text-blue-400 mb-12 shadow-xl shadow-blue-500/10 backdrop-blur-md"
          >
            <Sparkles size={16} className="animate-pulse" />
            <span className="tracking-wide">AI GENERATIVE 2026 TERBARU</span>
          </motion.div>
          
          <h1 className="mb-10 text-6xl md:text-8xl lg:text-9xl font-extrabold tracking-tighter text-slate-900 dark:text-white leading-[0.9] font-display">
            Lipat Gandakan <br className="hidden md:block" />
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
            className="mx-auto mb-16 max-w-2xl text-xl md:text-2xl text-slate-600 dark:text-slate-400 leading-relaxed font-sans font-medium"
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
              Trusted by 500+ Creators
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
