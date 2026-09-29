'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Users, UserPlus, Search, UserCheck, X, Check, SearchX, Clock, ChevronLeft, ChevronRight, Ban, AlertCircle , UserMinus, ExternalLink } from 'lucide-react';
import { api, fetcher } from '@/lib/api';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/shared/Avatar';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useAuthStore } from '@/store/authStore';
import { FriendListSkeleton } from '@/components/features/Friends/FriendListSkeleton';

const TABS = [
  { id: 'all', label: 'My Friends', icon: Users },
  { id: 'requests', label: 'Pending Requests', icon: Clock },
  { id: 'add', label: 'Add Friend', icon: UserPlus }
];

export default function FriendsContent({ initialFriends, initialRequests }: { initialFriends?: any; initialRequests?: any }) {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev && prev.message === message ? null : prev));
    }, 4000);
  };
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all');

  const setTab = (tabId: string) => {
    setActiveTab(tabId);
    window.history.replaceState(null, '', `?tab=${tabId}`);
  };

  return (
    <div className="mx-auto max-w-4xl pt-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Friends</h1>
        <p className="text-slate-400">View your network and manage friend requests.</p>
      </div>

      {/* Modern Tab Navigation */}
      <div className="flex space-x-1 rounded-xl bg-slate-900/50 p-1 mb-6 border border-slate-800">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-slate-800 text-white shadow shadow-black/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {activeTab === 'all' && <MyFriendsTab showToast={showToast} initialData={initialFriends} />}
        {activeTab === 'requests' && <PendingRequestsTab showToast={showToast} initialData={initialRequests} />}
        {activeTab === 'add' && <AddFriendTab showToast={showToast} />}
      </div>
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 rounded-xl border shadow-2xl p-4 animate-in slide-in-from-bottom-5 ${
          toast.type === 'success' 
            ? 'bg-emerald-900/90 border-emerald-700/50 text-emerald-100' 
            : 'bg-red-900/90 border-red-700/50 text-red-100'
        }`}>
          {toast.type === 'success' ? <Check className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 1. My Friends Tab
// ==========================================
function MyFriendsTab({ showToast, initialData }: { showToast: (msg: string, type?: 'success'|'error') => void; initialData?: any }) {
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const { data, isLoading, mutate } = useSWR(`/Friendship?page=${page}&pageSize=${pageSize}`, fetcher, { 
    fallbackData: initialData,
    revalidateOnMount: !initialData
  });
  
  const friends = data?.friends || [];
  const totalCount = data?.totalCount || 0;
  const loading = isLoading && !data;

  const handleRemoveFriend = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    
    // Optimistic UI update
    const previousFriends = [...friends];
    mutate({ ...data, friends: friends.filter((f: any) => f.userId !== userId) }, false);
    
    try {
      await api.delete(`/Friendship/${userId}`);
      mutate();
      showToast('Friend removed.');
    } catch (err: any) {
      mutate({ ...data, friends: previousFriends }, false);
      showToast(err.response?.data?.error || 'Failed to remove friend', 'error');
      console.error(err);
    }
  };

  if (loading && friends.length === 0) {
    return <FriendListSkeleton count={12} />;
  }

  if (!loading && friends.length === 0) {
    return <EmptyState icon={Users} title="No friends found" message="Search for a Discord nickname to start building your team." />;
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {friends.map((friend: any) => (
          <div key={friend.userId} className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex flex-1 items-center gap-3 overflow-hidden">
               <Avatar name={friend.displayName || friend.discordNickname || friend.username} url={friend.avatarUrl} />
               <div className="truncate">
                  <div className="font-semibold text-slate-200 truncate">{friend.displayName || friend.discordNickname || friend.username}</div>
                  {friend.displayName && friend.displayName !== friend.username && (
                     <div className="text-xs text-slate-500 truncate">@{friend.username}</div>
                  )}
               </div>
            </div>
            <div className="flex items-center gap-2 ml-2">
               <Link 
                 href={`/profile/${friend.username}`}
                 className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center"
                 title="View profile"
               >
                 <ExternalLink className="w-4 h-4" />
               </Link>
               <button 
                 onClick={() => handleRemoveFriend(friend.userId)}
                 className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center"
                 title="Remove friend"
               >
                 <UserMinus className="w-4 h-4" />
               </button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-900">
          <Button 
            disabled={page === 1} 
            onClick={() => setPage(page - 1)}
            variant="ghost"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          <div className="text-sm text-slate-400 font-medium">Page {page} of {totalPages}</div>
          <Button 
            disabled={page === totalPages} 
            onClick={() => setPage(page + 1)}
            variant="ghost"
          >
             Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. Pending Requests Tab
// ==========================================
function PendingRequestsTab({ showToast, initialData }: { showToast: (msg: string, type?: 'success'|'error') => void; initialData?: any }) {
  const { data, isLoading, mutate } = useSWR('/Friendship/requests', fetcher, { 
    fallbackData: initialData,
    revalidateOnMount: !initialData
  });
  
  const incoming = data?.incoming || [];
  const outgoing = data?.outgoing || [];
  const loading = isLoading && !data;

  const handleAccept = async (id: string) => {
    try {
      await api.post(`/Friendship/accept/${id}`);
      showToast('Friend request accepted!');
      mutate();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to accept request', 'error');
      console.error(err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.post(`/Friendship/reject/${id}`);
      showToast('Friend request declined.');
      mutate();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to decline request', 'error');
      console.error(err);
    }
  };

  if (loading && incoming.length === 0 && outgoing.length === 0) {
    return <FriendListSkeleton count={4} singleColumn={true} />;
  }

  return (
    <div className="space-y-10">
      {/* Incoming */}
      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          Incoming Requests <span className="text-xs bg-slate-800 text-slate-300 py-0.5 px-2 rounded-full">{incoming.length}</span>
        </h2>
        {incoming.length === 0 ? (
          <div className="p-8 text-center text-slate-500 border border-slate-900 border-dashed rounded-xl bg-slate-950/50">
            No pending incoming requests.
          </div>
        ) : (
          <div className="grid gap-3">
            {incoming.map((req: any) => (
              <div key={req.userId} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 gap-4">
                <div className="flex items-center gap-3">
                  <Avatar name={req.displayName || req.username} url={req.avatarUrl} />
                  <div>
                    <div className="font-semibold text-slate-200">{req.displayName || req.username}</div>
                    <div className="text-xs text-slate-500">Wants to be friends</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                   <Button onClick={() => handleAccept(req.userId)} className="flex-1 sm:flex-none">
                      <Check className="w-4 h-4 mr-2" /> Accept
                   </Button>
                   <Button onClick={() => handleReject(req.userId)} variant="ghost" className="flex-1 sm:flex-none text-slate-400 hover:text-red-400 hover:bg-slate-800">
                      <X className="w-4 h-4 mr-2" /> Decline
                   </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Outgoing */}
      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          Sent Requests <span className="text-xs bg-slate-800 text-slate-300 py-0.5 px-2 rounded-full">{outgoing.length}</span>
        </h2>
        {outgoing.length === 0 ? (
           <div className="p-8 text-center text-slate-500 border border-slate-950 rounded-xl bg-slate-950/20">
             You haven't sent any friend requests.
           </div>
        ) : (
          <div className="grid gap-3">
            {outgoing.map((req: any) => (
              <div key={req.userId} className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
                <div className="flex items-center gap-3 opacity-75">
                  <Avatar name={req.displayName || req.username} url={req.avatarUrl} small />
                  <div>
                    <div className="font-medium text-slate-300">{req.displayName || req.username}</div>
                    <div className="text-[11px] text-slate-500">Pending...</div>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleReject(req.userId)} className="text-slate-400 hover:text-orange-400">
                   Cancel
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ==========================================
// 3. Add Friend Tab
// ==========================================
function AddFriendTab({ showToast }: { showToast: (msg: string, type?: 'success'|'error') => void }) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);

  const { data: searchData, isLoading: isSearchLoading } = useSWR(
    debouncedQuery.trim() ? `/User/search?q=${encodeURIComponent(debouncedQuery)}` : null,
    fetcher
  );

  const results = searchData || [];
  const hasSearched = !!debouncedQuery.trim();
  const loading = debouncedQuery.trim() ? isSearchLoading : false;

  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  const handleSendRequest = async (userId: string, username: string) => {
    try {
      await api.post(`/Friendship/request/${userId}`);
      setSentRequests(prev => new Set(prev).add(userId));
      showToast(`Friend request sent to ${username}.`);
    } catch (err: any) {
      // If error indicates already sent or already friends, we can lock state too
      const rawError = err.response?.data?.error || '';
      let errorMsg = 'Failed to send request';
      
      if (rawError.includes('Не можна додати себе')) {
        errorMsg = 'Cannot add yourself as a friend.';
      } else if (rawError.includes('вже існує') || rawError.includes('вже друзі')) {
        errorMsg = 'A request is already pending or you are already friends.';
        setSentRequests(prev => new Set(prev).add(userId));
      } else if (rawError) {
        errorMsg = rawError;
      }
      
      showToast(errorMsg, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <label htmlFor="search" className="sr-only">Search by Discord nickname</label>
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <Search className="w-5 h-5 text-slate-400" />
        </div>
        <input 
          id="search"
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by Discord nickname..." 
          className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-inner"
        />
        {/* {loading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-4">
             <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )} */}
      </div>

      {/* Results */}
      <div>
        {loading && results.length === 0 ? (
          <FriendListSkeleton count={3} singleColumn={true} />
        ) : (
          <>
            {!loading && hasSearched && results.length === 0 && (
              <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-xl">
                 <SearchX className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                 <div className="font-medium text-slate-300">No users found</div>
                 <p className="text-sm text-slate-500 mt-1">Try spelling the nickname exactly.</p>
              </div>
            )}

            <div className="grid gap-3">
              {results.map((user: any) => (
            <div key={user.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
               <div className="flex items-center gap-3 overflow-hidden">
                  <Avatar name={user.discordNickname} url={user.avatarUrl} />
                  <div className="truncate">
                    <div className="font-semibold text-slate-200">{user.discordNickname}</div>
                  </div>
               </div>
               {user.relationshipStatus === 'ACCEPTED' ? (
                 <Button disabled variant="secondary" size="sm" className="shrink-0 bg-slate-800 text-slate-400 opacity-60 cursor-not-allowed">
                   <UserCheck className="w-4 h-4 mr-2" /> Вже у друзях
                 </Button>
               ) : user.relationshipStatus === 'PENDING' || sentRequests.has(user.id) ? (
                 <Button disabled variant="secondary" size="sm" className="shrink-0 bg-slate-800 text-slate-400 opacity-60 cursor-not-allowed">
                   <Check className="w-4 h-4 mr-2" /> Запит надіслано
                 </Button>
               ) : (
                 <Button onClick={() => handleSendRequest(user.id, user.discordNickname)} size="sm" className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white">
                   <UserPlus className="w-4 h-4 mr-2" /> Додати
                 </Button>
               )}
            </div>
          ))}
        </div>
        </>)}
      </div>

    </div>
  );
}

// ==========================================
// Reusable Utilities
// ==========================================
function EmptyState({ icon: Icon, title, message }: { icon: any, title: string, message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <Icon className="w-12 h-12 text-slate-600 mb-6" />
      <h3 className="text-xl font-bold text-slate-300 mb-2">{title}</h3>
      <p className="max-w-md text-slate-400">{message}</p>
    </div>
  );
}
