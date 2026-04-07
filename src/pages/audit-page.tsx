import { useEffect, useState } from 'react'
import { Card, CardContent } from '../components/ui/card'
import { PageHeader } from '../components/common/page-header'
import { getAuditEvents } from '../lib/data-client'
import { formatDateTime } from '../lib/utils'
import type { AuditEvent } from '../types'

export function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([])
  useEffect(() => {
    void getAuditEvents().then(setEvents)
  }, [])
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Audit Trail" title="Simple medico-legal activity log" description="Fast table-free list view that works well on any screen." />
      <Card>
        <CardContent className="space-y-3">
          {events.map(item => (
            <div key={item.id} className="rounded-xl border border-border p-4">
              <p className="font-medium">{item.event_title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.event_type} • {item.action_status} • {item.severity} • {formatDateTime(item.created_at)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
