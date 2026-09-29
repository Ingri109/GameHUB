import React from 'react';

export function FriendListSkeleton({ count = 6, singleColumn = false }: { count?: number; singleColumn?: boolean }) {
  return (
    <div className={`grid gap-4 ${singleColumn ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 animate-pulse">
          <div className="flex flex-1 items-center gap-3 overflow-hidden">
            <div className="size-10 rounded-full bg-slate-800 shrink-0" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-slate-800 rounded" />
              <div className="h-3 w-20 bg-slate-800/80 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <div className={`h-8 rounded-lg bg-slate-800 ${singleColumn ? 'w-24' : 'w-8'}`} />
            <div className={`h-8 rounded-lg bg-slate-800 ${singleColumn ? 'w-24 hidden sm:block' : 'w-8'}`} />
          </div>
        </div>
      ))}
    </div>
  );
}