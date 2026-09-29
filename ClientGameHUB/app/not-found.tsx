import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-8xl font-black text-violet-400 mb-6 drop-shadow-lg">404</h1>
      <h2 className="text-2xl font-bold mb-3">Page not found</h2>
      <p className="text-slate-400 mb-8 max-w-sm mx-auto">
        Whoops! Looks like this link is broken, or the lobby you are trying to reach doesn't exist anymore.
      </p>
      
      <Link href="/" >
        <Button className="bg-violet-500 hover:bg-violet-400 text-white font-semibold">
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
