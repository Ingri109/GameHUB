'use client';

import { Button } from '@/components/ui/button';
import { ServerCrash } from 'lucide-react';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Catastrophic Error Caught by Global Error Boundary:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased">
        <main className="grid min-h-screen place-items-center p-5">
          <div className="glass w-full max-w-md p-8 text-center md:p-12 border border-slate-800/60 rounded-2xl bg-slate-900/50 backdrop-blur-xl">
            <div className="mb-6 flex justify-center">
              <div className="grid size-14 place-items-center rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                <ServerCrash className="size-7" />
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-3 tracking-tight text-slate-200">
              Catastrophic Matrix Failure
            </h2>

            <p className="text-sm text-slate-400 mb-8 mx-auto leading-relaxed">
              A critical layout error occurred. You must reload the application to re-initialize the environment.
            </p>

            <Button
              onClick={() => reset()}
              className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-violet-700/60 bg-violet-600/20 text-sm font-semibold text-violet-100 transition-all duration-300 hover:bg-violet-600/40 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:border-violet-500/50"
            >
              Try again
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}