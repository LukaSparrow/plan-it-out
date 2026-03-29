import { Wallet } from 'lucide-react'

export default function ExpensesPage() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="font-display text-3xl text-ink mb-2">Rozliczenia</h1>
      <p className="text-ink-muted mb-8">Widok globalnych rozliczeń ze wszystkich wydarzeń.</p>
      <div className="card p-16 text-center">
        <Wallet size={40} className="mx-auto text-ink-subtle mb-4" />
        <p className="text-ink-muted">Panel finansowy – w budowie 🚧</p>
        <p className="text-sm text-ink-subtle mt-1">Tutaj pojawi się widok "Kto komu ile winien" i wykresy.</p>
      </div>
    </div>
  )
}
