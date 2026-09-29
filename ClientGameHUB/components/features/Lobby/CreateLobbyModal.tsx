import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { api, fetcher } from '@/lib/api';
import useSWR from 'swr';

interface CreateLobbyModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

interface IgdbGame {
  externalId: number;
  title: string;
  coverUrl: string | null;
}

interface UserFriend {
  id: string;
  username: string;
  displayName?: string;
}

export function CreateLobbyModal({ onClose, onSubmit }: CreateLobbyModalProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<IgdbGame | null>(null);
  const [lobbyName, setLobbyName] = useState('');
  const [playerLimit, setPlayerLimit] = useState(4);
  const [scheduledFor, setScheduledFor] = useState('');
  const [invitedFriends, setInvitedFriends] = useState<string[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 500);
    return () => clearTimeout(t);
  }, [query]);

  const { data: friendsData } = useSWR('/Friendship', fetcher);
  const friendsList = Array.isArray(friendsData) ? friendsData : (friendsData?.friends || friendsData?.items || []);

  const { data: searchResultsData, isLoading: loadingSearch } = useSWR(
    debouncedQuery ? `/Games/search?q=${encodeURIComponent(debouncedQuery)}` : null, 
    fetcher
  );
  const searchResults = searchResultsData || [];

  const toggleFriend = (fId: string) => {
    setInvitedFriends(prev => 
      prev.includes(fId) ? prev.filter(x => x !== fId) : [...prev, fId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGame) return;
    onSubmit({
      igdbGameId: selectedGame.externalId,
      gameTitle: selectedGame.title,
      gameCoverUrl: selectedGame.coverUrl,
      name: lobbyName,
      playerLimit,
      scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : null,
      invitedFriendIds: invitedFriends
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Create New Lobby</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Game Search</label>
            {!selectedGame ? (
              <div>
                <input
                  type="text"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none mb-2"
                  placeholder="Type to search IGDB..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
                {loadingSearch && <div className="text-xs text-slate-400">Searching...</div>}
                {searchResults.length > 0 && (
                  <div className="max-h-[50vh] overflow-y-auto bg-slate-800 border border-slate-700 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {searchResults.map(g => (
                      <div
                        key={g.externalId}
                        className="flex flex-col items-center gap-2 p-2 hover:bg-slate-700 hover:ring-2 hover:ring-violet-500 cursor-pointer rounded-xl transition"
                        onClick={() => setSelectedGame(g)}
                      >
                        {g.coverUrl ? (
                          <img src={g.coverUrl.replace('t_thumb', 't_cover_big')} alt={g.title} className="w-full aspect-[3/4] object-cover rounded-md shadow-md" />
                        ) : (
                          <div className="w-full aspect-[3/4] bg-slate-600 rounded-md shadow-md flex items-center justify-center text-xs text-slate-400">No Image</div>
                        )}
                        <span className="text-sm font-semibold text-slate-200 text-center line-clamp-2">{g.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between bg-slate-800 border border-violet-500/50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  {selectedGame.coverUrl ? (
                    <img src={selectedGame.coverUrl} alt={selectedGame.title} className="w-10 h-14 object-cover rounded" />
                  ) : (
                    <div className="w-10 h-14 bg-slate-600 rounded"></div>
                  )}
                  <span className="text-white font-medium">{selectedGame.title}</span>
                </div>
                <button type="button" onClick={() => setSelectedGame(null)} className="text-xs text-violet-400 hover:text-violet-300">
                  Change
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Lobby Name (Optional)</label>
            <input 
              type="text" 
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-violet-500 focus:border-violet-500 outline-none transition"
              placeholder="If empty: Game Title + Limit"
              value={lobbyName} 
              onChange={e => setLobbyName(e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Max Players</label>
              <input 
                type="number" 
                min="2" max="64" 
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                value={playerLimit} 
                onChange={e => setPlayerLimit(Number(e.target.value))} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Time (Optional)</label>
              <input 
                type="datetime-local" 
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-300 outline-none"
                value={scheduledFor} 
                onChange={e => setScheduledFor(e.target.value)} 
              />
            </div>
          </div>

          {friendsList.length > 0 && (
            <div className="pt-2 border-t border-slate-800">
              <label className="block text-sm font-medium text-slate-300 mb-2">Invite Friends</label>
              <div className="flex flex-wrap gap-2">
                {friendsList.map((f, i) => (
                  <button
                    key={`${f.id}-${i}`}
                    type="button"
                    onClick={() => toggleFriend(f.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      invitedFriends.includes(f.id) 
                        ? 'bg-violet-500 text-white' 
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    + {f.displayName || f.username}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!selectedGame} className="bg-violet-500 hover:bg-violet-400 text-white disabled:opacity-50">Create</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
