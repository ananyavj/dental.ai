"use client"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<any>(null)

  useEffect(() => {
    fetch('http://localhost:8000/api/admin/metrics')
      .then(res => res.json())
      .then(data => setMetrics(data))
  }, [])

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
        <Badge variant="destructive">Superuser Access</Badge>
      </div>

      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_users}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_patients}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active AI Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.active_sessions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Token Usage (30d)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.token_usage_30d.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Further components (Charts using Recharts, Tables) will go here */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>System Activity</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center bg-muted/20 rounded-md border-dashed border-2">
          <p className="text-muted-foreground">Chart area (Tremor/Recharts placeholder)</p>
        </CardContent>
      </Card>
    </div>
  )
}
