import { useState } from 'react'
import toast from 'react-hot-toast'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { PageHeader } from '../components/common/page-header'
import { useAuth } from '../contexts/auth-context'
import { saveReferral } from '../lib/data-client'
import { generateReferral } from '../lib/gemini'

export function ReferralPage() {
  const { profile } = useAuth()
  const [form, setForm] = useState({ patientName: '', specialty: '', chiefComplaint: '', clinicalFindings: '', reasonForReferral: '' })
  const [result, setResult] = useState<{ subject: string; letter: string } | null>(null)

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Referral Builder" title="Create referral letters instantly" description="Client-side first draft generation with optional Gemini enhancement and Supabase save." />
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardContent className="space-y-3">
            <Input placeholder="Patient name" value={form.patientName} onChange={event => setForm({ ...form, patientName: event.target.value })} />
            <Input placeholder="Specialty" value={form.specialty} onChange={event => setForm({ ...form, specialty: event.target.value })} />
            <Textarea placeholder="Chief complaint" value={form.chiefComplaint} onChange={event => setForm({ ...form, chiefComplaint: event.target.value })} />
            <Textarea placeholder="Clinical findings" value={form.clinicalFindings} onChange={event => setForm({ ...form, clinicalFindings: event.target.value })} />
            <Textarea placeholder="Reason for referral" value={form.reasonForReferral} onChange={event => setForm({ ...form, reasonForReferral: event.target.value })} />
            <Button className="w-full" onClick={async () => setResult(await generateReferral(form))}>Generate referral</Button>
            <Button
              className="w-full"
              variant="secondary"
              onClick={async () => {
                if (!profile || !result) return
                await saveReferral(profile, { patientName: form.patientName, specialty: form.specialty, subject: result.subject, letter: result.letter })
                toast.success('Referral saved')
              }}
            >
              Save referral
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold">{result?.subject || 'Referral preview'}</h2>
            <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-7 text-muted-foreground">{result?.letter || 'Generate a referral draft to preview it here.'}</pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
