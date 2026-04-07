import { useState } from 'react'
import toast from 'react-hot-toast'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { PageHeader } from '../components/common/page-header'
import { useAuth } from '../contexts/auth-context'
import { saveXrayReport } from '../lib/data-client'
import { analyzeXray } from '../lib/gemini'
import type { XrayResult } from '../types'

export function XrayPage() {
  const { profile } = useAuth()
  const [preview, setPreview] = useState<string>('')
  const [fileName, setFileName] = useState('')
  const [result, setResult] = useState<XrayResult | null>(null)

  async function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = async () => {
      const source = String(reader.result)
      setPreview(source)
      setFileName(file.name)
      const analysis = await analyzeXray(source.split(',')[1], file.type)
      setResult(analysis)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="X-ray Analysis" title="Upload radiographs and review findings" description="Uses direct Gemini multimodal calls when available and a safe fallback when not." />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardContent className="space-y-4">
            <label className="flex min-h-[280px] cursor-pointer items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 text-center">
              <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={event => {
                const file = event.target.files?.[0]
                if (file) void handleFile(file)
              }} />
              {preview ? <img src={preview} alt="Radiograph preview" className="max-h-[500px] rounded-xl object-contain" /> : <span className="text-sm text-muted-foreground">Click to upload IOPA or OPG image</span>}
            </label>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-lg font-semibold">Interpretation</h2>
            <p className="text-sm text-muted-foreground">{result?.interpretation || 'Upload an image to generate a review.'}</p>
            {result?.findings.map(item => (
              <div key={item.title} className="rounded-xl border border-border p-4">
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
              </div>
            ))}
            <Button
              variant="secondary"
              className="w-full"
              onClick={async () => {
                if (!profile || !result) return
                await saveXrayReport(profile, { fileName, imagingType: result.imagingType, urgency: result.urgency, report: result })
                toast.success('X-ray report saved')
              }}
            >
              Save report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
