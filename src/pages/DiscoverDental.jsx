import { useState } from 'react'
import AppLayout from '../components/AppLayout'
import { MOCK_ARTICLES } from '../lib/data'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Search, Filter, BookOpen, TrendingUp, Calendar, ExternalLink, Loader2, ChevronRight } from 'lucide-react'

const TYPE_STYLES = {
  'Research': 'bg-blue-100 text-blue-700',
  'Guidelines': 'bg-green-100 text-green-700',
  'Material Review': 'bg-purple-100 text-purple-700',
  'Technique Update': 'bg-amber-100 text-amber-700',
  'Case Report': 'bg-orange-100 text-orange-700',
  'Conferences': 'bg-teal-100 text-teal-700',
}

const FILTERS = ['All', 'Research', 'Guidelines', 'Material Review', 'Technique Update', 'Case Report']

const TRENDING = [
  { topic: 'AI in dental imaging', change: '+34%' },
  { topic: 'Peri-implantitis management', change: '+28%' },
  { topic: 'Digital smile design', change: '+21%' },
  { topic: 'Immediate implant loading', change: '+17%' },
  { topic: 'Oral cancer screening AI', change: '+45%' },
]

const CONFERENCES = [
  { name: 'IDA Annual Convention 2024', org: 'Indian Dental Association', date: 'Dec 2024', location: 'Hyderabad' },
  { name: 'AOMSI National Conference', org: 'Oral & Maxillofacial Surgery', date: 'Nov 2024', location: 'Mumbai' },
  { name: 'EAO Annual Scientific meeting', org: 'European Assoc. Osseointegration', date: 'Oct 2024', location: 'Barcelona' },
]

export default function DiscoverDental() {
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [reviewInput, setReviewInput] = useState('')
  const [reviewResult, setReviewResult] = useState(null)
  const [reviewLoading, setReviewLoading] = useState(false)

  const filtered = MOCK_ARTICLES.filter(a =>
    (filter === 'All' || a.type === filter) &&
    (a.title.toLowerCase().includes(search.toLowerCase()) || a.tags.some(t => t.toLowerCase().includes(search.toLowerCase())))
  )

  const handleReview = async () => {
    if (!reviewInput.trim()) return
    setReviewLoading(true)
    setReviewResult(null)
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (!apiKey || apiKey === 'your_gemini_api_key_here') throw new Error('GEMINI_KEY_MISSING')
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      const prompt = `You are a senior dental clinician performing a structured critical appraisal of a research paper. Given the title, DOI, or abstract, provide a structured review.

Article/Abstract: "${reviewInput}"

Provide a structured response with these headings:
**Study Design & Evidence Level**
**Sample Size & Population**
**Key Findings**
**Limitations**
**Clinical Relevance** (1–2 sentences on what this changes in clinical practice)

Be concise and clinically focused.`
      const result = await model.generateContent(prompt)
      setReviewResult(result.response.text())
    } catch (err) {
      setReviewResult(err.message === 'GEMINI_KEY_MISSING' ? '⚠️ Gemini API key required for article review.' : `Error: ${err.message}`)
    } finally {
      setReviewLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="bg-white border-b border-dental-border px-5 py-3">
          <h1 className="text-sm font-bold text-dental-text">Discover Dental</h1>
          <p className="text-xs text-dental-text-secondary">Curated dental research, guidelines, and technique updates</p>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-dental-text-secondary" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search articles, topics, specialties..." className="input-field pl-9 text-xs" />
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              {FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${
                    filter === f ? 'bg-dental-blue text-white border-dental-blue' : 'bg-white text-dental-text-secondary border-dental-border hover:border-dental-blue hover:text-dental-blue'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Articles */}
            <div className="space-y-3">
              {filtered.map(article => (
                <div key={article.id} className="card p-4 hover:shadow-panel transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_STYLES[article.type] || 'bg-gray-100 text-gray-600'}`}>
                          {article.type}
                        </span>
                        {article.tags.map(tag => (
                          <span key={tag} className="tag-pill">{tag}</span>
                        ))}
                      </div>
                      <h3 className="text-xs font-semibold text-dental-text leading-snug">{article.title}</h3>
                      <p className="text-[10px] text-dental-text-secondary mt-1">{article.journal} · {article.date}</p>
                      <p className="text-[11px] text-dental-text mt-2 leading-relaxed">{article.summary}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-dental-border">
                    <button
                      onClick={() => { setReviewInput(article.title + (article.doi ? ` DOI: ${article.doi}` : '')) }}
                      className="btn-secondary text-[10px] py-1 px-2.5"
                    >
                      AI Review
                    </button>
                    {article.doi && (
                      <a href={`https://doi.org/${article.doi}`} target="_blank" rel="noreferrer" className="text-[10px] text-dental-blue flex items-center gap-1 hover:underline">
                        <ExternalLink size={10} /> View paper
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-64 border-l border-dental-border overflow-y-auto p-4 space-y-4 bg-dental-surface">
            {/* Article Review */}
            <div className="card p-3">
              <h3 className="text-xs font-semibold text-dental-text mb-2 flex items-center gap-1.5">
                <BookOpen size={12} className="text-dental-blue" /> Article Review
              </h3>
              <textarea
                value={reviewInput}
                onChange={e => setReviewInput(e.target.value)}
                placeholder="Paste article title, DOI, or abstract..."
                className="input-field text-[10px] resize-none"
                rows={4}
              />
              <button onClick={handleReview} disabled={reviewLoading || !reviewInput.trim()} className="btn-primary w-full justify-center mt-2 text-xs py-1.5">
                {reviewLoading ? <><Loader2 size={12} className="animate-spin" /> Reviewing...</> : 'Critical Appraisal'}
              </button>
              {reviewResult && (
                <div className="mt-3 bg-dental-surface rounded-lg p-3 text-[10px] text-dental-text leading-relaxed whitespace-pre-wrap">
                  {reviewResult}
                </div>
              )}
            </div>

            {/* Trending */}
            <div className="card p-3">
              <h3 className="text-xs font-semibold text-dental-text mb-2 flex items-center gap-1.5">
                <TrendingUp size={12} className="text-dental-blue" /> Trending This Week
              </h3>
              <div className="space-y-2">
                {TRENDING.map(({ topic, change }) => (
                  <div key={topic} className="flex items-center justify-between">
                    <p className="text-[10px] text-dental-text flex-1 pr-2">{topic}</p>
                    <span className="text-[10px] font-bold text-green-600">{change}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Conferences */}
            <div className="card p-3">
              <h3 className="text-xs font-semibold text-dental-text mb-2 flex items-center gap-1.5">
                <Calendar size={12} className="text-dental-blue" /> Upcoming Conferences
              </h3>
              <div className="space-y-2">
                {CONFERENCES.map(({ name, org, date, location }) => (
                  <div key={name} className="border-b border-dental-border pb-2 last:border-0 last:pb-0">
                    <p className="text-[10px] font-semibold text-dental-text">{name}</p>
                    <p className="text-[9px] text-dental-text-secondary">{org}</p>
                    <p className="text-[9px] text-dental-blue">{date} · {location}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
