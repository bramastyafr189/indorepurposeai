'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Share2, LogOut, User, Zap, LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '../utils/supabase/client';
import { AuthModal } from './AuthModal';

const supabase = createClient();

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md transition-colors duration-300 font-sans print:hidden">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link 
            href="/"
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="rounded-lg bg-blue-600 p-1.5 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <Share2 className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
              IndoRepurpose AI
            </span>
          </Link>
 
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8 text-sm font-semibold tracking-wide text-slate-600 dark:text-slate-400 mr-4">
              <a href="/#how-it-works" className="hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 relative group">
                Cara Kerja
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 dark:bg-blue-400 transition-all duration-300 group-hover:w-full" />
              </a>
              <a href="/#showcase" className="hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 relative group">
                Simulasi
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 dark:bg-blue-400 transition-all duration-300 group-hover:w-full" />
              </a>
              <a href="/#pricing" className="hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 relative group">
                Harga
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 dark:bg-blue-400 transition-all duration-300 group-hover:w-full" />
              </a>
              <a href="/#history" className="hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 relative group">
                Riwayat
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 dark:bg-blue-400 transition-all duration-300 group-hover:w-full" />
              </a>
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

                  {/* Profile Link */}
                  <div className="flex items-center gap-2 pl-2">
                    <Link 
                      href="/profile"
                      className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-500/20 border-2 border-white dark:border-slate-800 hover:scale-110 transition-transform cursor-pointer"
                      title="Lihat Profil"
                    >
                      {user.email?.[0].toUpperCase()}
                    </Link>
                    <button 
                      onClick={handleSignOut}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors hidden md:block"
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
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-[10px] md:text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <LogIn size={18} />
                  <span>Masuk</span>
                </motion.button>
              )}
            </AnimatePresence>

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <div className="flex flex-col gap-1 w-5">
                <motion.span 
                  animate={{ rotate: isMobileMenuOpen ? 45 : 0, y: isMobileMenuOpen ? 6 : 0 }}
                  className="h-0.5 w-full bg-current rounded-full" 
                />
                <motion.span 
                  animate={{ opacity: isMobileMenuOpen ? 0 : 1 }}
                  className="h-0.5 w-full bg-current rounded-full" 
                />
                <motion.span 
                  animate={{ rotate: isMobileMenuOpen ? -45 : 0, y: isMobileMenuOpen ? -6 : 0 }}
                  className="h-0.5 w-full bg-current rounded-full" 
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl overflow-hidden"
            >
              <div className="container mx-auto py-6 px-6 flex flex-col gap-4">
                <a 
                  href="/#how-it-works" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-lg font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 py-2 border-b border-slate-100 dark:border-slate-900"
                >
                  Cara Kerja
                </a>
                <a 
                  href="/#showcase" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-lg font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 py-2 border-b border-slate-100 dark:border-slate-900"
                >
                  Simulasi
                </a>
                <a 
                  href="/#pricing" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-lg font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 py-2 border-b border-slate-100 dark:border-slate-900"
                >
                  Harga
                </a>
                <a 
                  href="/#history" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-lg font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 py-2 border-b border-slate-100 dark:border-slate-900"
                >
                  Riwayat
                </a>
                {user && (
                  <button 
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-red-500 font-bold py-2 mt-2"
                  >
                    <LogOut size={20} />
                    <span>Keluar</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
}
