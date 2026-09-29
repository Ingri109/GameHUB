import React from 'react';
import { games } from '@/lib/data';

export function Cover({ game, tall = false }: { game: typeof games[number], tall?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${game.color} ${tall ? 'h-64' : 'h-32'} flex items-end p-4`}>
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(135deg,transparent_40%,rgba(255,255,255,.35)_41%,transparent_42%),linear-gradient(45deg,transparent_55%,rgba(255,255,255,.2)_56%,transparent_57%)]" />
      <span className="relative font-black tracking-tighter text-white/90 text-4xl">{game.mark}</span>
      <span className="absolute right-3 top-3 text-[9px] font-bold uppercase tracking-[.2em] text-white/60">Friends Edition</span>
    </div>
  )
}
