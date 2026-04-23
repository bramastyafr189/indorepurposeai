"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X as CloseIcon, Heart, MessageCircle, Share2, Repeat2, MoreHorizontal, Bookmark, Send, Eye, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Twitter, Linkedin, Instagram, Tiktok, Threads, Mail } from './Icons';
import { cn } from '@/lib/utils';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: string;
  content: string;
}

export const PreviewModal = ({ isOpen, onClose, platform, content }: PreviewModalProps) => {
  const [activeSlide, setActiveSlide] = React.useState(0);

  React.useEffect(() => {
    if (isOpen) {
      setActiveSlide(0);
    }
  }, [isOpen, platform]);

  if (!isOpen) return null;

  // Helper to parse structured content (Hook, Narasi, Visual, etc)
  const parseContent = (text: string) => {
    const parts: Record<string, any> = {};
    
    const mainLabels = [
      { key: 'hook', patterns: [/hook[:\s-]+/i, /viral\s+hook[:\s-]+/i] },
      { key: 'visual', patterns: [/ide\s+visual[:\s-]+/i, /visual[:\s-]+/i, /slide[:\s-]+/i, /ide\s+konten[:\s-]+/i] },
      { key: 'caption', patterns: [/caption[:\s-]+/i, /teks[:\s-]+/i] },
      { key: 'hashtags', patterns: [/hashtags?[:\s-]+/i, /tag[:\s-]+/i] },
      { key: 'narasi', patterns: [/narasi[:\s-]+/i, /skrip[:\s-]+/i, /script[:\s-]+/i, /body[:\s-]+/i] },
      { key: 'subjudul', patterns: [/subjudul[:\s-]+/i, /subject[:\s-]+/i, /judul[:\s-]+/i] },
      { key: 'cta', patterns: [/cta[:\s-]+/i, /ajakan[:\s-]+/i] }
    ];

    // Find the earliest position for each main label
    const labelPositions: Record<string, { start: number, end: number }> = {};
    
    mainLabels.forEach(ml => {
      ml.patterns.forEach(p => {
        const match = text.match(p);
        if (match && match.index !== undefined) {
          if (!labelPositions[ml.key] || match.index < labelPositions[ml.key].start) {
            labelPositions[ml.key] = {
              start: match.index,
              end: match.index + match[0].length
            };
          }
        }
      });
    });

    // Convert to array and sort by position
    const foundLabels = Object.entries(labelPositions)
      .map(([key, pos]) => ({ key, ...pos }))
      .sort((a, b) => a.start - b.start);

    // Extract content between labels
    if (foundLabels.length > 0) {
      foundLabels.forEach((label, index) => {
        const contentStart = label.end;
        const contentEnd = (index < foundLabels.length - 1) 
          ? foundLabels[index + 1].start 
          : text.length;
        
        parts[label.key] = text.slice(contentStart, contentEnd).trim();
      });
    } else {
      parts.body = text;
    }

    // Sub-parsing for Instagram slides
    if (parts.visual) {
      // Very aggressive splitter: looks for Slide/Visual followed by numbers anywhere
      const slideSplitter = /(?:slide|visual|ide|gambar|halaman)\s*\d+[:\s-]*/i;
      
      // Split and remove empty/too-short entries
      const slides = parts.visual.split(slideSplitter)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 5);
      
      if (slides.length > 1) {
        parts.slides = slides;
      } else {
        // Fallback: split by numbered list like 1. 2. 3.
        const numberedSplitter = /(?:\n|^)\d+[\.\)]\s*/;
        const numberedSlides = parts.visual.split(numberedSplitter)
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 5);
          
        if (numberedSlides.length > 1) {
          parts.slides = numberedSlides;
        }
      }
    }

    return parts;
  };

  const data = parseContent(content);
  const slides = data.slides || (data.visual ? [data.visual] : []);

  const renderMockup = () => {
    switch (platform.toLowerCase()) {
      case 'x':
      case 'postingan x':
        return (
          <div className="bg-black text-white p-4 rounded-2xl w-full max-w-md border border-white/10 font-sans shadow-2xl">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shrink-0 font-bold text-xs shadow-lg shadow-blue-500/20">AI</div>
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <span className="font-bold">IndoRepurpose AI</span>
                  <span className="text-slate-500 text-sm">@indorepurpose · 1m</span>
                  <MoreHorizontal className="ml-auto text-slate-500 w-4 h-4" />
                </div>
                <div className="mt-1 text-[15px] leading-normal whitespace-pre-wrap">
                  {content}
                </div>
                <div className="mt-4 flex justify-between text-slate-500 w-full max-w-[300px]">
                  <MessageCircle size={18} className="hover:text-blue-400 cursor-pointer transition-colors" />
                  <Repeat2 size={18} className="hover:text-green-400 cursor-pointer transition-colors" />
                  <Heart size={18} className="hover:text-red-400 cursor-pointer transition-colors" />
                  <Share2 size={18} className="hover:text-blue-400 cursor-pointer transition-colors" />
                </div>
              </div>
            </div>
          </div>
        );

      case 'linkedin':
      case 'postingan linkedin':
        return (
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4 rounded-xl w-full max-w-md shadow-lg border border-slate-200 dark:border-slate-800">
            <div className="flex gap-3 mb-3">
              <div className="w-12 h-12 rounded bg-blue-600 flex items-center justify-center shrink-0 shadow-md">
                 <Linkedin className="text-white" size={24} />
              </div>
              <div>
                <h4 className="font-bold text-sm">IndoRepurpose User</h4>
                <p className="text-xs text-slate-500">Content Strategist & Expert</p>
                <p className="text-[10px] text-slate-400">1m · 🌐</p>
              </div>
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap mb-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {content}
            </div>
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-around text-slate-500 font-semibold text-[10px] uppercase tracking-wider">
              <div className="flex items-center gap-1 hover:text-blue-600 cursor-pointer transition-colors"><Heart size={14} /> Like</div>
              <div className="flex items-center gap-1 hover:text-blue-600 cursor-pointer transition-colors"><MessageCircle size={14} /> Comment</div>
              <div className="flex items-center gap-1 hover:text-blue-600 cursor-pointer transition-colors"><Repeat2 size={14} /> Repost</div>
              <div className="flex items-center gap-1 hover:text-blue-600 cursor-pointer transition-colors"><Send size={14} /> Send</div>
            </div>
          </div>
        );

      case 'instagram':
      case 'instagram feed/reels':
        return (
          <div className="bg-white dark:bg-black text-slate-900 dark:text-white rounded-xl w-full max-w-md shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 mx-auto">
            <div className="p-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[1px]">
                <div className="w-full h-full rounded-full bg-white dark:bg-black p-[2px]">
                  <div className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
              <span className="font-bold text-xs">indorepurpose_user</span>
              <MoreHorizontal className="ml-auto w-4 h-4" />
            </div>
            
            {/* Carousel Area */}
            <div className="relative aspect-square bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden">
               <AnimatePresence mode="wait">
                  <motion.div 
                    key={activeSlide}
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    className="p-8 text-center w-full"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-600 mb-4">
                      {slides.length > 1 ? `Slide ${activeSlide + 1} / ${slides.length}` : 'Ide Visual'}
                    </p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed italic">
                      "{slides[activeSlide] || data.visual || 'Gunakan konten di bawah sebagai caption'}"
                    </p>
                  </motion.div>
               </AnimatePresence>

               {slides.length > 1 && (
                 <>
                   <button 
                    onClick={() => setActiveSlide((prev) => (prev > 0 ? prev - 1 : slides.length - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-md transition-all shadow-lg z-20"
                   >
                     <ChevronLeft size={20} />
                   </button>
                   <button 
                    onClick={() => setActiveSlide((prev) => (prev < slides.length - 1 ? prev + 1 : 0))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-md transition-all shadow-lg z-20"
                   >
                     <ChevronRight size={20} />
                   </button>
                   
                   <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {slides.map((_: any, i: number) => (
                        <div 
                          key={i} 
                          className={cn(
                            "w-1.5 h-1.5 rounded-full transition-all duration-300",
                            activeSlide === i ? "bg-blue-500 w-4" : "bg-white/40"
                          )} 
                        />
                      ))}
                   </div>
                 </>
               )}
            </div>

            <div className="p-3">
              <div className="flex gap-4 mb-2">
                <Heart size={22} className="hover:text-red-500 cursor-pointer" />
                <MessageCircle size={22} className="hover:text-slate-400 cursor-pointer" />
                <Send size={22} className="hover:text-slate-400 cursor-pointer" />
                <Bookmark className="ml-auto hover:text-slate-400 cursor-pointer" size={22} />
              </div>
              <div className="text-xs mb-1 font-bold">1,234 likes</div>
              <div className="text-sm max-h-[120px] overflow-y-auto custom-scrollbar pr-2">
                <span className="font-bold mr-2">indorepurpose_user</span>
                <span className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {data.hook && <span className="font-bold block mb-1">{data.hook}</span>}
                  {data.caption || data.body}
                  {data.hashtags && <span className="text-blue-600 dark:text-blue-400 block mt-2 text-xs font-bold">{data.hashtags}</span>}
                </span>
              </div>
            </div>
          </div>
        );

      case 'tiktok':
      case 'tiktok viral script':
        return (
          <div className="bg-black text-white rounded-[2.5rem] w-full max-w-[280px] aspect-[9/16] shadow-2xl relative overflow-hidden border-[6px] border-slate-800 mx-auto">
             <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 flex flex-col justify-end p-4">
                <div className="flex items-end gap-3 mb-6">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold mb-1 text-sm">@indorepurpose</h4>
                    <div className="text-[11px] leading-relaxed whitespace-pre-wrap mb-2">
                      {data.hook && <div className="bg-yellow-400 text-black px-2 py-0.5 rounded inline-block font-black uppercase text-[8px] mb-1">🔥 Hook</div>}
                      <p className="line-clamp-4">{data.hook || ''} {data.narasi || data.body || content}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                      <span className="text-[9px] truncate">Lagu Viral - IndoRepurpose AI</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4 items-center mb-2">
                    <div className="w-10 h-10 rounded-full bg-slate-400 border-2 border-white relative shrink-0">
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-pink-500 rounded-full w-4 h-4 flex items-center justify-center text-[10px] text-white">+</div>
                    </div>
                    <div className="flex flex-col items-center"><Heart fill="white" size={24} /> <span className="text-[10px] mt-1 font-bold">10.5K</span></div>
                    <div className="flex flex-col items-center"><MessageCircle fill="white" size={24} /> <span className="text-[10px] mt-1 font-bold">450</span></div>
                    <div className="flex flex-col items-center"><Bookmark fill="white" size={24} /> <span className="text-[10px] mt-1 font-bold">1.2K</span></div>
                    <div className="flex flex-col items-center"><Share2 fill="white" size={24} /> <span className="text-[10px] mt-1 font-bold">890</span></div>
                  </div>
                </div>
             </div>
             <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-4 text-xs font-bold opacity-70">
                <span>Following</span>
                <span className="border-b-2 border-white pb-1">For You</span>
             </div>
          </div>
        );

      case 'threads':
      case 'postingan threads':
        return (
          <div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white p-4 rounded-2xl w-full max-w-md shadow-lg border border-slate-100 dark:border-slate-900 font-sans">
            <div className="flex gap-3">
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="w-[2px] flex-1 bg-slate-100 dark:bg-slate-800" />
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-1 mb-1">
                  <span className="font-bold text-sm">anda.threads</span>
                  <span className="text-slate-400 text-xs ml-auto">1m</span>
                </div>
                <div className="text-[14px] leading-relaxed whitespace-pre-wrap">
                  {content}
                </div>
                <div className="mt-3 flex gap-4 text-slate-900 dark:text-white opacity-60">
                   <Heart size={18} />
                   <MessageCircle size={18} />
                   <Repeat2 size={18} />
                   <Send size={18} />
                </div>
              </div>
            </div>
          </div>
        );

      case 'newsletter':
        return (
          <div className="bg-white text-slate-800 rounded-lg w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 font-serif mx-auto">
            <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              </div>
              <div className="mx-auto text-[10px] text-slate-400 font-sans uppercase tracking-widest font-bold">Email Preview</div>
            </div>
            <div className="p-6">
              <div className="mb-6 pb-4 border-b border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase font-sans font-bold mb-1">Subject</p>
                <h2 className="text-lg font-bold leading-tight font-sans">
                  {data.subjudul || "Insight Baru Untuk Anda Pekan Ini 📩"}
                </h2>
              </div>
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                 <div className="whitespace-pre-wrap text-sm leading-loose text-slate-600">
                    {data.body || data.narasi || content}
                 </div>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                 <button className="bg-blue-600 text-white px-8 py-3 rounded-full font-sans text-xs font-bold shadow-lg shadow-blue-500/20">Baca Selengkapnya</button>
                 <p className="mt-4 text-[9px] text-slate-400 font-sans uppercase tracking-tighter">Anda menerima email ini karena berlangganan Newsletter IndoRepurpose AI</p>
              </div>
            </div>
          </div>
        );

      default:
        return <div className="p-8 text-center text-slate-500">Platform preview tidak tersedia.</div>;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative z-10 w-full max-w-lg flex flex-col items-center"
          >
            <button 
              onClick={onClose}
              className="absolute -top-12 right-0 md:-right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <CloseIcon size={28} />
            </button>

            <div className="bg-white dark:bg-slate-950 rounded-3xl w-full max-h-[85vh] overflow-y-auto p-6 md:p-10 flex flex-col items-center gap-10 custom-scrollbar border border-slate-200 dark:border-slate-800 shadow-2xl">
              <div className="w-full flex justify-center py-2">
                {renderMockup()}
              </div>
              
              <div className="max-w-md w-full bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 flex gap-4 items-start mb-4">
                 <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
                    <Sparkles size={18} />
                 </div>
                 <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                   <span className="font-bold text-slate-700 dark:text-slate-200 block mb-1 text-[13px]">💡 Tips Kreator:</span>
                   Pratinjau di atas hanyalah simulasi visual. Terkadang struktur teks dari AI bisa bervariasi, Anda tetap dapat menyesuaikan dan mengedit kembali konten ini sesuai kebutuhan sebelum benar-benar dipublikasikan ke platform pilihan Anda.
                 </p>
              </div>
            </div>

            <div className="mt-4 bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-6 py-2 text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              <Eye size={14} className="text-blue-400" />
              <span>Tampilan Mockup: </span>
              <span className="text-blue-400">{platform}</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
