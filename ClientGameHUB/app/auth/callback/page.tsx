'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Gamepad2 } from 'lucide-react'

function CallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const login = useAuthStore(state => state.login)
    const hasFetched = useRef(false)
    
    const [loadingText, setLoadingText] = useState('З\'єднання з Discord...')

    useEffect(() => {
        const texts = ['З\'єднання з Discord...', 'Отримання профілю...', 'Налаштування сесії...', 'Майже готово...']
        let step = 0
        const interval = setInterval(() => {
            step = (step + 1) % texts.length
            setLoadingText(texts[step])
        }, 1500)

        const code = searchParams.get('code')
        
        if (code && !hasFetched.current) {
            hasFetched.current = true 
            
            api.post('/auth/discord-callback', { code })
                .then(res => {
                    login(res.data.token, res.data.user)
                    router.push('/profile')
                })
                .catch(err => {
                    console.error('Помилка авторизації', err)
                    router.push('/login')
                })
        } else if (!code && !hasFetched.current) {
            router.push('/login')
        }

        return () => clearInterval(interval)
    }, [searchParams, router, login])

    return (
        <div className="glass flex w-full max-w-sm flex-col items-center justify-center p-10 text-center">
            
            <div className="relative mb-6 grid place-items-center">
                <div className="absolute -inset-3 animate-[spin_3s_linear_infinite] rounded-full border-2 border-dashed border-violet-500/40" />
                
                <div className="grid size-16 animate-pulse place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-[0_0_30px_rgba(139,92,246,0.5)]">
                    <Gamepad2 className="size-8" />
                </div>
            </div>
            
            <h2 className="text-xl font-bold tracking-tight text-slate-100">
                Авторизація
            </h2>
            <p className="mt-2 text-sm text-violet-300 transition-all duration-300">
                {loadingText}
            </p>
            
        </div>
    )
}

export default function CallbackPage() {
    return (
        <main className="login-bg grid min-h-screen place-items-center bg-slate-950 p-5 text-white">
            <Suspense fallback={<div className="text-violet-400">Завантаження...</div>}>
                <CallbackContent />
            </Suspense>
        </main>
    )
}
