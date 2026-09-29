import React from 'react';

export function ProfileSkeleton() {
  return (
    <>
      <div className="glass mb-6 flex flex-col gap-5 p-6 sm:flex-row sm:items-center relative animate-pulse">
        <div className="size-24 rounded-full bg-slate-800 shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-32 bg-slate-800 rounded" />
          <div className="h-8 w-48 bg-slate-800 rounded" />
          <div className="h-8 w-24 bg-slate-800 rounded mt-4" />
        </div>
        <div className="flex gap-8">
          <div className="space-y-2">
            <div className="h-8 w-16 bg-slate-800 rounded" />
            <div className="h-3 w-16 bg-slate-800 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-8 w-16 bg-slate-800 rounded" />
            <div className="h-3 w-16 bg-slate-800 rounded" />
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <div className="glass p-6 animate-pulse">
          <div className="h-6 w-32 bg-slate-800 rounded mb-6" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
                <div className="size-10 rounded-full bg-slate-800" />
                <div className="h-4 w-20 bg-slate-800 rounded" />
                <div className="h-3 w-12 bg-slate-800 rounded" />
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-6 flex flex-col animate-pulse">
          <div className="h-6 w-48 bg-slate-800 rounded mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((tier) => (
               <div key={tier} className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/80">
                 <div className="flex justify-between items-center mb-3">
                   <div className="h-5 w-24 bg-slate-800 rounded" />
                   <div className="h-5 w-16 bg-slate-800 rounded" />
                 </div>
                 <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                   <div className="aspect-[3/4] bg-slate-800 rounded-md" />
                   <div className="aspect-[3/4] bg-slate-800 rounded-md" />
                   <div className="aspect-[3/4] bg-slate-800 rounded-md hidden sm:block" />
                 </div>
               </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
