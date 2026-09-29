'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'full'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) return;

    api.post(`/Lobby/join/${token}`)
      .then(res => {
        // Success
        setStatus('success');
        const lobbyId = res.data.lobbyId;
        setTimeout(() => {
          router.push(`/lobby/${lobbyId}`);
        }, 1500);
      })
      .catch(err => {
        if (err.response?.status === 403) {
          setStatus('full');
        } else {
          setStatus('error');
          setErrorMessage(err.response?.data?.message || err.response?.data || 'Failed to join lobby.');
        }
      });
  }, [token, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 px-4">
      <div className="glass p-8 max-w-md w-full text-center flex flex-col items-center">
        {status === 'loading' && (
          <>
            <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 className="text-xl font-bold text-white mb-2">Joining Lobby...</h2>
            <p className="text-slate-400 text-sm">Please wait while we connect you.</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Joined Successfully!</h2>
            <p className="text-slate-400 text-sm">Redirecting to the lobby room...</p>
          </>
        )}

        {status === 'full' && (
          <>
            <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Lobby is Full</h2>
            <p className="text-slate-400 text-sm mb-6">This lobby has reached its maximum player limit. Please try again later. If a space opens up, this link will become active again.</p>
            <Button onClick={() => router.push('/')} className="bg-slate-800 text-white hover:bg-slate-700 w-full">Return Home</Button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-3">Unable to Join</h2>
            <p className="text-slate-400 text-sm mb-6">{errorMessage || 'The link may be invalid or the lobby was cancelled.'}</p>
            <Button onClick={() => router.push('/')} className="bg-slate-800 text-white hover:bg-slate-700 w-full">Return Home</Button>
          </>
        )}
      </div>
    </div>
  );
}
