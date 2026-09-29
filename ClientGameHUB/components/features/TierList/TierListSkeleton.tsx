import React from 'react';
import { Heading } from '@/components/shared/Heading';

export function TierListSkeleton() {
  return (
    <>
      <div className="animate-pulse">
        <Heading
          eyebrow="Tier List"
          title="Loading Collection..."
        />
      </div>

      <div className="flex flex-col gap-8 mt-8">
        {[1, 2].map((group) => (
          <div key={group} className="bg-slate-800/30 rounded-2xl border border-slate-700 overflow-hidden shadow-sm animate-pulse">
            <div className="px-6 py-4 border-b flex items-center gap-3 bg-slate-800/50">
              <div className="size-3 rounded-full bg-slate-700" />
              <div className="h-6 w-32 bg-slate-700 rounded-md" />
              <div className="ml-auto w-10 h-6 bg-slate-700 rounded-full" />
            </div>
            
            <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {Array.from({ length: group === 1 ? 5 : 3 }).map((_, i) => (
                <div key={i} className="relative aspect-[3/4] w-full rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden">
                  <div className="absolute top-2 left-2 size-9 rounded-full bg-slate-700" />
                  <div className="absolute inset-0 bg-slate-800" />
                  <div className="absolute bottom-0 w-full p-4">
                    <div className="h-4 w-3/4 bg-slate-700 rounded-md mb-2" />
                    <div className="h-4 w-1/2 bg-slate-700 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
