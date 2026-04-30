'use client';

import { motion } from 'framer-motion';
import { Link, Zap, Share2, Sparkles, Cpu, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  {
    title: 'Input Konten',
    description: 'Tempel link video YouTube atau teks artikel panjang Anda ke dalam dashboard pintar kami.',
    icon: Link,
    color: 'from-blue-500 to-indigo-600',
    iconColor: 'text-blue-500',
    stepNumber: '01'
  },
  {
    title: 'Proses AI Magic',
    description: 'AI kami melakukan dekonstruksi materi dan menyusunnya kembali menjadi 8 format viral secara instan.',
    icon: Cpu,
    color: 'from-purple-500 to-pink-600',
    iconColor: 'text-purple-500',
    stepNumber: '02'
  },
  {
    title: 'Siap Posting',
    description: 'Tinjau hasil transformasi dan publikasikan ke seluruh platform sosial media Anda dengan satu klik.',
    icon: Rocket,
    color: 'from-emerald-400 to-cyan-500',
    iconColor: 'text-emerald-500',
    stepNumber: '03'
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-40 relative z-10 overflow-hidden bg-transparent transition-colors duration-500">
      {/* Backdrop Blur Layer to make Antigravity particles faint */}
      <div className="absolute inset-0 backdrop-blur-[2px] pointer-events-none z-0" />

      {/* Mesh Gradient Background - Adaptive for Light & Dark with Smooth Transitions */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-200/30 dark:bg-blue-600/10 rounded-full blur-[180px] animate-pulse" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-purple-200/30 dark:bg-purple-600/10 rounded-full blur-[180px] animate-pulse delay-700" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-emerald-200/30 dark:bg-emerald-600/10 rounded-full blur-[180px] animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 shadow-sm text-blue-600 dark:text-blue-400 mb-6 font-black text-[10px] uppercase tracking-[0.3em] border border-blue-100 dark:border-blue-800"
          >
            <Sparkles size={14} /> Automated Workflow
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 font-display tracking-tight leading-tight"
          >
            Alur <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Kerja Cerdas</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg md:text-xl font-medium font-sans leading-relaxed"
          >
            Lihat bagaimana teknologi kami menyulap konten Anda menjadi aset digital yang siap mendominasi pasar dalam hitungan detik.
          </motion.p>
        </div>

        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-blue-100 via-purple-100 to-emerald-100 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-emerald-900/20 -translate-y-1/2 z-0" />

          <div className="grid lg:grid-cols-3 gap-10 md:gap-14 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.8 }}
                className="group relative"
              >
                {/* Subtle Card Glow */}
                <div className={cn(
                  "absolute inset-0 blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-700 -z-10 bg-gradient-to-br",
                  step.color
                )} />

                {/* Step Number Background */}
                <div className="absolute -top-12 -left-4 text-8xl md:text-9xl font-black text-slate-200 dark:text-slate-800/40 select-none font-display pointer-events-none group-hover:text-blue-500/10 transition-colors duration-500">
                  {step.stepNumber}
                </div>

                <div className="relative bg-white/60 dark:bg-slate-900/40 backdrop-blur-2xl p-8 md:p-10 rounded-[3rem] border border-white dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/30 dark:hover:border-blue-500/50 transition-all duration-500 h-full flex flex-col items-start overflow-hidden group-hover:bg-white/80 dark:group-hover:bg-slate-900/60">
                  
                  {/* Icon Container */}
                  <div className={cn(
                    "w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white mb-10 shadow-xl shadow-blue-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500",
                    step.color
                  )}>
                    <step.icon size={30} strokeWidth={2.5} />
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 font-display tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {step.title}
                  </h3>
                  
                  <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg leading-relaxed font-sans font-medium flex-1">
                    {step.description}
                  </p>

                  {/* Decorative Gradient Overlay */}
                  <div className={cn(
                    "absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-slate-100/50 dark:from-slate-800/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none",
                  )} />
                </div>

                {/* Progress Dot (Desktop) */}
                <div className="hidden lg:block absolute top-1/2 -right-7 w-4 h-4 bg-white dark:bg-slate-900 border-4 border-blue-500 rounded-full z-20 shadow-lg shadow-blue-500/20 -translate-y-1/2 last:hidden" />
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-24 text-center"
        >
          <a 
            href="#transform"
            className="inline-flex items-center gap-3 px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl hover:scale-105 transition-all shadow-2xl active:scale-95 group"
          >
            Mulai Transformasi Sekarang
            <Zap size={20} className="text-blue-500 fill-blue-500 group-hover:animate-bounce" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
