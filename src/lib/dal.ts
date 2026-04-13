import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// Funkcja uruchamiana WYŁĄCZNIE na serwerze (Server Components)
export async function verifySession() {
  // W nowych wersjach Next.js na ciasteczka trzeba poczekać (await)
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value

  if (!token) {
    redirect('/auth/login')
  }

  try {
    // Uderzamy pod maską do FastAPI, żeby sprawdzić czy ciastko nie jest sfałszowane/wygasłe
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store', // Zawsze sprawdzaj na żywo
    })

    if (!res.ok) {
      throw new Error('Token wygasł')
    }

    return await res.json()
  } catch (error) {
    // Jeśli FastAPI odrzuci token, usuwamy go (jeśli potrzebne) i wyrzucamy do logowania
    redirect('/auth/login')
  }
}