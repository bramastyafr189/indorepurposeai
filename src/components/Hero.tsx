'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Hero({ appType = 'repurpose' }: { appType?: 'repurpose' | 'devspec' }) {
  const direction = appType === 'devspec' ? 1 : -1;

  const variants = {
    initial: (dir: number) => ({
      x: dir * 1000,
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir * -1000,
      opacity: 0,
    }),
  };

  return (
    <section className="relative min-h-[70vh] flex flex-col items-center justify-start overflow-hidden pt-12 md:pt-20 pb-20 px-6 lg:pb-32">
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
            className={cn(
              "inline-flex items-center gap-2 px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.3em] mb-10 border transition-colors duration-500",
              appType === 'repurpose'
                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/50"
                : "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/50"
            )}
          >
            <Sparkles size={14} className="animate-pulse" />
            <span>AI GENERATIVE 2026 TERBARU</span>
          </motion.div>
          
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={appType}
              custom={direction}
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="mb-4 md:mb-6 text-4xl sm:text-6xl md:text-7xl lg:text-[6.5rem] font-extrabold tracking-tighter text-slate-900 dark:text-white leading-[1.1] md:leading-[0.85] font-display break-words max-w-full mx-auto px-2">
                {appType === 'repurpose' ? (
                  <>
                    Lipat Gandakan <br />
                    <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                      Konten Anda
                    </span>
                  </>
                ) : (
                  <>
                    Arsitektur <br />
                    <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                      Masa Depan
                    </span>
                  </>
                )}
              </h1>
              
              <p className="mx-auto mb-10 md:mb-14 max-w-2xl text-sm md:text-lg lg:text-xl text-slate-500 dark:text-slate-400 leading-relaxed font-sans px-4 md:px-0">
                {appType === 'repurpose' ? (
                  <>
                    Platform AI all-in-one untuk <span className="text-slate-900 dark:text-slate-200 font-semibold">kreator Indonesia</span>. 
                    Ubah YouTube atau artikel menjadi konten <span className="text-indigo-600 dark:text-indigo-400 font-bold">viral</span> untuk 
                    <span className="relative inline-block mx-1 text-slate-900 dark:text-slate-200 font-bold group">
                      8 format
                      <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-indigo-500/30 dark:bg-indigo-400/30" />
                    </span> 
                    sosial media dalam sekejap.
                  </>
                ) : (
                  <>
                    Platform AI <span className="text-slate-900 dark:text-slate-200 font-semibold">engineering cerdas</span>. 
                    Ubah referensi teknis atau ide mentah menjadi Dokumen <span className="text-indigo-600 dark:text-indigo-400 font-bold">Spesifikasi</span> (DevSpec) mendalam untuk memandu 
                    <span className="relative inline-block mx-1 text-slate-900 dark:text-slate-200 font-bold group">
                      AI Coder
                      <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-indigo-500/30 dark:bg-indigo-400/30" />
                    </span> 
                    Anda.
                  </>
                )}
              </p>

              <div className="flex flex-col items-center gap-10">
                <div className="flex items-center gap-3 md:gap-4 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.2em] md:tracking-[0.4em]">
                  <span className="h-px w-8 md:w-12 bg-gradient-to-r from-transparent to-slate-200 dark:to-slate-800" />
                  {appType === 'repurpose' ? 'Proudly Supporting Local Creators' : 'Empowering Local AI Engineers'}
                  <span className="h-px w-8 md:w-12 bg-gradient-to-l from-transparent to-slate-200 dark:to-slate-800" />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
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
