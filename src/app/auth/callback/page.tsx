'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { authApi } from '@/lib/api'
import Link from 'next/link'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser, setToken } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get('token')
    const err = searchParams.get('error')

    if (err || !token) {
      setError('Logowanie przez Google nie powiodło się. Spróbuj ponownie.')
      return
    }

    setToken(token)
    authApi
      .me()
      .then((res) => {
        setUser(res.data)
        router.replace('/dashboard')
      })
      .catch(() => {
        setError('Nie udało się pobrać danych użytkownika.')
      })
  }, [searchParams, setToken, setUser, router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-ink font-medium mb-2">Błąd logowania</p>
          <p className="text-ink-muted text-sm mb-4">{error}</p>
          <Link href="/auth/login" className="btn-primary text-sm">
            Wróć do logowania
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-brand-500 animate-spin mx-auto mb-3" />
        <p className="text-ink-muted text-sm">Logowanie przez Google…</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  )
}
