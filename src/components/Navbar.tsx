'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Share2 className="text-blue-600" size={24} />
          <span className="text-xl font-bold tracking-tight">IndoRepurpose AI</span>
        </div>
      </div>
    </nav>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md transition-colors duration-300">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <div className="rounded-lg bg-blue-600 p-1.5 shadow-lg shadow-blue-500/20">
            <Share2 className="text-white" size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
            IndoRepurpose AI
          </span>
        </motion.div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400 mr-4">
            <a href="#how-it-works" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Cara Kerja</a>
            <a href="#history" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Riwayat</a>
          </div>
          
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all hover:scale-105 active:scale-95"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
