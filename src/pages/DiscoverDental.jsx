import { useEffect, useMemo, useState } from 'react'
import { BookOpen, ExternalLink, Loader2, Search, TrendingUp } from 'lucide-react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import AppLayout from '../components/AppLayout'
import PageTransition from '../components/PageTransition'
import { getDiscoverArticles } from '../lib/appData'

const FILTERS = ['All', 'Research', 'Guidelines', 'Material Review', 'Technique Update', 'Case Report']

export default function DiscoverDental() {
  const [articles, setArticles] = useState([])
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [reviewInput, setReviewInput] = useState('')
  const [reviewResult, setReviewResult] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)

  useEffect(() => {
    getDiscoverArticles().then(setArticles)
  }, [])

  const filtered = useMemo(() => {
    return articles.filter(item => {
      const query = search.toLowerCase()
      const matchesFilter = filter === 'All' || item.type === filter
      const matchesSearch = item.title.toLowerCase().includes(query) || item.tags.some(tag => tag.toLowerCase().includes(query))
      return matchesFilter && matchesSearch
    })
  }, [articles, filter, search])

  async function handleReview() {
    if (!reviewInput.trim()) return
    setReviewLoading(true)
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        setReviewResult('Gemini API key missing. Add it to enable live critical appraisal.')
        return
      }
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      const result = await model.generateContent(`Provide a concise clinical appraisal of this dental article: ${reviewInput}`)
      setReviewResult(result.response.text())
    } catch (error) {
      setReviewResult(`Review failed: ${error.message}`)
    } finally {
      setReviewLoading(false)
    }
  }

  return (
    <AppLayout>
      <PageTransition>
        <div className="min-h-full bg-[#f6f3ec] px-4 py-5 md:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="rounded-[30px] border border-black/6 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Research workspace</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Discover dental evidence faster</h1>

              <div className="mt-6 flex flex-col gap-3 lg:flex-row">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder="Search title, tag, or topic"
                    className="w-full rounded-[18px] border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-[#ff7a59]"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {FILTERS.map(item => (
                    <button
                      key={item}
                      onClick={() => setFilter(item)}
                      className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                        filter === item ? 'bg-[#101b35] text-white' : 'border border-slate-200 text-slate-600 hover:border-[#ff7a59]/40'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {filtered.map(article => (
                  <article key={article.id} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#101b35] px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-white">{article.type}</span>
                          <span className="text-xs text-slate-500">{article.date}</span>
                        </div>
                        <h2 className="mt-3 text-xl font-semibold text-slate-900">{article.title}</h2>
                        <p className="mt-2 text-sm text-slate-500">{article.journal}</p>
                        <p className="mt-3 text-sm leading-6 text-slate-700">{article.summary}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {article.tags.map(tag => (
                            <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs text-slate-600">{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setReviewInput(`${article.title} ${article.doi ? `DOI: ${article.doi}` : ''}`)} className="btn-secondary text-xs">
                          <BookOpen size={13} /> Review
                        </button>
                        {article.doi ? (
                          <a href={`https://doi.org/${article.doi}`} target="_blank" rel="noreferrer" className="btn-primary text-xs">
                            <ExternalLink size={13} /> DOI
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <aside className="space-y-6">
              <section className="rounded-[30px] border border-black/6 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Critical appraisal</p>
                <textarea
                  value={reviewInput}
                  onChange={event => setReviewInput(event.target.value)}
                  rows={5}
                  placeholder="Paste a title, DOI, or abstract"
                  className="mt-4 w-full rounded-[18px] border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-[#ff7a59]"
                />
                <button onClick={handleReview} className="btn-primary mt-4 w-full justify-center" disabled={reviewLoading}>
                  {reviewLoading ? <><Loader2 size={14} className="animate-spin" /> Reviewing</> : 'Generate appraisal'}
                </button>
                {reviewResult ? (
                  <div className="mt-4 rounded-[20px] bg-slate-50 p-4 text-sm leading-6 text-slate-700 whitespace-pre-wrap">
                    {reviewResult}
                  </div>
                ) : null}
              </section>

              <section className="rounded-[30px] border border-black/6 bg-[#101b35] p-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
                <div className="flex items-center gap-3">
                  <TrendingUp size={18} className="text-[#8fe1cd]" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/60">Trending focus</p>
                    <h2 className="mt-1 text-lg font-semibold">What teams are reading</h2>
                  </div>
                </div>
                <div className="mt-5 space-y-3 text-sm text-white/75">
                  {[
                    'AI-assisted caries detection on bitewings',
                    'Peri-implant mucositis maintenance pathways',
                    'Monolithic zirconia outcome data',
                    'Evidence-led oral lesion triage',
                  ].map(item => (
                    <div key={item} className="rounded-[18px] border border-white/10 bg-white/6 px-4 py-3">
                      {item}
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  )
}
