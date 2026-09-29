'use client';

import React, { useState, useEffect } from 'react';
import { api, fetcher } from '@/lib/api';
import useSWR from 'swr';
import { GameCard } from '@/components/features/TierList/GameCard';
import { Search, Loader2 } from 'lucide-react';
import { Heading } from '@/components/shared/Heading';
import { useAuthStore } from '@/store/authStore';

export default function CatalogPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const { isLoading, user } = useAuthStore();
  
  const tiersFetcher = (url: string) => api.get(url).then(res => res.data).catch(() => []);
  const { data: tiersData } = useSWR(user ? '/Games/my-tiers' : null, tiersFetcher);
  const myTiers = tiersData || [];

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 500);
    return () => clearTimeout(t);
  }, [query]);

  const { data: searchResultsData, isLoading: loadingSearch } = useSWR(
    debouncedQuery ? `/Games/search?q=${encodeURIComponent(debouncedQuery)}` : null,
    fetcher
  );
  const searchResults = searchResultsData || [];

  // Combine search results with known tier status
  const displayedGames = searchResults.map(game => {
    const existingTier = myTiers.find(t => (t.igdbId === game.externalId) || (t.igdbId === game.igdbId));
    return {
      ...game,
      tier: existingTier ? existingTier.tier : undefined,
      gameId: existingTier ? existingTier.gameId : undefined
    };
  });

  return (
    <>
      <Heading 
        eyebrow="Game Catalog" 
        title="Find & Add Games" 
      />

      <section className="mb-8 relative max-w-2xl text-slate-100">
        <div className="relative">
          <Search className="absolute z-10 left-4 top-1/2 -translate-y-1/2 text-violet-400 size-6 " />
          <input 
            type="text"
            placeholder="Search the IGDB database..."
            className="w-full bg-slate-900/50 backdrop-blur-sm border-2 border-slate-700/50 focus:border-violet-500 rounded-2xl py-4 pl-14 pr-16 text-lg text-white outline-none shadow-xl transition-all"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {loadingSearch && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 className="size-6 text-violet-400 animate-spin" />
            </div>
          )}
        </div>
        <p className="mt-3 text-sm text-slate-400 pl-2">Search globally to add games directly to your personal tier list.</p>
      </section>

      {query && !loadingSearch && displayedGames.length === 0 && (
        <div className="glass p-12 text-center flex flex-col items-center justify-center">
          <p className="text-xl text-slate-400 mb-2">No games found for "{query}"</p>
          <p className="text-sm text-slate-500">Try a different search term or check spelling.</p>
        </div>
      )}

      {!query && (
        <div className="glass p-12 text-center flex flex-col items-center justify-center border-dashed">
          <Search className="size-12 text-slate-600 mb-4" />
          <h2 className="text-xl font-semibold text-slate-300">Start typing to search games...</h2>
        </div>
      )}

      {displayedGames.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {displayedGames.map(g => (
            <GameCard key={g.externalId || g.igdbId} game={g} />
          ))}
        </div>
      )}
    </>
  );
}
