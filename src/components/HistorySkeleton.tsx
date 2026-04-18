'use client';

import { motion } from 'framer-motion';

export function HistorySkeleton() {
  return (
    <div className="grid gap-6">
      {[1, 2, 3].map((i) => (
        <div 
          key={i}
          className="bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-10 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 opacity-60"
        >
          <div className="flex items-center gap-8 w-full">
            {/* Icon Skeleton */}
            <div className="w-20 h-20 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
            
            <div className="w-full">
              {/* Title Skeleton */}
              <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse mb-4" />
              
              {/* Meta Skeleton */}
              <div className="flex items-center gap-5">
                <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
