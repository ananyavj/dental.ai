import { Card, CardContent } from '../components/ui/card'
import { PageHeader } from '../components/common/page-header'
import { demoVideos } from '../lib/mock'

export function DentalTVPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Dental TV" title="Short learning content" description="Simple, quick-loading educational cards for casual browsing across roles." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {demoVideos.map(video => (
          <Card key={video.id}>
            <CardContent>
              <div className="aspect-video rounded-xl bg-muted" />
              <h2 className="mt-4 text-lg font-semibold">{video.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{video.channel} • {video.specialty}</p>
              <p className="mt-1 text-xs text-muted-foreground">{video.duration} • {video.views}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
