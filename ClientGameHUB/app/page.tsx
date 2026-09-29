'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Users, Swords, Sparkles, Medal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/shared/Heading';
import { Cover } from '@/components/shared/Cover';
import { Avatar } from '@/components/shared/Avatar';
import { games, friends } from '@/lib/data';
import { api, fetcher } from '@/lib/api';
import useSWR from 'swr';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { CreateLobbyModal } from '@/components/features/Lobby/CreateLobbyModal';
import { EditLobbyModal } from '@/components/features/Lobby/EditLobbyModal';
import { PostMatchModal } from '@/components/features/Lobby/PostMatchModal';

export default function DashboardPage() {
  const [showCreateLobby, setShowCreateLobby] = useState(false);
  const [roulette, setRoulette] = useState('');
  const [copiedLobbyId, setCopiedLobbyId] = useState<string | null>(null);
  const [editingLobby, setEditingLobby] = useState<any>(null);

  const handleEditSubmit = async (id: string, data: any) => {
    try {
      await api.put(`/Lobby/${id}`, data);
      setEditingLobby(null);
      fetchLobbies();
    } catch (err) {
      console.error(err);
      alert('Failed to update lobby');
    }
  };
  const { user } = useAuthStore();

  const { data: activeLobbiesData, mutate: fetchLobbies } = useSWR('/Lobby/active', fetcher);
  const activeLobbies = activeLobbiesData || [];

  const displayName = user?.displayName || (user?.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : 'Friend');

  return (
    <>
      <Heading eyebrow="Friday · 20:41" title={`Good evening, ${displayName}.`}>
        <Link href="/matrix" >
          <Button variant="outline" size="sm">
            <Users data-icon="inline-start" /> Find a time
          </Button>
        </Link>
      </Heading>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="section-title mb-0">Active lobbies <span className="text-sm px-2 text-violet-400 font-normal">{activeLobbies.length}</span></h2>
            <Button size="sm" className="bg-violet-500 hover:bg-violet-400 text-white shadow-md shadow-violet-900/20" onClick={() => setShowCreateLobby(true)}>
              + Create Lobby
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {activeLobbies.length === 0 ? (
             <div className="col-span-3 text-slate-400 flex flex-col items-center justify-center p-8 glass text-center border-dashed">
                 <p>No active lobbies right now. Create one!</p>
             </div>
          ) : activeLobbies.map((lobby, i) => {
            const joinedCount = lobby.participants.filter(p => p.status === 'JOINED').length;
            const myStatus = lobby.participants.find(p => p.userId === user?.id)?.status;
            
            return (
            <article className="glass overflow-hidden flex flex-col group transition-all duration-300 hover:ring-1 hover:ring-violet-500/50" key={`${lobby.id}-${i}`}>
              {lobby.game?.coverUrl ? (
                <div className="aspect-[16/9] sm:aspect-[3/4] w-full overflow-hidden relative">
                  <img src={lobby.game.coverUrl.replace('t_thumb', 't_cover_big')} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={lobby.game.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-80"></div>
                </div>
              ) : (
                <div className="aspect-[16/9] sm:aspect-[3/4] w-full bg-slate-800 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-80"></div>
                  <span className="text-slate-500 font-bold tracking-widest uppercase">{lobby.game?.title || "Unknown Game"}</span>
                </div>
              )}
              <div className="flex flex-col gap-4 p-5 flex-1 bg-slate-900/90 relative">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold line-clamp-1 text-lg text-white group-hover:text-violet-300 transition-colors" title={lobby.name}>{lobby.name}</h3>
                    <p className="mt-1 text-xs font-medium text-slate-400 flex items-center gap-1">
                      {lobby.scheduledFor ? new Date(lobby.scheduledFor).toLocaleString([], { dateStyle: 'short', timeStyle: 'short'}) : 'Any time'}
                    </p>
                  </div>
                  {lobby.playerLimit && <span className="tag whitespace-nowrap bg-slate-800 border-slate-700 text-slate-300">{joinedCount}/{lobby.playerLimit}</span>}
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex -space-x-2">
                    {lobby.participants.filter(p => p.status === 'JOINED').slice(0, 4).map((p, idx) => (
                       <Avatar key={`${p.userId}-${idx}`} name={p.displayName || p.username} url={p.avatarUrl} small />
                    ))}
                    {joinedCount > 4 && (
                      <div className="grid size-7 place-items-center rounded-full border-2 border-slate-900 bg-slate-800 text-[10px] font-medium text-slate-300">
                        +{joinedCount - 4}
                      </div>
                    )}
                  </div>
                  {user?.id !== lobby.hostId && (
                    <Link href={`/lobby/${lobby.id}`} >
                      <Button size="sm" className="bg-white text-slate-900 hover:bg-violet-100 shadow-lg font-medium">
                        {myStatus === 'JOINED' ? 'Enter Space' : myStatus === 'INVITED' ? 'Accept Invite' : 'Join'}
                      </Button>
                    </Link>
                  )}
                </div>
                
                {lobby.hostId === user?.id && (
                  <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col gap-2">
                    <div className="relative w-full">
                      {copiedLobbyId === lobby.id && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-green-400 text-xs py-1 px-2 rounded font-medium shadow-xl border border-slate-700 whitespace-nowrap z-10 animate-in fade-in zoom-in duration-200">
                          Copied successfully!
                        </div>
                      )}
                      <Button size="sm" variant="outline" className="w-full text-xs font-medium border-slate-700 hover:bg-slate-800 text-slate-300 justify-center group-hover:border-violet-500/30" onClick={async () => { 
                        const link = `${window.location.origin}/lobbies/invite/${lobby.inviteToken}`;
                        await navigator.clipboard.writeText(link);
                        setCopiedLobbyId(lobby.id);
                        setTimeout(() => setCopiedLobbyId(null), 2000);
                      }}>Copy Invite Link</Button>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 text-xs border-slate-700 hover:bg-slate-800 text-slate-300" onClick={() => setEditingLobby(lobby)}>Edit</Button>
                      <Button size="sm" variant="outline" className="flex-1 text-xs border-red-900/50 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/50" onClick={() => { if (confirm('Are you sure you want to end this session (Закінчити сесію)?')) { api.post(`/Lobby/${lobby.id}/end`).then(() => fetchLobbies()); } }}>Закінчити сесію</Button>
                    </div>
                  </div>
                )}
              </div>
            </article>
          )})}
        </div>
      </section>
      
      {editingLobby && (
        <EditLobbyModal 
          lobby={editingLobby} 
          onClose={() => setEditingLobby(null)} 
          onSubmit={(data) => handleEditSubmit(editingLobby.id, data)} 
        />
      )}

      <section className="my-10 grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <div className="glass flex min-h-44 flex-col justify-between overflow-hidden p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[.18em] text-violet-300">The wild card</p>
              <h2 className="mt-2 text-2xl font-bold">Don&apos;t know what to play?</h2>
              <p className="mt-2 text-sm text-slate-400">Let the group&apos;s mood decide.</p>
            </div>
            <Swords className="size-10 text-violet-300/50" />
          </div>

          <Button onClick={() => setRoulette(games[Math.floor(Math.random() * games.length)].name)} className="mt-6 w-fit bg-violet-400 text-slate-950 hover:bg-violet-300">
            <Sparkles data-icon="inline-start" /> Spin Roulette
          </Button>

          {roulette && (
            <p className="mt-3 text-sm text-violet-200">Tonight&apos;s pick: <strong>{roulette}</strong></p>
          )}
        </div>

        <div className="glass p-6">
          <h2 className="section-title mb-5">Activity feed</h2>
          <div className="flex flex-col gap-4 text-sm">
            {['Orest just got the “Nerd” badge in Hearts of Iron IV', 'Mira opened a new Deep Rock lobby', 'Jules joined your gaming circle'].map((x, i) => (
              <div className="flex gap-3" key={x}>
                <div className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-800 text-violet-300">
                  <Medal className="size-4" />
                </div>
                <p className="leading-5 text-slate-300">
                  {x}
                  <span className="block text-xs text-slate-500">{i + 1}h ago</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {showCreateLobby && (
        <CreateLobbyModal 
          onClose={() => setShowCreateLobby(false)} 
          onSubmit={(data) => {
            api.post('/Lobby', data).then(() => {
                fetchLobbies();
                setShowCreateLobby(false);
            }).catch(err => {
                console.error(err);
                alert("Failed to create lobby");
            });
          }} 
        />
      )}
    </>
  );
}
