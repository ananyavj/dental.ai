import { ExternalLink, PlayCircle } from 'lucide-react'
import { useMemo } from 'react'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { PageHeader } from '../components/common/page-header'
import { demoVideos } from '../lib/mock'

export function DentalTVPage() {
  const playlists = useMemo(() => {
    return Array.from(new Set(demoVideos.map(video => video.playlist))).map(playlist => ({
      title: playlist,
      videos: demoVideos.filter(video => video.playlist === playlist),
    }))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Dental TV" title="Curated dental playlists and video references" description="A lighter educational library with mapped playlists, thumbnails, and topic-based compilations for clinicians and students." />

      <div className="grid gap-4 md:grid-cols-3">
        {playlists.map(playlist => (
          <Card key={playlist.title}>
            <CardContent className="space-y-2">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Playlist</p>
              <h2 className="text-lg font-semibold">{playlist.title}</h2>
              <p className="text-sm text-muted-foreground">{playlist.videos.length} videos • {playlist.videos.map(video => video.specialty).slice(0, 2).join(', ')}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {demoVideos.map(video => (
          <Card key={video.id} className="overflow-hidden">
            <img src={video.thumbnailUrl} alt={video.title} className="aspect-video w-full object-cover" />
            <CardContent>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{video.playlist}</p>
              <h2 className="mt-2 text-lg font-semibold">{video.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{video.channel} • {video.specialty}</p>
              <p className="mt-1 text-xs text-muted-foreground">{video.duration} • {video.views}</p>
              <p className="mt-3 text-sm text-muted-foreground">{video.topic}</p>
              <div className="mt-4 flex gap-2">
                <Button asChild className="flex-1">
                  <a href={video.videoUrl} target="_blank" rel="noreferrer">
                    <PlayCircle className="h-4 w-4" /> Open video
                  </a>
                </Button>
                <Button asChild variant="secondary">
                  <a href={video.videoUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
