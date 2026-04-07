import { FileText, ImageIcon, Pill, ShieldCheck, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../components/ui/card'
import { PageHeader } from '../components/common/page-header'

const tools = [
  { title: 'X-ray Analysis', description: 'Upload an image and get a lightweight Gemini or fallback interpretation.', to: '/tools/xray', icon: ImageIcon },
  { title: 'Drug Reference', description: 'Search drug cards and check interaction safety in seconds.', to: '/tools/drugs', icon: Pill },
  { title: 'Referral Builder', description: 'Generate structured referral letters and save them to Supabase.', to: '/tools/referral', icon: FileText },
  { title: 'Treatment Plan', description: 'Create phased plans that load instantly and save cleanly.', to: '/tools/treatment-plan', icon: Sparkles },
  { title: 'Audit Trail', description: 'See system and clinical activity with minimal overhead.', to: '/tools/audit', icon: ShieldCheck },
]

export function ToolsPage() {
  const navigate = useNavigate()
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Tools" title="Lightweight clinical tools" description="Everything here runs client-side first, with Supabase saves and direct Gemini calls where useful." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tools.map(item => (
          <button key={item.title} onClick={() => navigate(item.to)} className="text-left">
            <Card className="h-full hover:border-primary/40">
              <CardContent>
                <item.icon className="h-5 w-5 text-primary" />
                <h2 className="mt-4 text-lg font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </div>
  )
}
