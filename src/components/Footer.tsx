import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Share2, Mail, Globe, ArrowUpRight } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [status, setStatus] = useState<'checking' | 'normal' | 'error'>('checking');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const supabase = createClient();
        // Simple fast check to see if we can reach the backend
        const { error } = await supabase.from('history').select('id').limit(1);
        if (error && error.code !== 'PGRST116') { // PGRST116 is just "no rows found", which is fine
          throw error;
        }
        setStatus('normal');
      } catch (err) {
        console.error('Health check failed:', err);
        setStatus('error');
      }
    };

    checkHealth();
  }, []);

  return (
    <footer className="relative z-10 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 pt-24 pb-12 overflow-hidden transition-colors duration-500">
      {/* Mesh Gradient Accent */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[300px] bg-blue-500/5 dark:bg-blue-600/5 rounded-[100%] blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        
        {/* Footer CTA Section - Fills the top space */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative bg-blue-600 rounded-[3rem] p-8 md:p-16 overflow-hidden mb-24 shadow-2xl shadow-blue-500/20"
        >
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="text-center md:text-left">
              <h3 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight leading-tight">
                Siap Dominasi <br />Media Sosial?
              </h3>
              <p className="text-blue-100 text-lg font-medium max-w-md">
                Bergabunglah dengan para kreator Indonesia yang telah beralih ke strategi konten berbasis AI.
              </p>
            </div>
            <a 
              href="/#transform" 
              className="group px-10 py-5 bg-white text-blue-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl active:scale-95 flex items-center gap-3 shrink-0"
            >
              Mulai Sekarang <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </a>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start pb-20">
          
          {/* Brand Column - Left Side */}
          <div className="lg:col-span-5 flex flex-col items-start">
            <div className="flex items-center gap-3 mb-8 group cursor-pointer">
              <div className="rounded-2xl bg-blue-600 p-2 shadow-xl shadow-blue-500/20 group-hover:rotate-12 transition-transform duration-500">
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  className="text-white"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect 
                    x="8" 
                    y="8" 
                    width="12" 
                    height="12" 
                    rx="3" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeOpacity="0.4" 
                  />
                  <rect 
                    x="4" 
                    y="4" 
                    width="12" 
                    height="12" 
                    rx="3" 
                    fill="currentColor" 
                    fillOpacity="0.1"
                    stroke="currentColor" 
                    strokeWidth="2" 
                  />
                  <path 
                    d="M9 8.5L13 10L9 11.5V8.5Z" 
                    fill="currentColor" 
                  />
                </svg>
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-display">
                IndoRepurpose<span className="text-blue-600">AI</span>
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xl font-medium leading-relaxed mb-10 max-w-sm">
              Platform AI yang didedikasikan untuk merevolusi cara kreator Indonesia berkarya.
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-widest">
                <Globe size={14} className="text-blue-600" /> Berbasis di Indonesia
              </div>
            </div>
          </div>

          {/* Links Column - Right Side with detailed descriptions */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-12 lg:pl-12 lg:border-l border-slate-100 dark:border-slate-900">
            <div>
              <h4 className="text-slate-900 dark:text-white font-black uppercase tracking-[0.2em] text-[10px] mb-8">Solusi Utama</h4>
              <ul className="space-y-8">
                <li>
                  <a href="/#transform" className="group block">
                    <span className="text-slate-900 dark:text-white font-black text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
                      AI Transformator <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-all" />
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Ubah video YouTube menjadi puluhan konten teks.</span>
                  </a>
                </li>
                <li>
                  <a href="/#how-it-works" className="group block">
                    <span className="text-slate-900 dark:text-white font-black text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Cara Kerja</span>
                    <br />
                    <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Pelajari alur kerja cerdas AI kami yang revolusioner.</span>
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-slate-900 dark:text-white font-black uppercase tracking-[0.2em] text-[10px] mb-8">Ekosistem</h4>
              <ul className="space-y-8">
                <li>
                  <a href="/#pricing" className="group block">
                    <span className="text-slate-900 dark:text-white font-black text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Paket Harga</span>
                    <br />
                    <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Pilih paket yang sesuai dengan skala konten Anda.</span>
                  </a>
                </li>
                <li>
                  <a href="/#showcase" className="group block">
                    <span className="text-slate-900 dark:text-white font-black text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Simulasi AI</span>
                    <br />
                    <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Coba kehebatan AI kami secara gratis sekarang.</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-slate-100 dark:border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
            © {currentYear} IndoRepurpose AI.
          </p>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full animate-pulse",
              status === 'checking' ? "bg-amber-500" :
              status === 'normal' ? "bg-emerald-500" :
              "bg-red-500"
            )} />
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Sistem Status: {
                status === 'checking' ? 'Mengecek...' :
                status === 'normal' ? 'Normal' :
                'Gangguan Terdeteksi'
              }
            </span>
          </div>
        </div>
      </div>

    </footer>
  );
}
