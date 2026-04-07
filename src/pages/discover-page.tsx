import { ExternalLink, RefreshCw, Sparkles, SquarePen } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardContent } from '../components/ui/card'
import { SegmentedTabs } from '../components/ui/tabs'
import { PageHeader } from '../components/common/page-header'
import { useAuth } from '../contexts/auth-context'
import { getCommunityCaseStudies } from '../lib/data-client'
import { getLatestResearch } from '../lib/pubmed'
import { stripHtml } from '../lib/utils'
import type { CaseStudy, ResearchPaper } from '../types'

export default function DiscoverPage() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const [tab, setTab] = useState<'research' | 'cases'>('research')
  const [papers, setPapers] = useState<ResearchPaper[]>([])
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState('Loading...')
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([])
  const [loadingResearch, setLoadingResearch] = useState(true)

  async function loadResearch(forceRefresh = false) {
    setLoadingResearch(true)
    const result = await getLatestResearch(forceRefresh)
    setPapers(result.papers)
    setLastUpdatedLabel(result.lastUpdatedLabel)
    setLoadingResearch(false)
  }

  useEffect(() => {
    void loadResearch()
    void getCommunityCaseStudies().then(setCaseStudies)
  }, [])

  const researchCards = useMemo(() => papers.slice(0, 18), [papers])
  const doctorStories = useMemo(() => caseStudies.filter(item => item.contentType !== 'study_guide'), [caseStudies])
  const studentStories = useMemo(() => caseStudies.filter(item => item.contentType === 'study_guide'), [caseStudies])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Discover"
        title="Research and case-study knowledge hub"
        description="Browse fresh PubMed dental papers or learn from community case studies. Doctors can publish long-form cases without leaving the lightweight client."
        actions={
          <>
            {tab === 'research' ? (
              <Button variant="secondary" onClick={() => void loadResearch(true)} disabled={loadingResearch}>
                <RefreshCw className={`h-4 w-4 ${loadingResearch ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            ) : null}
            {role === 'doctor' ? (
              <Button onClick={() => navigate('/discover/case-studies/new')}>
                <SquarePen className="h-4 w-4" /> Write New Case Study
              </Button>
            ) : null}
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedTabs
          value={tab}
          onValueChange={value => setTab(value as 'research' | 'cases')}
          tabs={[
            { value: 'research', label: '🔬 Latest Research' },
            { value: 'cases', label: '📋 Community Case Studies' },
          ]}
        />
        <p className="text-sm text-muted-foreground">Last updated {lastUpdatedLabel}</p>
      </div>

      {tab === 'research' ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card><CardContent><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Fresh pulls</p><p className="mt-3 text-3xl font-semibold">{researchCards.length}</p><p className="mt-2 text-sm text-muted-foreground">Latest PubMed dentistry entries loaded from the internet.</p></CardContent></Card>
            <Card><CardContent><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Best use</p><p className="mt-3 text-lg font-semibold">Journal club and chairside learning</p><p className="mt-2 text-sm text-muted-foreground">Use “Ask AI About This Paper” to turn papers into quick clinical takeaways.</p></CardContent></Card>
            <Card><CardContent><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Structured map</p><p className="mt-3 text-lg font-semibold">Read → summarize → apply</p><p className="mt-2 text-sm text-muted-foreground">Start with abstract, identify study design, extract clinical action, then compare against your current workflow.</p></CardContent></Card>
          </div>

          <div className="surface-grid">
            {researchCards.map(paper => (
              <Card key={paper.id} className="h-full">
                <CardContent className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <Badge variant="info">{paper.year}</Badge>
                    <a href={paper.link} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  <h2 className="mt-4 text-lg font-semibold leading-7">{paper.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{paper.authors}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">{paper.journal}</p>
                  <p className="mt-4 flex-1 text-sm leading-6 text-muted-foreground">{paper.abstract}</p>
                  <Button
                    className="mt-5 w-full"
                    variant="secondary"
                    onClick={() =>
                      navigate('/chat', {
                        state: {
                          mode: 'practitioner',
                          title: paper.title,
                          prompt: `Review this dental paper for a clinician.\n\nTitle: ${paper.title}\nAuthors: ${paper.authors}\nJournal: ${paper.journal}\nYear: ${paper.year}\nAbstract: ${paper.abstract}\n\nGive the clinical takeaway, major limitation, and when it changes practice.`,
                        },
                      })
                    }
                >
                  <Sparkles className="h-4 w-4" /> Ask AI About This Paper
                </Button>
              </CardContent>
            </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-8">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Doctor case studies and clinical workflows</h2>
                <p className="text-sm text-muted-foreground">Medium-style posts from clinicians, including patient cases and workflow guides.</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {doctorStories.map(study => (
                <button key={study.id} type="button" onClick={() => navigate(`/discover/case-studies/${study.id}`)} className="text-left">
                  <Card className="h-full overflow-hidden transition duration-150 hover:border-primary/40">
                    {study.coverImage ? <img src={study.coverImage} alt={study.title} className="aspect-[16/9] w-full object-cover" /> : null}
                    <CardContent className="flex h-full flex-col">
                      <div className="flex items-center justify-between gap-3">
                        <Badge>{study.specialty}</Badge>
                        <p className="text-xs text-muted-foreground">{study.readTime || '5 min read'}</p>
                      </div>
                      <h2 className="mt-4 text-xl font-semibold leading-8">{study.title}</h2>
                      <p className="mt-2 text-sm text-muted-foreground">Dr. {study.authorName}</p>
                      <p className="mt-4 flex-1 text-sm leading-6 text-muted-foreground">{study.summary || stripHtml(study.content).slice(0, 180)}</p>
                      <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{study.views} views</span>
                        <span>{study.helpfulCount} helpful</span>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Student blogs and structured study maps</h2>
              <p className="text-sm text-muted-foreground">High-yield study workflows, revision maps, and exam prep notes written in a lighter Medium-like format.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {studentStories.map(study => (
                <button key={study.id} type="button" onClick={() => navigate(`/discover/case-studies/${study.id}`)} className="text-left">
                  <Card className="h-full overflow-hidden transition duration-150 hover:border-primary/40">
                    {study.coverImage ? <img src={study.coverImage} alt={study.title} className="aspect-[16/9] w-full object-cover" /> : null}
                    <CardContent className="flex h-full flex-col">
                      <div className="flex items-center justify-between gap-3">
                        <Badge variant="info">{study.specialty}</Badge>
                        <p className="text-xs text-muted-foreground">{study.readTime || '5 min read'}</p>
                      </div>
                      <h2 className="mt-4 text-xl font-semibold leading-8">{study.title}</h2>
                      <p className="mt-2 text-sm text-muted-foreground">{study.authorName} • Student contribution</p>
                      <p className="mt-4 flex-1 text-sm leading-6 text-muted-foreground">{study.summary}</p>
                      <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{study.views} reads</span>
                        <span>{study.helpfulCount} saved</span>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
