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
    description: 'AI kami menganalisis materi dan mengubahnya jadi 3 format berbeda secara instan.',
    icon: Zap,
    color: 'bg-amber-500',
  },
  {
    title: 'Siap Posting',
    description: 'Salin hasilnya dan publikasikan ke X, WhatsApp, dan LinkedIn dalam sekejap.',
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
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-32 bg-slate-50 dark:bg-slate-900/40 transition-colors duration-300">
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 font-display">Cara Kerja Kami</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed font-sans">
            Hanya butuh 3 langkah sederhana untuk meningkatkan kehadiran digital Anda. Kami memproses data Anda dengan privasi tingkat tinggi.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto"
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -10 }}
              className="group bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-300"
            >
              <div className={`w-14 h-14 ${step.color} rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-current/30 group-hover:scale-110 transition-transform duration-300`}>
                <step.icon size={28} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 font-display">{step.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed font-sans">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
