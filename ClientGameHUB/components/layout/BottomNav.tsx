'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Zap, Search, Users, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const { data: globalContext } = useSWR(user ? '/User/context' : null, fetcher, { revalidateOnFocus: false });
  const friendReqCount = globalContext?.pendingFriendRequestCount || 0;
  const unreadCount = globalContext?.unreadNotificationCount || 0;

  const isPublicRoute = pathname?.startsWith('/login') || pathname?.startsWith('/auth/callback');

  if (isPublicRoute) {
    return null;
  }

  const navItems = [
    { href: '/', label: 'Home', Icon: Home },
    { href: '/matrix', label: 'Matrix', Icon: Zap },
    { href: '/catalog', label: 'Catalog', Icon: Search },
    { href: '/friends', label: 'Friends', Icon: Users, badge: friendReqCount },
    { href: '/profile', label: 'Profile', Icon: User, badge: unreadCount }, // Unread general notifs could go here, or we ignore
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-slate-800/70 bg-slate-950/75 backdrop-blur-xl md:hidden px-2">
      {navItems.map(({ href, label, Icon, badge }) => {
        const isActive = pathname === href || (href !== '/' && pathname?.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`relative flex h-full flex-1 flex-col items-center justify-center gap-1 transition-colors ${
              isActive ? 'text-violet-400' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <div className="relative">
              <Icon className={`size-5 ${isActive ? 'fill-violet-400/20' : ''}`} />
              {(badge && badge > 0) ? (
                <div className="absolute -right-2 -top-1 grid min-w-4 h-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {badge > 9 ? '9+' : badge}
                </div>
              ) : null}
            </div>
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
