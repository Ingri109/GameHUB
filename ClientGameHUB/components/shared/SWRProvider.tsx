'use client';

import { SWRConfig } from 'swr';
import { fetcher } from '@/lib/api';

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig 
      value={{ 
        fetcher, 
        dedupingInterval: 5000, 
        revalidateOnFocus: false, // Optional: prevent refetch on window focus to save calls, depending on preference
      }}
    >
      {children}
    </SWRConfig>
  );
}
