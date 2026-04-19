'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store'
import { authApi } from '@/lib/api'
import { AuthSocialSection } from '@/components/auth/AuthSocialSection'

const loginSchema = z.object({
  email: z.string().email('Podaj poprawny adres e-mail'),
  password: z.string().min(6, 'Hasło musi mieć min. 6 znaków'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { setUser, setToken } = useAuthStore()
  const [showPass, setShowPass] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginForm) => {
    setApiError(null)
    try {
      const res = await authApi.login(data.email, data.password)
      setToken(res.data.access_token)
      const me = await authApi.me()
      setUser(me.data)
      router.push('/dashboard')
    } catch {
      setApiError('Nieprawidłowy e-mail lub hasło.')
    }
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h2 className="font-display text-3xl text-ink mb-1.5">Witaj z powrotem</h2>
        <p className="text-ink-muted">Zaloguj się, żeby zobaczyć swoje wydarzenia.</p>
      </div>

      {/* Demo hint */}
      <div className="mb-6 px-4 py-3 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 rounded-xl text-sm text-brand-700 dark:text-brand-300">
        🧪 <strong>Demo:</strong> jan@example.com / password
      </div>

      {apiError && (
        <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink-muted" htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            placeholder="jan@example.com"
            className={cn('input-field', errors.email && 'border-red-400 focus:border-red-400 focus:ring-red-400/20')}
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-ink-muted" htmlFor="password">Hasło</label>
            <Link href="#" className="text-xs text-brand-500 hover:text-brand-600 transition-colors">Zapomniałeś hasła?</Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              className={cn('input-field pr-11', errors.password && 'border-red-400 focus:border-red-400 focus:ring-red-400/20')}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink transition-colors"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
        >
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
          {isSubmitting ? 'Logowanie…' : 'Zaloguj się'}
        </button>
      </form>

      <AuthSocialSection />

      <p className="text-center text-sm text-ink-muted mt-6">
        Nie masz konta?{' '}
        <Link href="/auth/register" className="text-brand-500 hover:text-brand-600 font-medium transition-colors">
          Zarejestruj się
        </Link>
      </p>
    </div>
  )
}