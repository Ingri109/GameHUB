'use client';

import React, { useState } from 'react';
import { GameCard } from '@/components/features/TierList/GameCard';
import { TIER_LEVELS } from '@/components/features/TierList/constants';
import { Heading } from '@/components/shared/Heading';
import { useAuthStore } from '@/store/authStore';

interface TierListClientViewProps {
  initialTiers: any[];
  username: string;
}

export function TierListClientView({ initialTiers, username }: TierListClientViewProps) {
  const { user } = useAuthStore();
  const [tiers, setTiers] = useState<any[]>(initialTiers);

  // Check if viewing own profile safely
  const isOwner = user?.username?.toLowerCase() === username?.toLowerCase();

  const handleTierChange = (game: any, newTier: string) => {
    // Optimistic update within the current page state to re-sort easily
    setTiers(prev => {
      const idx = prev.findIndex(t => t.igdbId === (game.externalId || game.igdbId));
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], tier: newTier };
        return next;
      }
      return prev;
    });
  };

  return (
    <>
      <Heading
        eyebrow="Tier List"
        title={`${isOwner ? 'Your' : username + "'s"} Game Collection`}
      />

      {tiers.length === 0 ? (
        <div className="glass p-12 mt-8 text-center flex flex-col items-center justify-center border-dashed">
             <p className="text-xl text-slate-400 mb-2">No games in this tier list yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8 mt-8">
          {TIER_LEVELS.map(level => {
            const levelGames = tiers.filter(t => t.tier === level.id);
            if (levelGames.length === 0) return null;

            return (
              <div key={level.id} className="bg-slate-800/30 rounded-2xl border border-slate-700 overflow-hidden shadow-sm">
                <div className={`px-6 py-4 text-lg font-bold border-b flex items-center gap-3 ${level.color}`}>
                  <div className={`size-3 rounded-full shadow-inner shadow-black/50 ${level.dot}`} />
                  <span>{level.label}</span>
                  <span className="text-sm opacity-80 font-normal ml-auto bg-black/20 px-3 py-1 rounded-full backdrop-blur-md">
                    {levelGames.length}
                  </span>
                </div>
                <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {levelGames.map(game => (
                    <GameCard
                      key={game.gameId}
                      game={game}
                      readOnly={!isOwner}
                      onTierChange={handleTierChange}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
