'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles, Shield, HelpCircle, Zap, Star, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { getProfile } from '@/app/actions';

const plans = [
  { 
    name: 'Free', 
    price: '0', 
    description: 'Untuk mencoba keajaiban AI kami.',
    features: [
      '2 Kredit Gratis',
      'Akses Semua Format Konten',
      'Akses Semua Fitur AI',
      'Arsip Proyek Cloud',
      'Kredit Tetap Utuh Jika Terjadi Error',
    ],
    cta: 'Coba Gratis',
    highlight: false,
    icon: HelpCircle,
    color: 'slate',
    badge: 'Uji Coba'
  },
  { 
    name: 'Plus', 
    price: '15.000', 
    description: 'Cocok untuk kreator yang baru mulai.',
    features: [
      '10 Kredit / Bulan',
      'Akses Semua Format Konten',
      'Akses Semua Fitur AI',
      'Arsip Proyek Cloud',
      'Kredit Tetap Utuh Jika Terjadi Error',
      'Dukungan Pusat Bantuan',
    ],
    cta: 'Pilih Plus',
    highlight: false,
    icon: Zap,
    color: 'amber', 
    badge: 'Ekonomis'
  },
  { 
    name: 'Pro', 
    price: '50.000', 
    description: 'Pilihan terbaik untuk kreator aktif.',
    features: [
      '50 Kredit / Bulan',
      'Akses Semua Format Konten',
      'Akses Semua Fitur AI',
      'Arsip Proyek Cloud',
      'Kredit Tetap Utuh Jika Terjadi Error',
      'Dukungan Pusat Bantuan',
      'Lebih Hemat dari Plus',
    ],
    cta: 'Pilih Pro',
    highlight: true,
    icon: Sparkles,
    color: 'blue', 
    badge: 'Paling Populer'
  },
  { 
    name: 'Max', 
    price: '75.000', 
    description: 'Untuk kreator profesional & power user.',
    features: [
      '150 Kredit / Bulan',
      'Akses Semua Format Konten',
      'Akses Semua Fitur AI',
      'Arsip Proyek Cloud',
      'Kredit Tetap Utuh Jika Terjadi Error',
      'Dukungan Pusat Bantuan',
      'Lebih Hemat dari Pro',
    ],
    cta: 'Pilih Max',
    highlight: false,
    icon: Shield,
    color: 'indigo', 
    badge: 'Eksklusif'
  },
];

export function Pricing() {
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const handlePurchase = async (plan: any) => {
    if (plan.price === '0') {
      const transformSection = document.getElementById('transform');
      if (transformSection) {
        transformSection.scrollIntoView({ behavior: 'smooth' });
        toast.success('Silakan tempel link Anda di atas untuk mencoba gratis!');
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }
    
    if (!user) {
      toast.error('Silakan login terlebih dahulu untuk melakukan pembelian.');
      return;
    }

    const profileRes = await getProfile();
    if (profileRes.success && profileRes.data.pendingTransaction) {
      toast.error('Anda memiliki transaksi yang masih aktif. Mohon selesaikan atau batalkan terlebih dahulu di halaman profil.');
      router.push('/profile');
      return;
    }

    router.push(`/checkout/${plan.name}`);
  };

  return (
    <section id="pricing" className="py-8 md:py-12 relative overflow-hidden z-10 bg-transparent flex flex-col justify-center min-h-[calc(100vh-80px)] transition-colors duration-500">
      {/* Backdrop Blur Layer */}
      <div className="absolute inset-0 backdrop-blur-[2px] pointer-events-none z-0" />

      {/* Mesh Gradient Background - Intensified */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] z-0">
        <div className="absolute -top-[5%] -left-[5%] w-[60%] h-[60%] bg-blue-400/30 dark:bg-blue-500/20 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute top-[15%] -right-[5%] w-[50%] h-[50%] bg-purple-400/30 dark:bg-purple-500/20 rounded-full blur-[150px] animate-pulse delay-700" />
        <div className="absolute -bottom-[5%] left-[15%] w-[60%] h-[60%] bg-emerald-400/30 dark:bg-emerald-500/20 rounded-full blur-[150px] animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-6 md:mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4 border border-blue-100 dark:border-blue-800/50"
          >
            <Star size={12} className="fill-current" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Pricing Strategy</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-6xl font-black mb-4 tracking-tight text-slate-900 dark:text-white leading-[1.1] px-4"
          >
            Investasi Untuk <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Produktivitas Anda</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-slate-500 dark:text-slate-400 text-base md:text-xl max-w-2xl mx-auto font-medium font-sans leading-relaxed px-6"
          >
            Pilih paket yang sesuai dengan volume konten Anda dan mulai dominasi media sosial sekarang.
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-3 xl:gap-6 max-w-7xl mx-auto items-stretch px-6 md:px-4">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.5 }}
              whileHover={{ y: -5 }}
              className={cn(
                "relative p-6 md:p-7 rounded-[2.5rem] border transition-all duration-500 flex flex-col group h-full",
                plan.highlight 
                  ? "bg-white dark:bg-slate-900 border-blue-500/50 shadow-xl shadow-blue-500/20 z-20" 
                  : "bg-white/60 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 backdrop-blur-xl z-10"
              )}
            >
              {/* Badge */}
              <div className="flex justify-between items-start mb-4">
                <div className={cn(
                  "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                  plan.highlight 
                    ? "bg-blue-600 text-white border-blue-500" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                )}>
                  {plan.badge}
                </div>
                {plan.highlight && <Zap size={18} className="text-blue-500 fill-current" />}
              </div>

              {/* Icon & Name */}
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center shadow-md",
                  plan.color === 'blue' ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                )}>
                  <plan.icon size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{plan.name}</h3>
                  <p className="text-slate-400 text-[10px] font-bold mt-1">{plan.description}</p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black text-slate-400">Rp</span>
                  <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                    {plan.price}
                  </span>
                  <span className="text-slate-500 font-bold text-[10px]">/bln</span>
                </div>
              </div>

              {/* Features */}
              <div className="flex flex-col gap-2.5 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={12} className="text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
                    </div>
                    <span className="text-slate-600 dark:text-slate-300 text-[12px] font-bold leading-tight">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button 
                onClick={() => handlePurchase(plan)}
                className={cn(
                  "w-full py-3.5 rounded-[1.2rem] font-black text-xs uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2 group/btn",
                  plan.highlight 
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20" 
                    : "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                )}
              >
                <span>{plan.cta}</span>
                <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
