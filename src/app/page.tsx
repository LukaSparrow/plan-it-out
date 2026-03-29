import { redirect } from 'next/navigation'

export default function RootPage() {
  // In production, check auth and redirect accordingly
  redirect('/auth/login')
}
