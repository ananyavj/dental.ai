import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { PageHeader } from '../components/common/page-header'
import { getPatientCases, saveTriage } from '../lib/data-client'
import { triageWithGemini } from '../lib/gemini'
import { useAuth } from '../contexts/auth-context'
import { formatDateTime } from '../lib/utils'
import type { PatientCase } from '../types'

export function PatientsPage() {
  const { profile } = useAuth()
  const [cases, setCases] = useState<PatientCase[]>([])
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [triageInput, setTriageInput] = useState({ complaint: '', age: '', symptoms: '' })
  const [triageResult, setTriageResult] = useState<{ severity: string; triageReason: string; redFlags: string[]; referralRequired: boolean } | null>(null)
  const [triageLoading, setTriageLoading] = useState(false)

  useEffect(() => {
    void getPatientCases().then(items => {
      setCases(items)
      setSelectedId(items[0]?.id ?? null)
    })
  }, [])

  const filtered = useMemo(() => cases.filter(item => {
    const query = search.toLowerCase()
    return item.patient_name.toLowerCase().includes(query) || item.chief_complaint.toLowerCase().includes(query)
  }), [cases, search])

  const selectedCase = filtered.find(item => item.id === selectedId) ?? filtered[0]

  async function handleTriage() {
    if (!selectedCase || !profile) return
    setTriageLoading(true)
    const result = await triageWithGemini(triageInput)
    setTriageResult(result)
    await saveTriage(profile, { patientId: selectedCase.patient_id || '', triage: result })
    setTriageLoading(false)
    toast.success('Triage result saved')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Patient Directory"
        title="Search cases and run lightweight triage"
        description="Fast list rendering first, then synced Supabase data. Use the right panel to run AI triage without leaving the directory."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardContent className="space-y-4">
            <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search patient name or chief complaint" />
            <div className="space-y-3">
              {filtered.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full rounded-xl border p-4 text-left transition ${selectedCase?.id === item.id ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                >
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{item.patient_name}</p>
                    <span className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground">{item.severity}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.chief_complaint}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{item.specialty} • {formatDateTime(item.last_activity_at)}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-lg font-semibold">{selectedCase?.patient_name || 'Select a patient'}</h2>
            <div className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
              {selectedCase?.chief_complaint || 'Choose a case from the list'} 
            </div>

            <div className="space-y-3">
              <Input
                placeholder="Chief complaint"
                value={triageInput.complaint}
                onChange={event => setTriageInput(current => ({ ...current, complaint: event.target.value }))}
              />
              <Input
                placeholder="Age"
                value={triageInput.age}
                onChange={event => setTriageInput(current => ({ ...current, age: event.target.value }))}
              />
              <Textarea
                placeholder="Associated symptoms"
                value={triageInput.symptoms}
                onChange={event => setTriageInput(current => ({ ...current, symptoms: event.target.value }))}
              />
              <Button className="w-full" disabled={triageLoading || !triageInput.complaint} onClick={handleTriage}>
                {triageLoading ? 'Running triage...' : 'Run AI triage'}
              </Button>
            </div>

            {triageResult ? (
              <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                <p className="font-medium">{triageResult.severity}</p>
                <p className="text-sm text-muted-foreground">{triageResult.triageReason}</p>
                <p className="text-xs text-muted-foreground">Red flags: {triageResult.redFlags.join(', ') || 'None'}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
