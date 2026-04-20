'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Share2, LogOut, User, Zap, LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '../utils/supabase/client';
import { AuthModal } from './AuthModal';

const supabase = createClient();

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showMinusOne, setShowMinusOne] = useState(false);
  const [prevCredits, setPrevCredits] = useState<number | null>(null);

  useEffect(() => {
    if (profile?.credits !== undefined) {
      if (prevCredits !== null && profile.credits < prevCredits) {
        // Trigger animation
        setShowMinusOne(true);
        setTimeout(() => setShowMinusOne(false), 1000);
      }
      setPrevCredits(profile.credits);
    }
  }, [profile?.credits]);

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
      console.log('Menyiapkan Realtime untuk User:', user.id);
      profileSubscription = supabase
        .channel(`profile-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Data Realtime Diterima:', payload.new);
            setProfile(payload.new);
          }
        )
        .subscribe((status) => {
          console.log('Status Realtime:', status);
        });
    }

    // --- MANUAL REFRESH FALLBACK ---
    const handleManualRefresh = () => {
      console.log('Manual refresh triggered...');
      if (user?.id) fetchProfile(user.id);
    };

    window.addEventListener('credits-updated', handleManualRefresh);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('credits-updated', handleManualRefresh);
      if (profileSubscription) {
        console.log('Membersihkan Realtime...');
        supabase.removeChannel(profileSubscription);
      }
    };
  }, [user?.id]); // Pastikan efek berjalan ulang saat user.id tersedia

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) setProfile(data);
  };

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
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 relative">
                    <Zap size={14} className="fill-blue-600 dark:fill-blue-400" />
                    
                    <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1">
                      <motion.span
                        key={profile?.credits}
                        initial={{ scale: 1.5 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                        className="inline-block"
                      >
                        {profile?.credits ?? '...'}
                      </motion.span>
                      <span>Kredit</span>
                    </span>

                    {/* Floating -1 Animation */}
                    <AnimatePresence>
                      {showMinusOne && (
                        <motion.span
                          initial={{ opacity: 0, y: 0, scale: 0.5 }}
                          animate={{ opacity: 1, y: -20, scale: 1.2 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="absolute right-2 top-0 text-red-500 font-black text-sm z-50 pointer-events-none"
                        >
                          -1
                        </motion.span>
                      )}
                    </AnimatePresence>
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
