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
import { MOCK_USER } from '@/lib/mock-data'

const registerSchema = z
  .object({
    name: z.string().min(2, 'Imię musi mieć min. 2 znaki'),
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
      // TODO: replace with real API call
      // const res = await authApi.register(data.name, data.email, data.password)
      // setToken(res.data.access_token)
      // const me = await authApi.me()
      // setUser(me.data)

      await new Promise((r) => setTimeout(r, 900))
      setToken('mock_jwt_token_123')
      setUser({ ...MOCK_USER, name: data.name, email: data.email })
      router.push('/dashboard')
    } catch {
      setApiError('Wystąpił błąd. Spróbuj ponownie.')
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
        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink-muted" htmlFor="name">Imię i nazwisko</label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Jan Kowalski"
            className={cn('input-field', errors.name && 'border-red-400 focus:border-red-400 focus:ring-red-400/20')}
            {...register('name')}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink-muted" htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="jan@example.com"
            className={cn('input-field', errors.email && 'border-red-400 focus:border-red-400 focus:ring-red-400/20')}
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink-muted" htmlFor="password">Hasło</label>
          <div className="relative">
            <input
              id="password"
              type={showPass ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Min. 8 znaków"
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

          {/* Strength bar */}
          {password.length > 0 && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-all duration-300',
                      i <= strength ? strengthColor : 'bg-surface-3'
                    )}
                  />
                ))}
              </div>
              {strengthLabel && (
                <p className="text-xs text-ink-subtle">Siła hasła: <span className="font-medium text-ink">{strengthLabel}</span></p>
              )}
            </div>
          )}
        </div>

        {/* Password confirm */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink-muted" htmlFor="password_confirm">Powtórz hasło</label>
          <input
            id="password_confirm"
            type={showPass ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            className={cn('input-field', errors.password_confirm && 'border-red-400 focus:border-red-400 focus:ring-red-400/20')}
            {...register('password_confirm')}
          />
          {errors.password_confirm && <p className="text-xs text-red-500">{errors.password_confirm.message}</p>}
        </div>

        <p className="text-xs text-ink-subtle leading-relaxed">
          Rejestrując się, akceptujesz{' '}
          <Link href="#" className="text-brand-500 hover:underline">Regulamin</Link> i{' '}
          <Link href="#" className="text-brand-500 hover:underline">Politykę prywatności</Link>.
        </p>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
          {isSubmitting ? 'Tworzenie konta…' : 'Utwórz konto'}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-surface-3" />
        <span className="text-xs text-ink-subtle">lub</span>
        <div className="flex-1 h-px bg-surface-3" />
      </div>

      <button
        type="button"
        className="btn-outline w-full flex items-center justify-center gap-2.5"
        onClick={() => alert('OAuth z Google – podłącz backend!')}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Kontynuuj z Google
      </button>

      <p className="text-center text-sm text-ink-muted mt-6">
        Masz już konto?{' '}
        <Link href="/auth/login" className="text-brand-500 hover:text-brand-600 font-medium transition-colors">
          Zaloguj się
        </Link>
      </p>
    </div>
  )
}
