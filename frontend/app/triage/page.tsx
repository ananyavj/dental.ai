"use client"
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function TriagePage() {
  const [complaint, setComplaint] = useState("")
  const [pain, setPain] = useState(5)
  const [symptoms, setSymptoms] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleTriage = async () => {
    setLoading(true)
    try {
      const res = await fetch('http://localhost:8000/api/triage/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patient_id: "test-patient",
          chief_complaint: complaint,
          duration: "2 days",
          pain_level: pain,
          associated_symptoms: symptoms.split(',').map(s => s.trim())
        })
      })
      const data = await res.json()
      setResult(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>AI Failure-Free Triage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Chief Complaint</Label>
            <Input value={complaint} onChange={e => setComplaint(e.target.value)} placeholder="e.g. Broken tooth" />
          </div>
          <div className="space-y-2">
            <Label>Pain Level (0-10)</Label>
            <Input type="number" min="0" max="10" value={pain} onChange={e => setPain(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Associated Symptoms (comma separated)</Label>
            <Input value={symptoms} onChange={e => setSymptoms(e.target.value)} placeholder="e.g. swelling, fever" />
          </div>
          <Button onClick={handleTriage} disabled={loading} className="w-full">
            {loading ? "Running Agent..." : "Run AI Triage"}
          </Button>

          {result && (
            <div className={`mt-4 p-4 rounded-md ${result.triage_level === 'EMERGENCY' ? 'bg-red-100 text-red-900' : 'bg-green-100 text-green-900'}`}>
              <h3 className="font-bold">Result: {result.triage_level}</h3>
              <p className="text-sm mt-1">Confidence: {(result.confidence_score * 100).toFixed(1)}%</p>
              <p className="text-sm mt-1">Reason: {result.reasoning}</p>
              {result.needs_doctor_review && (
                <span className="inline-block mt-2 px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-bold rounded">NEEDS DOCTOR REVIEW</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
