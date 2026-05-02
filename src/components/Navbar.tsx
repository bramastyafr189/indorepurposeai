'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Share2, LogOut, User, Zap, LogIn, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '../utils/supabase/client';
import { AuthModal } from './AuthModal';

const supabase = createClient();

export function Navbar() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [hoveredAvatar, setHoveredAvatar] = useState(false);
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
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsMobileMenuOpen(false);
    setIsLogoutConfirmOpen(false);
    setIsLoggingOut(false);
    router.push('/');
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

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    
    // Memberikan waktu agar menu menutup sepenuhnya sebelum melakukan scroll
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        // Mendapatkan posisi elemen relatif terhadap viewport
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetY = rect.top + scrollTop - 80; // 80px adalah perkiraan tinggi navbar

        window.scrollTo({
          top: targetY,
          behavior: 'smooth'
        });
      }
    }, 150); // Delay dikurangi menjadi 150ms agar lebih cepat
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md transition-colors duration-300 font-sans print:hidden">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 cursor-pointer group">
            <div className="rounded-2xl bg-blue-600 p-2 shadow-xl shadow-blue-500/20 group-hover:rotate-12 transition-transform duration-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="8" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="2" strokeOpacity="0.4" />
                <rect x="4" y="4" width="12" height="12" rx="3" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
                <path d="M9 8.5L13 10L9 11.5V8.5Z" fill="currentColor" />
              </svg>
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              IndoRepurpose<span className="text-blue-600">AI</span>
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

          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <AnimatePresence mode="wait">
                {user ? (
                  <motion.div 
                    key="user-menu"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center gap-3"
                  >
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

                    <div className="flex items-center gap-3 md:pl-2">
                      <div 
                        className="relative"
                        onMouseEnter={() => setHoveredAvatar(true)}
                        onMouseLeave={() => setHoveredAvatar(false)}
                      >
                        <Link 
                          href="/profile"
                          className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-500/20 border-2 border-white dark:border-slate-800 hover:scale-110 transition-transform cursor-pointer relative z-20"
                        >
                          {user.email?.[0].toUpperCase()}
                        </Link>
                        
                        <AnimatePresence>
                          {hoveredAvatar && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 10, x: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 10, x: 10 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                              className="hidden md:block absolute top-full right-0 mt-4 z-50 pointer-events-none"
                            >
                              <div className="relative bg-white/90 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-[1.5rem] p-4 shadow-2xl min-w-[200px]">
                                {/* Arrow */}
                                <div className="absolute -top-1.5 right-4 w-3 h-3 bg-white dark:bg-slate-900 rotate-45 border-l border-t border-slate-200 dark:border-slate-800" />
                                
                                <div className="relative">
                                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black">
                                      {user.email?.[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">User Profile</div>
                                      <div className="text-sm font-black text-slate-900 dark:text-white truncate">
                                        {user.email?.split('@')[0]}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-xl border border-blue-100/50 dark:border-blue-800/50">
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Paket</span>
                                      <span className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase">
                                        {profile?.plan_name || 'Free'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <button 
                        onClick={() => setIsLogoutConfirmOpen(true)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors hidden md:block"
                        title="Keluar"
                      >
                        <LogOut size={20} />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <button 
                    onClick={() => setIsAuthModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25 active:scale-95"
                  >
                    <LogIn size={18} />
                    <span className="hidden sm:inline">Masuk</span>
                  </button>
                )}
              </AnimatePresence>
              
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="hidden md:flex ml-4 h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all hover:scale-105 active:scale-95"
              >
                {mounted && (theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />)}
              </button>
            </div>

            <div className="md:hidden flex items-center gap-3">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 shadow-sm active:scale-95 transition-all"
              >
                {mounted && (theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />)}
              </button>
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="w-9 h-9 flex items-center justify-center text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm active:scale-95 transition-all"
              >
                <div className="w-5 flex flex-col gap-1.5">
                  <motion.span animate={{ rotate: isMobileMenuOpen ? 45 : 0, y: isMobileMenuOpen ? 8 : 0 }} className="h-0.5 w-full bg-current rounded-full" />
                  <motion.span animate={{ opacity: isMobileMenuOpen ? 0 : 1 }} className="h-0.5 w-full bg-current rounded-full" />
                  <motion.span animate={{ rotate: isMobileMenuOpen ? -45 : 0, y: isMobileMenuOpen ? -8 : 0 }} className="h-0.5 w-full bg-current rounded-full" />
                </div>
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl overflow-hidden"
            >
            <div className="container mx-auto py-6 px-6 flex flex-col gap-6">
              {user && (
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black">
                      {user.email?.[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
                        {user.email?.split('@')[0]}
                      </div>
                      <div className="text-xs text-slate-500 uppercase font-black tracking-widest">
                        Paket {profile?.plan_name || 'Free'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Credits Badge for Mobile */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                    <Zap size={14} className="fill-blue-600 dark:fill-blue-400" />
                    <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1">
                      <motion.span
                        key={profile?.credits}
                        initial={{ scale: 1.5 }}
                        animate={{ scale: 1 }}
                        className="inline-block"
                      >
                        {profile?.credits ?? '...'}
                      </motion.span>
                      <span>Kredit</span>
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-4">
                <a href="/#how-it-works" onClick={(e) => handleNav(e, 'how-it-works')} className="text-lg font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 py-2 border-b border-slate-100 dark:border-slate-900">Cara Kerja</a>
                <a href="/#showcase" onClick={(e) => handleNav(e, 'showcase')} className="text-lg font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 py-2 border-b border-slate-100 dark:border-slate-900">Simulasi</a>
                <a href="/#pricing" onClick={(e) => handleNav(e, 'pricing')} className="text-lg font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 py-2 border-b border-slate-100 dark:border-slate-900">Harga</a>
                <a href="/#history" onClick={(e) => handleNav(e, 'history')} className="text-lg font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 py-2 border-b border-slate-100 dark:border-slate-900">Riwayat</a>
                {user && (
                  <button onClick={() => setIsLogoutConfirmOpen(true)} className="flex items-center gap-2 text-red-500 font-bold py-2 mt-2">
                    <LogOut size={20} />
                    <span>Keluar</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </nav>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {isLogoutConfirmOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLogoutConfirmOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="p-8 text-center">
                <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg transition-transform bg-red-50 text-red-600 shadow-red-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-alert"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg>
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 font-display">Konfirmasi Keluar?</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">Apakah Anda yakin ingin keluar dari akun Anda? Sesi Anda akan berakhir dan Anda perlu masuk kembali nanti.</p>
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsLogoutConfirmOpen(false)}
                    className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                    className="flex-1 py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 shadow-red-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoggingOut ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check"><path d="M20 6 9 17l-5-5"></path></svg>
                    )}
                    Ya, Keluar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
