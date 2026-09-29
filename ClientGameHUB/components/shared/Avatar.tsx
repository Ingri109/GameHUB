import React from 'react';
import { cn } from '@/lib/utils'; // Optional if they have it, else string concat

export function Avatar({ name, url, small = false, className = '' }: { name: string, url?: string, small?: boolean, className?: string }) {
  return (
    <div title={name} className={`${small ? 'size-7 text-[10px]' : 'size-10 text-xs'} grid shrink-0 place-items-center rounded-full border-2 border-slate-900 bg-gradient-to-br from-violet-400 to-indigo-600 font-bold text-white overflow-hidden ${className}`}>
      {url ? (
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : (
        name.slice(0, 2).toUpperCase()
      )}
    </div>
  )
}
