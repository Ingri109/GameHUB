import React from 'react';
import { Gamepad2 } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2 font-bold tracking-tight">
      <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-violet-400 to-indigo-500 text-slate-950">
        <Gamepad2 className="size-4" />
      </div>
      <span>the<span className="text-violet-300">hub</span></span>
    </div>
  )
}
