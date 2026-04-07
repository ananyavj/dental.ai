import { redirect } from 'next/navigation'

export default function HomePage() {
  // Directly redirect to dashboard, authentication logic will handle unauth
  redirect('/login')
}
