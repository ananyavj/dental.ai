import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/react'
import { Bold, Heading2, List, Pilcrow, Quote, Save } from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { PageHeader } from '../components/common/page-header'
import { useAuth } from '../contexts/auth-context'
import { publishCaseStudy } from '../lib/data-client'

const specialties = [
  'General Dentistry',
  'Endodontics',
  'Periodontics',
  'Oral Surgery',
  'Oral Medicine',
  'Orthodontics',
  'Pediatric Dentistry',
  'Prosthodontics',
]

export default function CaseStudyEditorPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [title, setTitle] = useState('')
  const [specialty, setSpecialty] = useState('General Dentistry')
  const [summary, setSummary] = useState('')
  const [saving, setSaving] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Write your case in a clear clinical flow: background, diagnosis, treatment plan, outcome, and takeaway.',
      }),
    ],
    content: '<h2>Background</h2><p></p><h2>Clinical Findings</h2><p></p><h2>Management</h2><p></p><h2>Takeaway</h2><p></p>',
    immediatelyRender: false,
  })

  const controls = useMemo(() => [
    { label: 'Paragraph', icon: Pilcrow, action: () => editor?.chain().focus().setParagraph().run() },
    { label: 'Heading', icon: Heading2, action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: 'Bold', icon: Bold, action: () => editor?.chain().focus().toggleBold().run() },
    { label: 'Bullet List', icon: List, action: () => editor?.chain().focus().toggleBulletList().run() },
    { label: 'Quote', icon: Quote, action: () => editor?.chain().focus().toggleBlockquote().run() },
  ], [editor])

  async function handlePublish() {
    if (!profile || !editor) return
    if (!title.trim() || !summary.trim()) {
      toast.error('Add a title and summary before publishing')
      return
    }

    setSaving(true)
    await publishCaseStudy(profile, {
      title: title.trim(),
      specialty,
      summary: summary.trim(),
      content: editor.getHTML(),
    })
    setSaving(false)
    toast.success('Case study published')
    navigate('/discover', { replace: true })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Case Study Editor"
        title="Write a community case study"
        description="Only doctors can publish. Keep it practical and structured so peers can scan it quickly."
      />

      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <Card>
          <CardContent className="space-y-4">
            <Input placeholder="Case study title" value={title} onChange={event => setTitle(event.target.value)} />
            <select
              value={specialty}
              onChange={event => setSpecialty(event.target.value)}
              className="flex h-10 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none"
            >
              {specialties.map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <Textarea
              placeholder="Short summary for the card preview"
              value={summary}
              onChange={event => setSummary(event.target.value)}
              className="min-h-[140px]"
            />
            <Button className="w-full" onClick={() => void handlePublish()} disabled={saving}>
              <Save className="h-4 w-4" /> {saving ? 'Publishing...' : 'Publish Case Study'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {controls.map(control => (
                <Button key={control.label} type="button" variant="secondary" size="sm" onClick={control.action}>
                  <control.icon className="h-4 w-4" /> {control.label}
                </Button>
              ))}
            </div>
            <EditorContent editor={editor} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
