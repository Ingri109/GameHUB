'use client';

import React, { useState, useEffect, use } from 'react';
import { Check, Zap, Plus, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/shared/Heading';
import { Cover } from '@/components/shared/Cover';
import { Avatar } from '@/components/shared/Avatar';
import { PostMatchModal } from '@/components/features/Lobby/PostMatchModal';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { api, fetcher } from '@/lib/api';
import useSWR from 'swr';

export default function LobbyPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const lobbyId = resolvedParams.id;
  const { user } = useAuthStore();
  
  const { data: lobby, error: fetchError, isLoading: loading, mutate: mutateLobby } = useSWR(`/Lobby/${lobbyId}`, fetcher);
  const error = fetchError ? 'Lobby not found or you do not have access.' : null;
  
  const [showEndModal, setShowEndModal] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (lobby) {
      const meParticipant = lobby.participants?.find((p: any) => p.userId === user?.id);
      if (meParticipant?.status === 'JOINED') {
        setJoined(true);
      }
    }
  }, [lobby, user]);

  const handleJoinOrReady = async () => {
    const meParticipant = lobby?.participants?.find((p: any) => p.userId === user?.id);

    if (meParticipant?.status === 'INVITED') {
      try {
        await api.post(`/Lobby/${lobbyId}/accept`);
        setJoined(true);
        mutateLobby();
      } catch (err) {
        console.error("Failed to join.");
      }
    } else {
      // Just toggle ready local state
      setJoined(!joined);
    }
  };

  const handleEndLobby = async () => {
    if (lobby?.hostId === user?.id) {
       setShowEndModal(true);
    } else {
       console.error("Only the host can end the lobby.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (error || !lobby) {
    return (
      <div className="flex flex-col h-screen items-center justify-center gap-4">
        <AlertCircle className="size-12 text-amber-500" />
        <h2 className="text-xl font-bold">{error}</h2>
      </div>
    );
  }

  const isHost = lobby.hostId === user?.id;
  const maxPlayers = lobby.playerLimit || 4; // fallback if null
  const participants = lobby.participants || [];
  
  // Create an array of size maxPlayers to render slots
  const slots = Array.from({ length: maxPlayers }).map((_, i) => participants[i] || null);

  const joinedCount = participants.filter((p: any) => p.status === 'JOINED').length;

  return (
    <div>
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-slate-800">
        <Cover game={lobby.game} tall />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
        <div className="absolute bottom-6 left-6">
          <p className="text-xs uppercase tracking-[.2em] text-violet-300">
             {lobby.scheduledFor ? new Date(lobby.scheduledFor).toLocaleString() : 'Tonight'}
          </p>
          <h1 className="mt-2 text-4xl font-bold">{lobby.game?.title}</h1>
          <p className="mt-2 text-sm text-slate-300">
             Host: {participants.find((p: any) => p.userId === lobby.hostId)?.displayName || participants.find((p: any) => p.userId === lobby.hostId)?.username || 'Unknown'} · {lobby.name}
          </p>
        </div>
      </div>

      <Heading eyebrow="The crew" title={lobby.name}>
        <span className="tag flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-400" />
          {joinedCount} / {maxPlayers} ready
        </span>
      </Heading>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-6">
        {slots.map((p, i) => (
          <div className={`glass flex min-h-40 flex-col items-center justify-center gap-3 p-5 ${!p ? 'border-dashed' : ''}`} key={i}>
            {p ? (
              <>
                <Avatar name={p.displayName || p.username} url={p.avatarUrl} />
                <strong>{p.displayName || p.username}</strong>
                <span className={`text-xs ${p.status === 'JOINED' ? 'text-emerald-300' : 'text-slate-400'}`}>
                  {p.userId === lobby.hostId ? 'Host · ' : ''}
                  {p.status}
                </span>
              </>
            ) : (
              <>
                <div className="grid size-10 place-items-center rounded-full border border-dashed border-slate-600 text-slate-500 hover:text-slate-300 hover:border-slate-400 cursor-pointer transition">
                  <Plus className="size-4" />
                </div>
                <span className="text-sm text-slate-400">Open slot</span>
                {isHost && (
                  <Button size="sm" variant="outline" onClick={() => router.push(`/profile`)}>Invite</Button> // Or a proper invite modal
                )}
              </>
            )}
          </div>
        ))}
      </div>

      <div className="sticky bottom-4 z-20 mt-8 flex items-center justify-between gap-4 rounded-2xl border border-slate-700 bg-slate-900/90 p-3 pl-5 shadow-2xl backdrop-blur-xl">
        <p className="hidden text-sm text-slate-400 sm:block">
          Status: <strong className="text-white">{lobby.status}</strong>
        </p>
        <Button
          onClick={handleJoinOrReady}
          className={joined ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400' : 'bg-violet-400 text-slate-950 hover:bg-violet-300'}
        >
          {joined ? <Check data-icon="inline-start" /> : <Zap data-icon="inline-start" />}
          {joined ? 'You are ready' : 'I’m Ready'}
        </Button>
        {isHost && lobby.status !== 'COMPLETED' && (
          <Button variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10 ml-auto" onClick={handleEndLobby}>
            End Lobby
          </Button>
        )}
      </div>

      {showEndModal && (
        <PostMatchModal 
          lobby={lobby} 
          currentUser={user} 
          onClose={() => setShowEndModal(false)} 
          onAssignAwards={async (awards) => {
            try {
               await api.post(`/Lobby/${lobbyId}/end`);
               if (awards.length > 0) {
                 await api.post(`/Lobby/${lobbyId}/awards`, awards);
               }
               console.log("Lobby ended!");
               router.push('/profile');
            } catch (err) {
               console.error("Error ending lobby.");
            }
          }}
        />
      )}
    </div>
  );
}
