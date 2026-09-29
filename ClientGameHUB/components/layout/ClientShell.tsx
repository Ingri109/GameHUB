'use client';

import { usePathname } from 'next/navigation';
import { NavigationHeader } from '@/components/shared/NavigationHeader';
import { BottomNav } from '@/components/layout/BottomNav';

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = pathname?.startsWith('/login') || pathname?.startsWith('/auth/callback');

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-100 flex flex-col">
      <div className="ambient" />
      <NavigationHeader />
      <main className="relative mx-auto w-full max-w-7xl px-4 md:px-5 pb-24 pt-6 md:pt-28 flex-1">
        {children}
      </main>
      <footer className="hidden md:block relative border-t border-slate-800/70 py-7 text-center text-xs text-slate-500">
        Created for friends | 2026
      </footer>
      <BottomNav />
    </div>
  );
}
