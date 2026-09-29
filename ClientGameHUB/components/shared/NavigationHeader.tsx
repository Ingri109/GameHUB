'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Home, Zap, Gift, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from './Logo';
import { Avatar } from './Avatar';
import { UserMenu } from './UserMenu';
import { useAuthStore } from '@/store/authStore';
import { api, fetcher } from '@/lib/api';
import useSWR from 'swr';
import { PostMatchModal } from '@/components/features/Lobby/PostMatchModal';

export function NavigationHeader() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  
  const { data: notificationsData, mutate: mutateNotifications } = useSWR(user ? '/Notification' : null, fetcher);
  const notifications = notificationsData || [];

  // 1. We still need notifications for the dropdown list, but without unread-count.
  // Actually, wait, if we drop unread-count, how do we get the notifications list? 
  // We can fetch it only when dropdown is opened if we wanted to, or keep it.
  // The objective is to replace the waterfall. We will fetch global context instead.
  
  const { data: globalContext, mutate: mutateGlobalContext } = useSWR(user ? '/User/context' : null, fetcher, { revalidateOnFocus: false });
  const friendReqCount = globalContext?.pendingFriendRequestCount || 0;
  const unreadCount = globalContext?.unreadNotificationCount || 0;

  
  

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<any>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayName = user?.displayName || (user?.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : 'Unknown');

  const navLinks = [
    { href: '/', label: 'Dashboard', Icon: Home },
    { href: '/matrix', label: 'Time Matrix', Icon: Zap }
  ];

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const baseURL = api.defaults.baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const eventSource = new EventSource(`${baseURL}/Notification/stream?token=${token}`);

    eventSource.onmessage = (event) => {
      if (event.data) {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'NEW_REVIEW') {
            mutateNotifications();
            mutateGlobalContext();
          }
        } catch (e) {
          console.error("Error parsing SSE data", e);
        }
      }
    };

    return () => {
        eventSource.close();
    };
  }, [user]);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  

  return (
    <>
      <header className="hidden md:block fixed inset-x-0 top-0 z-40 border-b border-slate-800/70 bg-slate-950/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link href="/">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className={`navlink ${pathname === href ? 'active' : ''}`}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="relative" ref={dropdownRef}>
              <button 
                className="relative hidden p-2 text-slate-400 sm:block hover:text-white transition-colors"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <Bell className="size-4" />
                {(unreadCount > 0 || friendReqCount > 0) && (
                  <i className="absolute right-1 top-1 size-1.5 rounded-full bg-red-500 animate-pulse" />
                )}
              </button>
              
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-3 border-b border-slate-800 bg-slate-950 text-sm font-semibold text-white">
                    Notifications
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {friendReqCount > 0 && (
                        <Link href="/friends?tab=requests" onClick={() => setDropdownOpen(false)}>
                            <div className="p-3 border-b border-slate-800 bg-emerald-900/20 hover:bg-emerald-900/40 cursor-pointer transition-colors flex items-center gap-3">
                                <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-400">
                                    <Bell className="size-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-emerald-400">Friend Requests</div>
                                    <div className="text-xs text-slate-400 mt-0.5">You have {friendReqCount} pending request(s)</div>
                                </div>
                            </div>
                        </Link>
                    )}
                    {notifications.length === 0 && friendReqCount === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-sm">No notifications</div>
                    ) : notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        className={`p-3 border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer transition-colors ${!notif.isRead ? 'bg-slate-800/30' : ''}`}
                        onClick={() => {
                          if (notif.type === 'PostSessionReview') {
                              setSelectedNotif(notif);
                              setDropdownOpen(false);
                          }
                        }}
                      >
                        {notif.type === 'PostSessionReview' && notif.lobby ? (
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                                <div className="text-sm font-medium text-white">{notif.lobby.name}</div>
                                <div className="text-xs text-violet-400 mt-0.5">{notif.lobby.gameName}</div>
                                <div className="text-[10px] text-slate-500 mt-1">
                                    {notif.lobby.startedAt ? new Date(notif.lobby.startedAt).toLocaleString() : new Date(notif.createdAt).toLocaleString()}
                                </div>
                            </div>
                            <div className="flex -space-x-2 shrink-0">
                                {notif.lobby.participants.slice(0, 3).map((p: any) => (
                                    <Avatar key={p.userId} name={p.displayName || p.username} url={p.avatarUrl} small className="w-6 h-6 border-2 border-slate-900" />
                                ))}
                                {notif.lobby.participants.length > 3 && (
                                    <div className="grid size-6 place-items-center rounded-full border-2 border-slate-900 bg-slate-800 text-[9px] font-medium text-slate-300 z-10">
                                        +{notif.lobby.participants.length - 3}
                                    </div>
                                )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-slate-300">{notif.message}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <UserMenu displayName={displayName} avatarUrl={user?.avatarUrl} username={user?.username} />
          </div>
        </div>
      </header>

      {selectedNotif && (
        <PostMatchModal 
            notification={selectedNotif} 
            onClose={() => setSelectedNotif(null)} 
            onSuccess={() => {
                setSelectedNotif(null);
                mutateNotifications();
            }}
        />
      )}
    </>
  );
}
