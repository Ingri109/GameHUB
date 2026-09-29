import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface EditLobbyModalProps {
  lobby: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export function EditLobbyModal({ lobby, onClose, onSubmit }: EditLobbyModalProps) {
  const [scheduledFor, setScheduledFor] = useState(lobby.scheduledFor ? new Date(lobby.scheduledFor).toISOString().slice(0, 16) : '');
  const [playerLimit, setPlayerLimit] = useState(lobby.playerLimit || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : null,
      playerLimit: playerLimit ? parseInt(playerLimit, 10) : null
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 flex justify-center items-center p-4 backdrop-blur-md z-50 overflow-y-auto" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X size={24} />
        </button>
        
        <div className="p-6 md:p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Edit Lobby</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Lobby Name</label>
              <input type="text" value={lobby.name} disabled className="w-full bg-slate-950 text-slate-500 border border-slate-800 rounded-lg p-3 opacity-50 cursor-not-allowed" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Game</label>
              <input type="text" value={lobby.game?.title || "Unknown Game"} disabled className="w-full bg-slate-950 text-slate-500 border border-slate-800 rounded-lg p-3 opacity-50 cursor-not-allowed" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Scheduled Time (Optional)</label>
              <input type="datetime-local" value={scheduledFor} onChange={e => setScheduledFor(e.target.value)} className="w-full bg-slate-950 text-slate-200 border border-slate-700 rounded-lg p-3 outline-none focus:border-violet-500 transition-colors" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Player Limit (Optional)</label>
              <input type="number" min="1" max="99" value={playerLimit} onChange={e => setPlayerLimit(e.target.value)} className="w-full bg-slate-950 text-slate-200 border border-slate-700 rounded-lg p-3 outline-none focus:border-violet-500 transition-colors" />
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit" className="bg-violet-500 hover:bg-violet-400 text-white">Save Changes</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
