import React from 'react';
import { Heading } from '@/components/shared/Heading';
import { Button } from '@/components/ui/button';
import { Settings2, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export function MatrixSkeleton() {
  return (
    <>
      <Heading eyebrow="Time Calendar" title="Find your overlap">
        <Button variant="outline" disabled>
          <Settings2 data-icon="inline-start" /> Manage schedule
        </Button>
      </Heading>

      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <aside className="glass p-5 flex flex-col h-full animate-pulse">
          <h2 className="section-title mb-5 h-5 w-24 bg-slate-800 rounded"></h2>
          
          <div className="relative mb-4">
            <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <div className="h-8 w-full rounded-md bg-slate-800" />
          </div>

          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-transparent p-2">
                <div className="size-8 rounded-full bg-slate-800 shrink-0" />
                <div className="h-4 w-24 bg-slate-800 rounded" />
              </div>
            ))}
          </div>

          <div className="mt-auto pt-10 text-xs text-slate-500 space-y-3">
             <div className="h-3 w-16 bg-slate-800 rounded" />
             <div className="h-3 w-24 bg-slate-800 rounded" />
             <div className="h-3 w-20 bg-slate-800 rounded" />
             <div className="h-3 w-28 bg-slate-800 rounded" />
          </div>
        </aside>

        <div className="glass overflow-auto p-3 flex flex-col animate-pulse">
          <div className="px-5 pt-3 pb-2 mb-2 flex items-center justify-between border-b border-slate-800/50">
            <div className="h-4 w-64 bg-slate-800 rounded" />
            <div className="flex items-center gap-2">
              <div className="h-4 w-20 bg-slate-800 rounded mr-2" />
              <div className="size-7 bg-slate-800 rounded" />
              <div className="size-7 bg-slate-800 rounded" />
            </div>
          </div>

          <div className="min-w-[650px] p-2 flex flex-col flex-1">
            <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-slate-800 pb-3 gap-2">
              <span />
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} className="h-4 w-12 mx-auto bg-slate-800 rounded" />
              ))}
            </div>

            <div className="flex-1 flex flex-col mt-2 gap-2">
              {[1, 2, 3, 4, 5].map(row => (
                <div className="grid grid-cols-[80px_repeat(7,1fr)] flex-1 min-h-[60px] gap-2" key={row}>
                  <div className="flex items-center justify-center py-3">
                    <div className="h-4 w-10 bg-slate-800 rounded" />
                  </div>
                  {[1, 2, 3, 4, 5, 6, 7].map(col => (
                    <div key={col} className="rounded-md border border-slate-800/80 bg-slate-900/40 m-1" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
