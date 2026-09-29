'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertOctagon } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Error Caught:', error);
  }, [error]);

  return (
    <main className="grid min-h-[80vh] place-items-center p-5 text-slate-100">
      <div className="glass w-full max-w-md p-8 text-center md:p-12 border border-slate-800/60 rounded-2xl bg-slate-900/50 backdrop-blur-xl">
        <div className="mb-6 flex justify-center">
          <div className="grid size-14 place-items-center rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <AlertOctagon className="size-7" />
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-3 tracking-tight text-slate-200">
          Something went wrong in the matrix.
        </h2>

        <p className="text-sm text-slate-400 mb-8 mx-auto leading-relaxed">
          A runtime exception or critical UI error was caught. Don't worry, even the best systems glitch sometimes.
        </p>

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => reset()}
            className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-violet-700/60 bg-violet-600/20 text-sm font-semibold text-violet-100 transition-all duration-300 hover:bg-violet-600/40 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:border-violet-500/50"
          >
            Try again
          </Button>

          <Button
            variant="ghost"
            onClick={() => window.location.href = '/'}
            className="h-12 w-full text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl transition-colors"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </main>
  );
}