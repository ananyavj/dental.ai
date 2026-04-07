import { ArrowLeft, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { PageHeader } from '../components/common/page-header'
import { getCaseStudyById } from '../lib/data-client'
import type { CaseStudy } from '../types'

export default function CaseStudyDetailPage() {
  const navigate = useNavigate()
  const { caseStudyId = '' } = useParams()
  const [study, setStudy] = useState<CaseStudy | null>(null)

  useEffect(() => {
    void getCaseStudyById(caseStudyId).then(setStudy)
  }, [caseStudyId])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Community Case Study"
        title={study?.title || 'Loading case study'}
        description={study?.summary || 'A long-form community case entry with AI follow-up support.'}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate('/discover')}>
              <ArrowLeft className="h-4 w-4" /> Back to Discover
            </Button>
            {study ? (
              <Button
                onClick={() =>
                  navigate('/chat', {
                    state: {
                      mode: 'practitioner',
                      title: study.title,
                      prompt: `Review this community dental case study.\n\nTitle: ${study.title}\nSpecialty: ${study.specialty}\nSummary: ${study.summary}\nContent: ${study.content}\n\nGive the key clinical lessons, where you agree, and what to watch out for.`,
                    },
                  })
                }
              >
                <Sparkles className="h-4 w-4" /> Ask AI About This Case
              </Button>
            ) : null}
          </>
        }
      />

      <Card>
        <CardContent className="space-y-6">
          {study ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <Badge>{study.specialty}</Badge>
                <p className="text-sm text-muted-foreground">Dr. {study.authorName}</p>
                <p className="text-sm text-muted-foreground">{study.views} views</p>
                <p className="text-sm text-muted-foreground">{study.helpfulCount} helpful</p>
              </div>
              <div className="rich-prose" dangerouslySetInnerHTML={{ __html: study.content }} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">This case study could not be found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
