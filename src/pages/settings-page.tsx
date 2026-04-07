import { Card, CardContent } from '../components/ui/card'
import { PageHeader } from '../components/common/page-header'
import { useAuth } from '../contexts/auth-context'

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
        </CardContent>
      </Card>
    </div>
  )
}
