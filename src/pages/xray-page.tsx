import { useState, useTransition } from 'react'
import toast from 'react-hot-toast'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Skeleton } from '../components/ui/skeleton'
import { PageHeader } from '../components/common/page-header'
import { useAuth } from '../contexts/auth-context'
import { saveXrayReport } from '../lib/data-client'
import type { DetectionResult, VisionResult, XrayResult } from '../types'

export function XrayPage() {
  const { profile } = useAuth()
  const [preview, setPreview] = useState<string>('')
  const [annotatedPreview, setAnnotatedPreview] = useState<string>('')
  const [fileName, setFileName] = useState('')
  const [detectResult, setDetectResult] = useState<DetectionResult | null>(null)
  const [visionResult, setVisionResult] = useState<VisionResult | null>(null)
  const [isDetecting, startDetecting] = useTransition()
  const [isAnalyzing, startAnalyzing] = useTransition()
  const [fullReport, setFullReport] = useState<XrayResult | null>(null)

  async function detectXray(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const response = await fetch('/api/detect/predict', {
      method: 'POST',
      body: formData,
    })
    if (!response.ok) throw new Error('Detection failed')
    const data = await response.json() as DetectionResult
    setDetectResult(data)
    setAnnotatedPreview(data.annotated_image)
    return data
  }

  async function analyzeVision(annotatedImage: string) {
    const response = await fetch('/api/detect/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: annotatedImage }),
    })
    if (!response.ok) throw new Error('Vision analysis failed')
    const data = await response.json() as VisionResult
    setVisionResult(data)
    return data
  }

  async function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = async () => {
      const source = String(reader.result)
      setPreview(source)
      setFileName(file.name)
      setDetectResult(null)
      setVisionResult(null)
      setFullReport(null)

      try {
        startDetecting(() => { })
        const detect = await detectXray(file)

        startAnalyzing(() => { })
        const vision = await analyzeVision(detect.annotated_image)

        // Merge into full report
        const report: XrayResult = {
          imagingType: 'Detected IOPA/OPG',
          quality: 'High (annotated)',
          urgency: 'URGENT',
          interpretation: `${vision.interpretation} | Detections: ${detect.detections.map(d => `${d.class_name} (${(d.confidence * 100).toFixed(1)}%)`).join(', ')}`,
          findings: [
            ...detect.detections.map(d => ({
              title: d.class_name,
              detail: `Confidence: ${(d.confidence * 100).toFixed(1)}%`
            })),
            {
              title: 'Vision Labels',
              detail: vision.labels.slice(0, 5).join(', ')
            }
          ],
          nextSteps: ['Clinical correlation', 'Vitality tests', 'Review with patient history'],
          detection: detect,
          vision: vision
        }
        setFullReport(report)
        toast.success('Full analysis complete!')
      } catch (error) {
        toast.error(`Analysis failed: ${(error as Error).message}`)
      }
    }
    reader.readAsDataURL(file)
  }

  const hasResults = detectResult || visionResult || fullReport

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI X-ray Analysis"
        title="YOLO Detection + Google Vision"
        description="Upload X-ray → YOLO bounding boxes → Vision API labels/text → Dental interpretation"
      />
      <Card>
        <CardContent className="p-6">
          <label className="flex min-h-[300px] cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 hover:border-primary">
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void handleFile(file)
              }}
            />
            {preview ? (
              <img src={preview} alt="Upload preview" className="max-h-[400px] max-w-full rounded-xl object-contain" />
            ) : (
              <div className="text-center">
                <Skeleton className="mx-auto h-12 w-12 rounded-full" />
                <p className="mt-2 text-lg font-medium">Click to upload IOPA, OPG, or CBCT</p>
                <p className="text-sm text-muted-foreground">PNG, JPG up to 10MB</p>
              </div>
            )}
          </label>
        </CardContent>
      </Card>

      {hasResults && (
        <>
          <Tabs defaultValue="detected" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="original">Original</TabsTrigger>
              <TabsTrigger value="detected" disabled={isDetecting || !annotatedPreview}>YOLO Detected</TabsTrigger>
              <TabsTrigger value="vision" disabled={!visionResult}>Vision Analysis</TabsTrigger>
              <TabsTrigger value="report">Full Report</TabsTrigger>
            </TabsList>
            <TabsContent value="original" className="pt-4">
              {preview && <Card><CardContent className="p-6"><img src={preview} alt="Original" className="max-h-[500px] rounded-xl object-contain mx-auto" /></CardContent></Card>}
            </TabsContent>
            <TabsContent value="detected" className="pt-4">
              {isDetecting ? (
                <Skeleton className="h-[500px] w-full rounded-xl" />
              ) : annotatedPreview ? (
                <Card>
                  <CardContent className="p-6">
                    <img src={annotatedPreview} alt="Detected" className="max-h-[500px] rounded-xl object-contain mx-auto" />
                    {detectResult?.detections.map((det, i) => (
                      <div key={i} className="mt-4 p-3 bg-primary/10 rounded-lg">
                        <strong>{det.class_name}</strong> ({(det.confidence * 100).toFixed(1)}%)
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null}
            </TabsContent>
            <TabsContent value="vision" className="pt-4">
              {isAnalyzing ? (
                <Skeleton className="h-[400px] w-full" />
              ) : visionResult ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Google Vision API Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h3 className="font-semibold mb-2">Top Labels</h3>
                        <ul className="space-y-1">
                          {visionResult.labels.slice(0, 8).map((label, i) => (
                            <li key={i} className="text-sm">{label}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Detected Text</h3>
                        <p className="text-sm bg-muted p-2 rounded text-xs max-h-32 overflow-auto">{visionResult.text || 'No text detected'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <h3 className="font-semibold mb-2">Interpretation</h3>
                        <p>{visionResult.interpretation}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </TabsContent>
            <TabsContent value="report" className="pt-4">
              {fullReport ? (
                <Card>
                  <CardContent className="space-y-4 pt-6">
                    <h2 className="text-xl font-bold">Integrated Report</h2>
                    <p className="text-muted-foreground">{fullReport.interpretation}</p>
                    {fullReport.findings.map((item, i) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{item.detail}</p>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-4">
                      <Button
                        className="flex-1"
                        onClick={async () => {
                          if (!profile || !fullReport) return
                          await saveXrayReport(profile, {
                            fileName,
                            imagingType: fullReport.imagingType,
                            urgency: fullReport.urgency,
                            report: fullReport
                          })
                          toast.success('Full X-ray report saved!')
                        }}
                      >
                        💾 Save Full Report
                      </Button>
                      <Button variant="outline" onClick={() => navigator.clipboard.writeText(JSON.stringify(fullReport, null, 2))}>
                        📋 Copy JSON
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
