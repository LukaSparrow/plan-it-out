import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="font-display text-3xl text-ink mb-2">Ustawienia</h1>
      <p className="text-ink-muted mb-8">Profil, powiadomienia, bezpieczeństwo.</p>
      <div className="card p-16 text-center">
        <Settings size={40} className="mx-auto text-ink-subtle mb-4" />
        <p className="text-ink-muted">Ustawienia – w budowie 🚧</p>
        <p className="text-sm text-ink-subtle mt-1">Tutaj pojawi się zarządzanie profilem i preferencjami.</p>
      </div>
    </div>
  )
}
