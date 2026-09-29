import React from 'react';
import { TIER_LEVELS } from './constants';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function TierListPreview({ username, hideAddGames = false, initialTiers }: { username: string; hideAddGames?: boolean; initialTiers?: any[] }) {
  const displayTiers = initialTiers || [];

    return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <h2 className="section-title mb-0">Game Tier List</h2>
        <div className="flex gap-2">
          {!hideAddGames && (
          <Link href="/catalog">
            <Button variant="outline" size="sm">Add games</Button>
          </Link>
          )}
          <Link href={username ? `/profile/${username}/games` : '/catalog'}>
            <Button size="sm" className="bg-violet-600 hover:bg-violet-500 text-white">View all</Button>
          </Link>
        </div>
      </div>

      {displayTiers.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-700 rounded-xl p-6">
          <p>No games categorized yet.</p>
          {!hideAddGames && (
          <Link href="/catalog">
            <Button variant="outline" size="sm" className="mt-3">Start grading games!</Button>
          </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...displayTiers]
            .sort((a, b) => {
              const idxA = TIER_LEVELS.findIndex(t => t.id === a.tier);
              const idxB = TIER_LEVELS.findIndex(t => t.id === b.tier);
              return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
            })
            .slice(0, 4)
            .map(game => {
              const level = TIER_LEVELS.find(t => t.id === game.tier);
              return (
                <div key={game.gameId} className="flex flex-col">
                  <div className="relative group">
                    {game.coverUrl ? (
                      <img src={game.coverUrl} alt={game.title} className="aspect-[3/4] w-full object-cover rounded-md border border-slate-800" />
                    ) : (
                      <div className="aspect-[3/4] w-full bg-slate-800 rounded-md flex items-center justify-center text-xs text-center p-2 text-slate-400 border border-slate-700">
                        {game.title}
                      </div>
                    )}
                    
                    {level && (
                      <div className={`absolute bottom-2 left-2 right-2 text-[9px] font-semibold px-1.5 py-0.5 rounded-sm border text-center truncate shadow-sm backdrop-blur-md ${level.color}`}>
                        {level.label}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-slate-200 mt-2 truncate" title={game.title}>
                    {game.title}
                  </span>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}