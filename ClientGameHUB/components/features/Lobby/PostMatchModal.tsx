import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/shared/Avatar';
import { X } from 'lucide-react';
import { api } from '@/lib/api';

interface PostMatchModalProps {
  notification: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function PostMatchModal({ notification, onClose, onSuccess }: PostMatchModalProps) {
  const lobby = notification.lobby;
  const [assignments, setAssignments] = useState<Record<string, { type: string, text: string }>>({});
  
  const handleSetAward = (userId: string, type: string, text = '') => {
    setAssignments(prev => ({ ...prev, [userId]: { type, text } }));
  };

  const handleCustomBlur = (userId: string) => {
    const val = assignments[userId];
    if (val && val.type === 'custom' && val.text.trim() === '') {
      handleSetAward(userId, 'none', '');
    }
  };

  const handleConfirm = async () => {
    try {
      const awardsPayload = Object.entries(assignments)
        .filter(([_, val]) => val.type !== 'none')
        .map(([userId, val]) => ({
          receiverId: userId,
          awardTemplateId: val.type === 'custom' ? null : val.type, 
          customTitle: val.type === 'custom' ? val.text : null,
          note: null
        }));
        
      await api.post(`/Lobby/${lobby.id}/awards`, awardsPayload);
      onSuccess();
    } catch (e) {
      console.error(e);
      alert('Failed to submit reviews');
    }
  };

  const handleIgnore = async () => {
    try {
      await api.post(`/Lobby/${lobby.id}/awards/ignore`);
      onSuccess();
    } catch (e) {
      console.error(e);
      alert('Failed to ignore reviews');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 flex justify-center items-center p-4 backdrop-blur-md z-50 overflow-y-auto" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X size={24} />
        </button>
        
        <div className="p-6 md:p-8">
          <h2 className="text-2xl font-bold text-white mb-2">Rate your lobby members</h2>
          <p className="text-slate-400 mb-8">
            You recently played <strong>{lobby.gameName}</strong> in <strong>{lobby.name}</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {lobby.participants.map((p: any) => {
              const val = assignments[p.userId] || { type: 'none', text: '' };

              return (
                <div key={p.userId} className="relative rounded-xl bg-slate-800/80 border border-slate-700 overflow-hidden flex flex-col items-center">
                  {/* Top half gradient */}
                  <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-purple-400/30 to-purple-900/10 pointer-events-none" />
                  
                  <div className="pt-6 relative z-10">
                    <Avatar name={p.displayName || p.username} url={p.avatarUrl} className="w-16 h-16 border-4 border-slate-800" />
                  </div>
                  
                  <div className="text-white font-semibold mt-3 mb-4 z-10">{p.displayName || p.username}</div>
                  
                  <div className="w-full px-4 border-t border-slate-700 pt-4 pb-4 bg-slate-900/50 flex-1 flex flex-col justify-end">
                    {val.type === 'custom' ? (
                      <input 
                        type="text" 
                        maxLength={50}
                        autoFocus
                        value={val.text}
                        onChange={e => handleSetAward(p.userId, 'custom', e.target.value)}
                        onBlur={() => handleCustomBlur(p.userId)}
                        placeholder="Write a custom status..."
                        className="w-full bg-slate-950 text-sm text-white px-3 py-2 border border-violet-500 rounded-lg outline-none"
                      />
                    ) : (
                      <select 
                        value={val.type}
                        onChange={(e) => handleSetAward(p.userId, e.target.value)}
                        className="bg-slate-950 text-sm text-slate-200 border border-slate-700 rounded-lg p-2 focus:border-violet-500 outline-none w-full appearance-none"
                      >
                        <option value="none">No status</option>
                        {/* Use valid GUIDs for MVP testing */}
                        <option value="11111111-1111-1111-1111-111111111111">Match MVP</option>
                        <option value="22222222-2222-2222-2222-222222222222">Good Teammate</option>
                        <option value="custom">Custom (Свій варіант)</option>
                      </select>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex justify-between items-center border-t border-slate-800 pt-6">
            <Button variant="ghost" onClick={handleIgnore} className="text-slate-400 hover:text-slate-300">Exclude & Ignore</Button>
            <Button onClick={handleConfirm} className="bg-violet-500 hover:bg-violet-400 text-white shadow-lg">Confirm Setup</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
