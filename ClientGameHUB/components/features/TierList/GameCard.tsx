'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TIER_LEVELS } from './constants';
import { Plus, ListPlus, Loader2, Check } from 'lucide-react';
import { api } from '@/lib/api';

interface GameCardProps {
  game: {
    gameId?: string;
    externalId?: number;
    igdbId?: number;
    title: string;
    coverUrl: string | null;
    tier?: string;
  };
  readOnly?: boolean;
  onTierChange?: (game: any, newTier: string) => void;
}

export function GameCard({ game, readOnly = false, onTierChange }: GameCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [optimisticTier, setOptimisticTier] = useState<string | undefined>(game.tier);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync state if prop changes
  useEffect(() => {
    setOptimisticTier(game.tier);
  }, [game.tier]);

  const currentTierData = TIER_LEVELS.find((t) => t.id === optimisticTier);

  const toggleMenu = () => {
    if (readOnly || isCooldown) {
      if (isCooldown && !toastMessage) {
        showToast('Очікування між запитами 5 секунд, будь ласка зачекайте.');
      }
      return;
    }
    setIsOpen(!isOpen);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleSelectTier = async (tierId: string) => {
    if (readOnly || isCooldown) return;

    if (tierId === optimisticTier) {
      setIsOpen(false);
      return;
    }

    setIsOpen(false);
    setOptimisticTier(tierId);
    setIsCooldown(true);

    try {
      await api.post('/Games/tier', {
        gameId: game.gameId,
        igdbId: game.externalId || game.igdbId,
        title: game.title,
        coverUrl: game.coverUrl,
        tier: tierId
      });
      if (onTierChange) {
        onTierChange(game, tierId);
      }
    } catch (err) {
      console.error(err);
      // Revert optimism on error
      setOptimisticTier(game.tier);
    } finally {
      setTimeout(() => {
        setIsCooldown(false);
      }, 5000);
    }
  };

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative group rounded-2xl bg-slate-800 border border-slate-700 shadow-xl transition-all duration-300 hover:border-slate-500 hover:shadow-2xl ${isOpen ? 'z-50' : 'z-10'}`}>
      {/* Toast */}
      {toastMessage && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-violet-500 text-white text-xs py-1.5 px-3 rounded-full shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* Action Button */}
      {!readOnly && (
        <div className="absolute top-2 left-2 z-20" ref={menuRef}>
          <button
            onClick={toggleMenu}
            disabled={isCooldown && !isOpen}
            className={`flex items-center justify-center size-9 rounded-full shadow-lg transition-transform duration-200 border-2 ${
              currentTierData
                ? `${currentTierData.color} shadow-black/50`
                : 'bg-slate-900/80 border-slate-500 text-slate-200 backdrop-blur-md hover:bg-slate-800'
            } ${isOpen ? 'scale-110' : 'hover:scale-110'} ${isCooldown && !isOpen ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={currentTierData ? currentTierData.label : 'Add to Tier List'}
          >
            {isCooldown && !isOpen ? (
              <Loader2 className="size-4 animate-spin" />
            ) : currentTierData ? (
              <Check className="size-4" />
            ) : (
              <Plus className="size-5" />
            )}
          </button>

          {/* Desktop Radial/Dropdown Menu */}
          {isOpen && (
            <div className="hidden md:flex absolute top-12 left-0 z-[100] flex-col gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl animate-in zoom-in-95 origin-top-left w-56 max-h-56 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-600/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-slate-500/50">
              {TIER_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => handleSelectTier(level.id)}
                  className={`flex shrink-0 items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:scale-[1.02] active:scale-100 text-slate-100 bg-slate-800/80 border-l-4 ${level.border} ${level.hover} ${optimisticTier === level.id ? 'bg-slate-700/90 shadow-inner' : ''}`}
                >
                  <div className={`size-3 rounded-full shadow-sm ${level.dot}`} />
                  {level.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mobile Bottom Sheet/Modal */}
      {isOpen && isMounted && document.body && createPortal(
        <div className="md:hidden fixed inset-0 z-[9999] flex flex-col justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsOpen(false)}>
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] p-5 pb-8 w-full animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-slate-700/50 rounded-full mx-auto mb-6" />
            <h3 className="text-xl font-bold text-center mb-6 text-slate-200">Select Tier</h3>
            <div className="flex flex-col gap-2.5 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
              {TIER_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => handleSelectTier(level.id)}
                  className={`flex shrink-0 items-center gap-4 px-5 py-4 rounded-xl text-base font-bold transition-transform active:scale-95 text-slate-100 bg-slate-800/80 border-l-4 ${level.border} ${level.hover} ${optimisticTier === level.id ? 'bg-slate-700/90 shadow-inner' : ''}`}
                >
                  <div className={`size-4 rounded-full shadow-md ${level.dot}`} />
                  {level.label}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="mt-6 w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Decorative tag for ReadOnly mode */}
      {readOnly && currentTierData && (
        <div className={`absolute top-2 left-2 z-20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border shadow-lg ${currentTierData.color}`}>
          {currentTierData.label}
        </div>
      )}

      {/* Image */}
      <div className="relative aspect-[3/4] w-full bg-slate-900 overflow-hidden rounded-2xl">
        {game.coverUrl ? (
          <img
            src={game.coverUrl}
            alt={game.title}
            className={`w-full h-full object-cover transition-transform duration-500 ${!isOpen ? 'group-hover:scale-110' : ''}`}
          />
        ) : (
          <div className="flex w-full h-full items-center justify-center text-slate-500 font-medium p-4 text-center">
            {game.title}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent opacity-80" />
      </div>

      {/* Content */}
      <div className="absolute bottom-0 w-full p-4 p-x-4">
        <h3 className="font-semibold text-sm sm:text-base text-white leading-tight line-clamp-2 drop-shadow-md">
          {game.title}
        </h3>
      </div>
    </div>
  );
}
