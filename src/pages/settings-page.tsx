import { Card, CardContent } from '../components/ui/card'
import { PageHeader } from '../components/common/page-header'
import { useAuth } from '../contexts/auth-context'
import { isGeminiEnabled } from '../lib/gemini'
import { isSupabaseConfigured } from '../lib/supabase'

export function SettingsPage() {
  const { profile } = useAuth()
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Settings" title="Profile and environment" description="Lightweight account summary and environment status." />
      <Card>
        <CardContent className="space-y-2 text-sm">
          <div><span className="font-medium">Name:</span> {profile?.full_name}</div>
          <div><span className="font-medium">Email:</span> {profile?.email}</div>
          <div><span className="font-medium">Role:</span> {profile?.role}</div>
          <div><span className="font-medium">Institution:</span> {profile?.institution || '—'}</div>
          <div><span className="font-medium">Specialty:</span> {profile?.specialty || '—'}</div>
          <div><span className="font-medium">Supabase:</span> {isSupabaseConfigured ? 'Configured' : 'Missing env values'}</div>
          <div><span className="font-medium">Gemini:</span> {isGeminiEnabled ? 'Configured' : 'Missing or placeholder API key'}</div>
          <div className="pt-2 text-xs text-muted-foreground">
            Use a Gemini API key created in Google AI Studio, then place it in <code>VITE_GEMINI_API_KEY</code>. This app uses the current <code>gemini-2.5-flash</code> model path.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
