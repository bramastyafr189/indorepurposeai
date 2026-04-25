'use client';

import { motion } from 'framer-motion';
import { Link, Zap, Share2 } from 'lucide-react';

const steps = [
  {
    title: 'Input Konten',
    description: 'Tempel link video YouTube atau teks artikel panjang Anda ke dalam dashboard.',
    icon: Link,
    color: 'bg-blue-500',
  },
  {
    title: 'Proses AI Magic',
    description: 'AI kami menganalisis materi dan mengubahnya jadi 8 format berbeda secara instan.',
    icon: Zap,
    color: 'bg-amber-500',
  },
  {
    title: 'Siap Posting',
    description: 'Lihat pratinjau Live Mockup yang presisi dan publikasikan ke platform favorit Anda.',
    icon: Share2,
    color: 'bg-emerald-500',
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }
  }
};

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-32 relative z-10 backdrop-blur-md bg-white/10 dark:bg-slate-950/10 transition-colors duration-300">
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-20"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4 font-display">Cara Kerja Kami</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed font-sans">
            Hanya butuh 3 langkah praktis untuk menyulap satu video YouTube menjadi 8 format konten yang siap viral.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              animate={{ 
                y: [0, -5, 0],
              }}
              transition={{
                y: {
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.5
                }
              }}
              whileHover={{ 
                y: -12, 
                scale: 1.03,
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
              className="group bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500"
            >
              <div className={`w-12 h-12 ${step.color} rounded-xl flex items-center justify-center text-white mb-6 shadow-lg shadow-current/30 group-hover:scale-110 transition-transform duration-300`}>
                <step.icon size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 font-display">{step.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed font-sans">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
