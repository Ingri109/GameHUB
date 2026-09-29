'use client'

import { Button } from '@/components/ui/button'
import { Gamepad2 } from 'lucide-react'
import { DiscordIcon } from '@/components/shared/DiscordIcon'

export default function LoginPage() {
    
    const handleDiscordLogin = () => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        window.location.href = `${baseUrl}/auth/discord-login`;
    };

    return (
        <main className="login-bg grid min-h-screen place-items-center p-5 bg-slate-950 text-slate-100">
            <div className="glass w-full max-w-md p-8 text-center md:p-12">
                
                <div className="mb-8 flex justify-center">
                    <div className="flex items-center gap-2 font-bold tracking-tight">
                        <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-violet-400 to-indigo-500 text-slate-950">
                            <Gamepad2 className="size-4" />
                        </div>
                        <span>the<span className="text-violet-300">hub</span></span>
                    </div>
                </div>
                
                <p className="mb-2 text-xs uppercase tracking-[.25em] text-violet-300">
                    Private gaming, better timing
                </p>
                
                <h1 className="text-4xl font-bold">
                    Play together, more often.
                </h1>
                
                <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-slate-400">
                    Your crew&apos;s little corner of the internet. Find a lobby, match schedules, and make memories.
                </p>
                
                <Button 
                    onClick={handleDiscordLogin} 
                    className="group relative mt-9 flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/50 text-base font-semibold text-slate-200 transition-all duration-300 hover:border-violet-500/50 hover:bg-slate-800/80 hover:text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]"
                >
                    <DiscordIcon className="size-6 text-[#5865F2] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110" /> 
                    <span>Login with Discord</span>
                </Button>
                
                <p className="mt-5 text-xs text-slate-500">
                    Only invited friends can enter.
                </p>
                
            </div>
        </main>
    )
}