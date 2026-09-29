'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, LogOut, Settings } from 'lucide-react';
import { Avatar } from './Avatar';
import { useAuthStore } from '@/store/authStore';

interface UserMenuProps {
  displayName: string;
  avatarUrl?: string;
  username?: string;
}

export function UserMenu({ displayName, avatarUrl, username }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    router.push('/login');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="focus:outline-none transition-transform hover:scale-105"
      >
        <Avatar name={displayName} url={avatarUrl} small />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in zoom-in-95 origin-top-right">
          <div className="p-3 border-b border-slate-800 bg-slate-950">
            <p className="text-sm font-semibold text-white truncate">{displayName}</p>
            {username && <p className="text-xs text-slate-400 truncate">@{username}</p>}
          </div>
          
          <div className="p-1">
            <Link href="/profile" onClick={() => setIsOpen(false)}>
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
                <User className="size-4" />
                Profile
              </div>
            </Link>
            <div className="my-1 border-t border-slate-800" />
            <div 
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg cursor-pointer transition-colors"
            >
              <LogOut className="size-4" />
              Logout
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
