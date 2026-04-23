'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles, Shield, HelpCircle, X, MessageSquare, Smartphone, Wallet } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { initiateCheckout, getProfile } from '@/app/actions';

const plans = [
  {
    name: 'Free',
    price: '0',
    description: 'Untuk mencoba keajaiban AI kami.',
    features: [
      '2 Kredit / Bulan',
      'Semua Platform Sosial',
      'Basic AI Engine',
      'Arsip Proyek Publik',
    ],
    cta: 'Mulai Gratis',
    highlight: false,
    icon: HelpCircle,
    color: 'slate',
  },
  {
    name: 'Pro',
    price: '299.000',
    description: 'Pilihan terbaik untuk kreator serius.',
    features: [
      'Kredit Tanpa Batas',
      'Live Content Preview ✨',
      'Dukungan Video YouTube',
      'Brand Voice Tuning ✨',
      'AI Engine Prioritas (Lebih Cepat)',
    ],
    cta: 'Pilih Paket Pro',
    highlight: true,
    icon: Sparkles,
    color: 'blue',
  },
  {
    name: 'Agency',
    price: '749.000',
    description: 'Sempurna untuk tim & agensi media.',
    features: [
      'Semua Fitur Pro',
      'Kelola Banyak Brand',
      'Akses API (Coming Soon)',
      'Dukungan Prioritas 24/7',
      'Kustomisasi Konten Lanjutan',
    ],
    cta: 'Hubungi Sales',
    highlight: false,
    icon: Shield,
    color: 'indigo',
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
      toast.info('Paket Free sudah aktif di akun Anda.');
      return;
    }
    
    if (!user) {
      toast.error('Silakan login terlebih dahulu untuk melakukan pembelian.');
      return;
    }

    // Check for pending transactions to prevent duplicates
    const profileRes = await getProfile();
    if (profileRes.success && profileRes.data.pendingTransaction) {
      toast.error('Anda memiliki transaksi yang masih aktif. Mohon selesaikan atau batalkan terlebih dahulu di halaman profil.');
      router.push('/profile');
      return;
    }

    // Delay checkout initiation until the final confirmation step
    router.push(`/checkout/${plan.name}`);
  };

  return (
    <section id="pricing" className="py-24 md:py-32 relative overflow-hidden z-10">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[120px] -z-10" />

      <div className="container mx-auto px-6">
        <div className="text-center mb-16 md:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 mb-6 font-black text-xs uppercase tracking-[0.3em]"
          >
            Pricing Plans
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 font-display tracking-tight text-slate-900 dark:text-white"
          >
            Investasi Untuk <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Produktivitas Anda</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 dark:text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-sans"
          >
            Pilih paket yang sesuai dengan volume konten Anda dan mulai dominasi media sosial sekarang.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -10 }}
              className={cn(
                "relative group p-8 rounded-[3rem] border transition-all duration-500 flex flex-col items-center text-center",
                plan.highlight 
                  ? "bg-white dark:bg-slate-900 border-blue-500/50 shadow-2xl shadow-blue-500/20 scale-105 z-20" 
                  : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 z-10"
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20">
                  Most Popular
                </div>
              )}

              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-lg",
                plan.color === 'blue' ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              )}>
                <plan.icon size={32} />
              </div>

              <h3 className="text-2xl font-black mb-2 font-display text-slate-900 dark:text-white uppercase tracking-wider">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-xl font-black text-slate-400 dark:text-slate-500 font-display">Rp</span>
                <span className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white font-display">{plan.price}</span>
                <span className="text-slate-500 font-bold text-xs">/bulan</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 font-medium">{plan.description}</p>

              <div className="w-full h-px bg-slate-100 dark:bg-slate-800 mb-8" />

              <div className="flex flex-col gap-4 w-full mb-10 text-left flex-1">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      <Check size={12} className="text-blue-600 dark:text-blue-400" strokeWidth={3} />
                    </div>
                    <span className="text-slate-600 dark:text-slate-300 text-sm font-bold font-sans">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <button className={cn(
                "w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300",
                plan.highlight 
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/30 active:scale-95" 
                  : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white active:scale-95"
              )}
              onClick={() => handlePurchase(plan)}
            >
              {plan.cta}
            </button>
            </motion.div>
          ))}
        </div>

        {/* FAQ Teaser */}
        <div className="mt-20 text-center">
          <p className="text-slate-500 dark:text-slate-500 text-sm font-bold uppercase tracking-widest">
            Butuh paket kustom? <a href="#" className="text-blue-600 hover:underline">Hubungi kami melalui email.</a>
          </p>
        </div>
      </div>
    </section>
  );
}
