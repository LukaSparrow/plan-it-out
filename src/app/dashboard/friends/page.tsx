import { Users } from 'lucide-react'

export default function FriendsPage() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="font-display text-3xl text-ink mb-2">Znajomi</h1>
      <p className="text-ink-muted mb-8">Zarządzaj swoimi znajomymi i grupami.</p>
      <div className="card p-16 text-center">
        <Users size={40} className="mx-auto text-ink-subtle mb-4" />
        <p className="text-ink-muted">Strona znajomych – w budowie 🚧</p>
        <p className="text-sm text-ink-subtle mt-1">Tutaj pojawi się lista znajomych i zarządzanie grupami.</p>
      </div>
    </div>
  )
}
