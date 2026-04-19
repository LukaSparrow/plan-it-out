'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store'
import { authApi } from '@/lib/api'
import { AuthSocialSection } from '@/components/auth/AuthSocialSection'

const registerSchema = z
  .object({
    full_name: z.string().min(2, 'Imię musi mieć min. 2 znaki'), // Zmienione z name na full_name
    email: z.string().email('Podaj poprawny adres e-mail'),
    password: z.string().min(8, 'Hasło musi mieć min. 8 znaków'),
    password_confirm: z.string(),
  })
  .refine((d) => d.password === d.password_confirm, {
    message: 'Hasła muszą być identyczne',
    path: ['password_confirm'],
  })

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const { setUser, setToken } = useAuthStore()
  const [showPass, setShowPass] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  const password = watch('password', '')

  const strength = (() => {
    if (!password) return 0
    let s = 0
    if (password.length >= 8) s++
    if (/[A-Z]/.test(password)) s++
    if (/[0-9]/.test(password)) s++
    if (/[^A-Za-z0-9]/.test(password)) s++
    return s
  })()

  const strengthLabel = ['', 'Słabe', 'Przeciętne', 'Dobre', 'Silne'][strength]
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-green-400'][strength]

  const onSubmit = async (data: RegisterForm) => {
    setApiError(null)
    try {
      // Przekazujemy full_name do API
      await authApi.register(data.full_name, data.email, data.password)
      const loginRes = await authApi.login(data.email, data.password)
      setToken(loginRes.data.access_token)
      const me = await authApi.me()
      setUser(me.data)
      router.push('/dashboard')
    } catch {
      setApiError('Konto z takim adresem e-mail już istnieje.')
    }
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h2 className="font-display text-3xl text-ink mb-1.5">Załóż konto</h2>
        <p className="text-ink-muted">Zacznij planować swoje pierwsze wydarzenie.</p>
      </div>

      {apiError && (
        <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink-muted" htmlFor="full_name">Imię i nazwisko</label>
          <input
            id="full_name"
            type="text"
            placeholder="Jan Kowalski"
            className={cn('input-field', errors.full_name && 'border-red-400 focus:border-red-400')}
            {...register('full_name')}
          />
          {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink-muted" htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            placeholder="jan@example.com"
            className={cn('input-field', errors.email && 'border-red-400 focus:border-red-400')}
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink-muted" htmlFor="password">Hasło</label>
          <div className="relative">
            <input
              id="password"
              type={showPass ? 'text' : 'password'}
              placeholder="Min. 8 znaków"
              className={cn('input-field pr-11', errors.password && 'border-red-400 focus:border-red-400')}
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

          {password.length > 0 && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={cn('h-1 flex-1 rounded-full transition-all duration-300', i <= strength ? strengthColor : 'bg-surface-3')} />
                ))}
              </div>
              {strengthLabel && <p className="text-xs text-ink-subtle">Siła hasła: <span className="font-medium text-ink">{strengthLabel}</span></p>}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink-muted" htmlFor="password_confirm">Powtórz hasło</label>
          <input
            id="password_confirm"
            type={showPass ? 'text' : 'password'}
            placeholder="••••••••"
            className={cn('input-field', errors.password_confirm && 'border-red-400 focus:border-red-400')}
            {...register('password_confirm')}
          />
          {errors.password_confirm && <p className="text-xs text-red-500">{errors.password_confirm.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
        >
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
          {isSubmitting ? 'Tworzenie konta…' : 'Utwórz konto'}
        </button>
      </form>

      <AuthSocialSection />

      <p className="text-center text-sm text-ink-muted mt-6">
        Masz już konto?{' '}
        <Link href="/auth/login" className="text-brand-500 hover:text-brand-600 font-medium transition-colors">
          Zaloguj się
        </Link>
      </p>
    </div>
  )
}