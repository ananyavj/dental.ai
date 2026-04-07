import { MessageSquare, Sparkles, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { PageHeader } from '../components/common/page-header'
import { useAuth } from '../contexts/auth-context'
import { getDashboardData } from '../lib/data-client'
import { demoAppointments, demoAudit, demoCases, demoConversations, demoMetrics } from '../lib/mock'
import { formatDateTime } from '../lib/utils'
import type { Appointment, AuditEvent, Conversation, MetricCardData, PatientCase } from '../types'

export function DashboardPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [metrics, setMetrics] = useState<MetricCardData[]>(demoMetrics)
  const [cases, setCases] = useState<PatientCase[]>(demoCases)
  const [appointments, setAppointments] = useState<Appointment[]>(demoAppointments)
  const [activity, setActivity] = useState<AuditEvent[]>(demoAudit)
  const [conversations, setConversations] = useState<Conversation[]>(demoConversations)

  useEffect(() => {
    void getDashboardData(profile).then(data => {
      setMetrics(data.metrics)
      setCases(data.cases)
      setAppointments(data.appointments)
      setActivity(data.activity)
      setConversations(data.conversations)
    })
  }, [profile])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome back${profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}`}
        description="Everything loads from a lightweight client shell first, then hydrates with Supabase data in the background."
        actions={
          <>
            <Button onClick={() => navigate('/chat')}><MessageSquare className="h-4 w-4" /> Open chatbot</Button>
            <Button variant="secondary" onClick={() => navigate('/patients')}><Users className="h-4 w-4" /> Patient directory</Button>
            <Button variant="secondary" onClick={() => navigate('/discover')}><Sparkles className="h-4 w-4" /> Discover</Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(item => (
          <Card key={item.label}>
            <CardContent>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold">{item.value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{item.helper}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Priority patient flow</h2>
              <Button variant="ghost" onClick={() => navigate('/patients')}>View all</Button>
            </div>
            {cases.map(item => (
              <button key={item.id} onClick={() => navigate('/patients')} className="flex w-full items-start gap-4 rounded-xl border border-border bg-muted/30 p-4 text-left">
                <div className={`mt-1 h-3 w-3 rounded-full ${item.severity === 'EMERGENCY' ? 'bg-danger' : item.severity === 'URGENT' ? 'bg-warning' : 'bg-success'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{item.patient_name}</p>
                    <span className="rounded-full bg-card px-2 py-1 text-[11px] text-muted-foreground">{item.severity}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.chief_complaint}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{item.specialty} • {formatDateTime(item.last_activity_at)}</p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4">
              <h2 className="text-lg font-semibold">Upcoming appointments</h2>
              {appointments.map(item => (
                <div key={item.id} className="rounded-xl border border-border p-4">
                  <p className="font-medium">{item.type}</p>
                  <p className="mt-1 text-sm text-foreground">{item.patient_name || 'Patient'}{item.clinic_location ? ` • ${item.clinic_location}` : ''}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{formatDateTime(item.appointment_date)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.notes}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4">
              <h2 className="text-lg font-semibold">Recent activity</h2>
              {activity.map(item => (
                <div key={item.id} className="rounded-xl bg-muted/30 p-4">
                  <p className="font-medium">{item.event_title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.severity} • {formatDateTime(item.created_at)}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4">
              <h2 className="text-lg font-semibold">Saved conversations</h2>
              {conversations.map(item => (
                <div key={item.id} className="rounded-xl border border-border p-4">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.mode} • {formatDateTime(item.updated_at)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
