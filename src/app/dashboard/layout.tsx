import { verifySession } from '@/lib/dal'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 1. TWARDA WERYFIKACJA NA SERWERZE
  // Zanim Next.js w ogóle zacznie przetwarzać Twój ładny pasek boczny (Client Layout),
  // sprawdza token w API. Jak jest zły -> wyrzuca do logowania.
  await verifySession()

  // 2. Jeśli token jest poprawny, renderujemy Twój interfejs kliencki
  return (
    <DashboardShell>
      {children}
    </DashboardShell>
  )
}