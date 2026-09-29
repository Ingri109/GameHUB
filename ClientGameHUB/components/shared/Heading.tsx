import React from 'react';

export function Heading({ eyebrow, title, children }: any) {
  return (
    <div className="mb-7 flex items-end justify-between">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-violet-300">{eyebrow}</p>
        <h1 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">{title}</h1>
      </div>
      {children}
    </div>
  )
}
