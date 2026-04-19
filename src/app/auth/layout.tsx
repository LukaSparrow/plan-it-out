import { AuthHero } from '@/components/auth/AuthHero'
import { Logo } from '@/components/ui/Logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex">
      <AuthHero />

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-surface-0">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo - widoczne tylko na małych ekranach */}
          <Logo className="lg:hidden mb-8" />
          {children}
        </div>
      </div>
    </div>
  )
}