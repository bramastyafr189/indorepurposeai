'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Share2, LogOut, User, Zap, LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '../utils/supabase/client';
import { AuthModal } from './AuthModal';
import { cn } from '../lib/utils';

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [prevCredits, setPrevCredits] = useState<number | null>(null);
  const [showMinusOne, setShowMinusOne] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        setIsAuthModalOpen(false);
      } else {
        setProfile(null);
      }
    });

    // --- REALTIME REAL-TIME UPDATE ---
    let profileSubscription: any = null;
    
    if (user?.id) {
      profileSubscription = supabase
        .channel('any') // Gunakan channel general untuk memastikan receive
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            setProfile(payload.new);
          }
        )
        .subscribe();
    }

    // --- MANUAL SYNC SIGNAL ---
    const handleUpdateSignal = () => {
      if (user?.id) fetchProfile(user.id);
    };
    window.addEventListener('updateCredits', handleUpdateSignal);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('updateCredits', handleUpdateSignal);
      if (profileSubscription) {
        supabase.removeChannel(profileSubscription);
      }
    };
  }, [user?.id]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) {
      setProfile(data);
    }
  };

  // Handle detection of credit decrease for animation
  useEffect(() => {
    // Jika angka baru lebih kecil dari angka di memori (prevCredits)
    if (profile && prevCredits !== null && profile.credits !== null && profile.credits < prevCredits) {
      setShowMinusOne(true);
      setTimeout(() => setShowMinusOne(false), 1000);
    }
    
    // Perbarui memori (prevCredits) SETELAH pengecekan dilakukan
    if (profile && profile.credits !== null) {
      setPrevCredits(profile.credits);
    }
  }, [profile?.credits]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (!mounted) return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md font-sans">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Share2 className="text-blue-600" size={24} />
          <span className="text-xl font-bold tracking-tight">IndoRepurpose AI</span>
        </div>
      </div>
    </nav>
  );

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md transition-colors duration-300 font-sans">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="rounded-lg bg-blue-600 p-1.5 shadow-lg shadow-blue-500/20">
              <Share2 className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
              IndoRepurpose AI
            </span>
          </motion.div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400 mr-4">
            <a href="#how-it-works" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors underline-offset-8 hover:underline decoration-2">Cara Kerja</a>
            <a href="#pricing" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors underline-offset-8 hover:underline decoration-2">Harga</a>
            <a href="#history" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors underline-offset-8 hover:underline decoration-2">Riwayat</a>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all hover:scale-105 active:scale-95"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

            <AnimatePresence mode="wait">
              {user ? (
                <motion.div 
                  key="user-menu"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-3"
                >
                  {/* Credits Badge */}
                  <div className="relative">
                    <AnimatePresence>
                      {showMinusOne && (
                        <motion.span
                          initial={{ opacity: 0, y: 0, scale: 0.5 }}
                          animate={{ opacity: 1, y: -20, scale: 1.2 }}
                          exit={{ opacity: 0 }}
                          className="absolute -top-2 right-0 text-red-500 dark:text-red-400 font-black text-xs pointer-events-none"
                        >
                          -1
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <motion.div 
                      key={profile?.credits}
                      initial={showMinusOne ? { scale: 1 } : false}
                      animate={showMinusOne ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.4 }}
                      className={cn(
                        "hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors",
                        showMinusOne 
                          ? "bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 shadow-lg shadow-blue-500/20" 
                          : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800"
                      )}
                    >
                      <Zap size={14} className={cn("transition-colors", showMinusOne ? "fill-blue-700 dark:fill-blue-300" : "fill-blue-600 dark:fill-blue-400")} />
                      <span className="text-xs font-black uppercase tracking-wider">{profile?.credits ?? '...'} Kredit</span>
                    </motion.div>
                  </div>

                  {/* Profile Dropdown Simulation */}
                  <div className="flex items-center gap-2 pl-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-500/20 border-2 border-white dark:border-slate-800">
                      {user.email?.[0].toUpperCase()}
                    </div>
                    <button 
                      onClick={handleSignOut}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      title="Keluar"
                    >
                      <LogOut size={20} />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  key="login-btn"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <LogIn size={18} />
                  <span>Masuk</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
}
