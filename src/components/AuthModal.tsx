'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, ArrowRight, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { createClient } from '../utils/supabase/client';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      
      setIsSent(true);
      toast.success('Link login telah dikirim ke email Anda!');
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengirim link login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100]"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[101] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-blue-500/10 border border-white/20 dark:border-slate-800 pointer-events-auto overflow-hidden relative"
            >
              {/* Decoration */}
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Sparkles size={80} className="text-blue-600" />
              </div>

              <div className="p-8 md:p-10">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <ShieldCheck className="text-white" size={24} />
                    </div>
                    <h2 className="text-2xl font-black font-display text-slate-900 dark:text-white uppercase tracking-tight italic">
                      Masuk <span className="text-blue-600">Terpurpos</span>
                    </h2>
                  </div>
                  <button 
                    onClick={onClose}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>

                {!isSent ? (
                  <>
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Selamat Datang Kembali!</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Kami akan mengirimkan magic link ke email Anda. Tidak perlu repot menghafal password.
                      </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                        <input
                          type="email"
                          placeholder="nama@email.com"
                          required
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-slate-900 dark:text-white"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 group transition-all shadow-xl shadow-blue-500/20 disabled:opacity-70 active:scale-95 translate-y-0 hover:-translate-y-1"
                      >
                        {loading ? (
                          <Loader2 className="animate-spin" size={20} />
                        ) : (
                          <>
                            <span>Kirim Link Login</span>
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
                      <p className="text-xs text-slate-400 font-medium">
                        Dengan masuk, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi kami.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="py-10 text-center">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Mail size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Cek Email Anda!</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">
                      Kami telah mengirimkan link login ke <strong>{email}</strong>. <br />
                      Silakan buka email dan klik link tersebut untuk masuk.
                    </p>
                    <button
                      onClick={() => setIsSent(false)}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Salah email? Coba lagi
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
