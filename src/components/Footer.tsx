import { Share2 } from 'lucide-react';
import { Twitter as TwitterIcon, Linkedin as LinkedinIcon, Github as GithubIcon } from '@/components/Icons';

export function Footer() {
  return (
    <footer className="relative z-10 backdrop-blur-md bg-white/10 dark:bg-slate-950/10 border-t border-slate-200/50 dark:border-slate-800/50 py-12 transition-colors duration-300">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-600 p-1.5 shadow-lg shadow-blue-500/20">
              <Share2 className="text-white" size={16} />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              IndoRepurpose AI
            </span>
          </div>
          
          <div className="text-sm text-slate-500 dark:text-slate-400">
            © 2026 IndoRepurpose AI. Made for Indonesian Creators.
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <a href="#" className="hover:text-blue-600 transition-colors"><TwitterIcon size={20} /></a>
            <a href="#" className="hover:text-blue-600 transition-colors"><LinkedinIcon size={20} /></a>
            <a href="#" className="hover:text-blue-600 transition-colors"><GithubIcon size={20} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
