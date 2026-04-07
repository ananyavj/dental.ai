import { useState, useRef, useCallback } from 'react'
import AppLayout from '../components/AppLayout'
import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  Search, Loader2, BookOpen, Tag, ChevronDown, ChevronUp,
  ExternalLink, FileText, Hash, RefreshCw, X
} from 'lucide-react'

const GEMINI_MODEL = 'gemini-2.0-flash'

// ── Gemini helper ─────────────────────────────────────────────────────────────
function getGeminiModel(customKey) {
  const apiKey = customKey || localStorage.getItem('DENTAL_RESEARCH_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey || apiKey === 'your_gemini_api_key_here') throw new Error('GEMINI_KEY_MISSING')
  const genAI = new GoogleGenerativeAI(apiKey)
  return genAI.getGenerativeModel({ model: GEMINI_MODEL })
}

// ── PubMed API (CORS-friendly, no key needed) ─────────────────────────────────
async function fetchPubMedPapers(query, limit = 8) {
  const base = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
  const enrichedQuery = `${query} AND (dentistry[MeSH] OR dental[Title/Abstract] OR oral[Title/Abstract])`

  const searchUrl = `${base}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(enrichedQuery)}&retmax=${limit}&retmode=json&sort=relevance`
  const searchRes = await fetch(searchUrl)
  if (!searchRes.ok) throw new Error(`PubMed search error: ${searchRes.status}`)
  const searchData = await searchRes.json()
  const ids = searchData.esearchresult?.idlist || []
  if (ids.length === 0) return []

  const summaryUrl = `${base}/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`
  const summaryRes = await fetch(summaryUrl)
  if (!summaryRes.ok) throw new Error(`PubMed summary error: ${summaryRes.status}`)
  const summaryData = await summaryRes.json()
  const result = summaryData.result || {}

  return ids
    .filter(id => result[id] && !result[id].error)
    .map(id => {
      const r = result[id]
      return {
        pmid: id,
        title: r.title || 'Untitled',
        authors: (r.authors || []).slice(0, 3).map(a => a.name).join(', ') + (r.authors?.length > 3 ? ' et al.' : ''),
        year: r.pubdate ? r.pubdate.split(' ')[0] : '',
        journal: r.fulljournalname || r.source || '',
        pubmedUrl: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        abstract: null,
      }
    })
}

// Fetch abstract for a single PMID (on demand)
async function fetchAbstract(pmid) {
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&rettype=abstract&retmode=text`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Could not fetch abstract')
  const text = await res.text()
  const match = text.match(/Abstract\n+([\s\S]+?)(?:\n\n|\nCopyright|$)/)
  return match ? match[1].trim() : text.trim()
}

// ── PubMed: rank and sort papers by title relevance ──────────────────────────
function rankPapers(papers, query) {
  if (!query || !papers) return papers
  
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2)
  if (terms.length === 0) return papers

  return [...papers].sort((a, b) => {
    let scoreA = 0
    let scoreB = 0

    const titleA = a.title.toLowerCase()
    const titleB = b.title.toLowerCase()

    terms.forEach(t => {
      if (titleA.includes(t)) scoreA += 10
      if (titleB.includes(t)) scoreB += 10
      
      // Bonus if exact word match
      if (new RegExp(`\\b${t}\\b`).test(titleA)) scoreA += 5
      if (new RegExp(`\\b${t}\\b`).test(titleB)) scoreB += 5

      if (a.journal?.toLowerCase().includes(t)) scoreA += 2
      if (b.journal?.toLowerCase().includes(t)) scoreB += 2
    })

    // If scores are equal, keep original PubMed relevance/date order
    return scoreB - scoreA
  })
}

// ── Gemini: generate related topics ──────────────────────────────────────────
async function fetchRelatedTopics(query, customKey) {
  const model = getGeminiModel(customKey)
  const prompt = `You are a dental research specialist. Given the dental/medical search query below, respond ONLY with a JSON object — no markdown, no explanation, no backticks — in exactly this format:
{
  "relatedTopics": ["topic1", "topic2", "topic3", "topic4", "topic5", "topic6"],
  "broaderContext": ["broader1", "broader2", "broader3"],
  "clinicalKeywords": ["kw1", "kw2", "kw3", "kw4"]
}
Keep topics concise (3–6 words each). All must be clinically relevant to dentistry.

Search query: "${query}"`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()
  const clean = text.replace(/```json|```/g, '').trim()
  try {
    return JSON.parse(clean)
  } catch {
    return { relatedTopics: [], broaderContext: [], clinicalKeywords: [] }
  }
}

// ── Gemini: summarise abstract ────────────────────────────────────────────────
async function summariseAbstract(title, abstract, customKey) {
  const model = getGeminiModel(customKey)
  const prompt = `You are a clinical research summariser for dental professionals. Given the paper title and abstract below, produce a concise, clinically focused summary using exactly this structure:

**Purpose** — what the study aimed to do
**Method** — study design & sample in one sentence
**Key Finding** — the most important result
**Clinical Takeaway** — what this means for dental practice (1 sentence)

Be direct and concise. Avoid jargon where possible.

Title: ${title}

Abstract: ${abstract || 'No abstract available.'}`

  const result = await model.generateContent(prompt)
  return result.response.text()
}

// ── Render markdown-bold helper ───────────────────────────────────────────────
function RenderBold({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <span>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={i} className="text-dental-text font-semibold">{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )}
    </span>
  )
}

// ── Paper Card ────────────────────────────────────────────────────────────────
function PaperCard({ paper, index }) {
  const [abstractOpen, setAbstractOpen] = useState(false)
  const [abstractText, setAbstractText] = useState(null)
  const [abstractLoading, setAbstractLoading] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState(null)

  const handleShowAbstract = async () => {
    if (abstractText !== null) {
      setAbstractOpen(o => !o)
      return
    }
    setAbstractOpen(true)
    setAbstractLoading(true)
    try {
      const text = await fetchAbstract(paper.pmid)
      setAbstractText(text)
    } catch {
      setAbstractText('Abstract not available for this paper.')
    } finally {
      setAbstractLoading(false)
    }
  }

  const handleSummarise = async () => {
    if (summary) { setSummaryOpen(o => !o); return }

    let abstr = abstractText
    if (!abstr) {
      try { abstr = await fetchAbstract(paper.pmid) } catch { abstr = '' }
      setAbstractText(abstr || '')
    }

    setSummaryLoading(true)
    setSummaryError(null)
    setSummaryOpen(true)
    try {
      const userKey = localStorage.getItem('DENTAL_RESEARCH_API_KEY')
      const result = await summariseAbstract(paper.title, abstr, userKey)
      setSummary(result)
    } catch (e) {
      const msg = e.message || ''
      if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
        setSummaryError('Research summary service is currently busy (Quota limit reached). Please try again in a moment.')
      } else if (msg === 'GEMINI_KEY_MISSING') {
        setSummaryError('⚠️ Gemini API key required. Add VITE_GEMINI_API_KEY to your .env file.')
      } else {
        setSummaryError('Could not generate summary. Please try again later.')
      }
    } finally {
      setSummaryLoading(false)
    }
  }

  return (
    <div
      className="card p-4 hover:shadow-panel transition-all duration-200 border border-dental-border rounded-xl bg-white"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          {paper.year && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-dental-blue-light text-dental-blue">
              {paper.year}
            </span>
          )}
          {paper.journal && (
            <span className="text-[10px] text-dental-text-secondary truncate max-w-[220px]" title={paper.journal}>
              {paper.journal}
            </span>
          )}
        </div>
        <h3 className="text-xs font-semibold text-dental-text leading-snug">{paper.title}</h3>
        {paper.authors && (
          <p className="text-[10px] text-dental-text-secondary mt-1">{paper.authors}</p>
        )}
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-dental-border flex-wrap">
        <button
          onClick={handleShowAbstract}
          className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg border border-dental-border text-dental-text-secondary hover:border-dental-blue hover:text-dental-blue transition-colors font-medium"
        >
          <FileText size={10} />
          {abstractOpen ? 'Hide Abstract' : 'Show Abstract'}
          {abstractOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>

        <button
          onClick={handleSummarise}
          disabled={summaryLoading}
          className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg border border-dental-blue/30 bg-dental-blue-light text-dental-blue hover:bg-dental-blue hover:text-white transition-colors font-medium disabled:opacity-60"
        >
          {summaryLoading
            ? <><Loader2 size={10} className="animate-spin" /> Summarising...</>
            : <>{summary ? (summaryOpen ? 'Hide Summary' : 'Show Summary') : 'Summarise'}</>
          }
        </button>

        {paper.pubmedUrl && (
          <a href={paper.pubmedUrl} target="_blank" rel="noreferrer"
            className="text-[10px] text-dental-blue flex items-center gap-1 hover:underline">
            <ExternalLink size={10} /> PubMed
          </a>
        )}
      </div>

      {abstractOpen && (
        <div className="mt-3 bg-dental-surface rounded-lg p-3 border border-dental-border">
          {abstractLoading
            ? <div className="flex items-center gap-1.5 text-[10px] text-dental-text-secondary"><Loader2 size={10} className="animate-spin" /> Loading abstract...</div>
            : <p className="text-[11px] text-dental-text-secondary leading-relaxed whitespace-pre-wrap">{abstractText}</p>
          }
        </div>
      )}

      {summaryOpen && !summaryLoading && (
        <div className="mt-3 bg-blue-50/60 rounded-lg p-3 border border-dental-blue/20">
          {summaryError
            ? <p className="text-[10px] text-red-500">{summaryError}</p>
            : (
              <div className="space-y-1">
                {summary?.split('\n').filter(l => l.trim()).map((line, i) => (
                  <p key={i} className="text-[11px] text-dental-text leading-relaxed">
                    <RenderBold text={line} />
                  </p>
                ))}
              </div>
            )
          }
        </div>
      )}
    </div>
  )
}

// ── Related Topics Sidebar ─────────────────────────────────────────────────────
function RelatedTopicsSidebar({ topics, onTopicClick, loading, error }) {
  if (loading) {
    return (
      <div className="card p-3 space-y-2">
        <h3 className="text-xs font-semibold text-dental-text flex items-center gap-1.5 mb-2">
          <Hash size={12} className="text-dental-blue" /> Related Topics
        </h3>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-6 rounded-full bg-dental-border animate-pulse" style={{ width: `${60 + i * 8}%` }} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-3">
        <p className="text-[10px] text-amber-600">{error}</p>
      </div>
    )
  }

  if (!topics) return null

  const { relatedTopics = [], broaderContext = [], clinicalKeywords = [] } = topics

  return (
    <div className="space-y-3">
      {relatedTopics.length > 0 && (
        <div className="card p-3">
          <h3 className="text-xs font-semibold text-dental-text flex items-center gap-1.5 mb-2.5">
            <Hash size={12} className="text-dental-blue" /> Related Topics
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {relatedTopics.map(t => (
              <button key={t} onClick={() => onTopicClick(t)}
                className="text-[10px] px-2 py-1 rounded-full bg-dental-blue-light text-dental-blue border border-dental-blue/20 hover:bg-dental-blue hover:text-white transition-colors font-medium">
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {broaderContext.length > 0 && (
        <div className="card p-3">
          <h3 className="text-xs font-semibold text-dental-text flex items-center gap-1.5 mb-2.5">
            <BookOpen size={12} className="text-dental-blue" /> Broader Context
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {broaderContext.map(t => (
              <button key={t} onClick={() => onTopicClick(t)}
                className="text-[10px] px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors font-medium">
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {clinicalKeywords.length > 0 && (
        <div className="card p-3">
          <h3 className="text-xs font-semibold text-dental-text flex items-center gap-1.5 mb-2.5">
            <Tag size={12} className="text-dental-blue" /> Clinical Keywords
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {clinicalKeywords.map(k => (
              <button key={k} onClick={() => onTopicClick(k)}
                className="text-[10px] px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors font-medium">
                {k}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Suggested Searches ────────────────────────────────────────────────────────
const SUGGESTED = [
  'peri-implantitis management', 'CBCT root fracture', 'oral cancer screening',
  'digital smile design', 'immediate implant loading',
  'biodentine pulpotomy', 'guided bone regeneration',
]

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ResearchHub() {
  const [query, setQuery] = useState('')
  const [papers, setPapers] = useState(null)
  const [topics, setTopics] = useState(null)
  const [papersLoading, setPapersLoading] = useState(false)
  const [topicsLoading, setTopicsLoading] = useState(false)
  const [papersError, setPapersError] = useState(null)
  const [topicsError, setTopicsError] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState(localStorage.getItem('DENTAL_RESEARCH_API_KEY') || '')
  const inputRef = useRef(null)

  const saveApiKey = () => {
    if (apiKeyInput.trim()) {
      localStorage.setItem('DENTAL_RESEARCH_API_KEY', apiKeyInput.trim())
    } else {
      localStorage.removeItem('DENTAL_RESEARCH_API_KEY')
    }
    setShowSettings(false)
    window.location.reload() // Reload to ensure all helpers pick it up
  }

  const runSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) return
    setHasSearched(true)
    setPapers(null)
    setTopics(null)
    setPapersError(null)
    setTopicsError(null)
    setPapersLoading(true)
    setTopicsLoading(true)

    const userKey = localStorage.getItem('DENTAL_RESEARCH_API_KEY')
    fetchPubMedPapers(searchQuery)
      .then(p => { 
        const ranked = rankPapers(p, searchQuery)
        setPapers(ranked)
        setPapersLoading(false) 
      })
      .catch(e => { setPapersError(e.message); setPapersLoading(false) })

    fetchRelatedTopics(searchQuery, userKey)
      .then(t => { setTopics(t); setTopicsLoading(false) })
      .catch(e => {
        const msg = e.message || ''
        if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
          setTopicsError('Topic suggestions are temporarily unavailable (Quota reached).')
        } else if (msg === 'GEMINI_KEY_MISSING') {
          setTopicsError('⚠️ Add VITE_GEMINI_API_KEY to .env for topic suggestions.')
        } else {
          setTopicsError('Could not load related topics.')
        }
        setTopicsLoading(false)
      })
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    runSearch(query)
  }

  const handleTopicClick = (topic) => {
    setQuery(topic)
    runSearch(topic)
  }

  const handleClear = () => {
    setQuery('')
    setPapers(null)
    setTopics(null)
    setHasSearched(false)
    setPapersError(null)
    setTopicsError(null)
    inputRef.current?.focus()
  }

  return (
    <AppLayout>
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="bg-white border-b border-dental-border px-5 py-3">
          <h1 className="text-sm font-bold text-dental-text">Clinical Research Hub</h1>
          <p className="text-xs text-dental-text-secondary">Professional research paper retrieval with evidence-based summaries</p>
        </div>

        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Search Bar */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-dental-text-secondary pointer-events-none"
                />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search dental research topics, procedures, conditions..."
                  className="w-full rounded-lg border border-dental-border bg-white text-xs text-dental-text placeholder-dental-text-secondary py-2 pl-8 pr-8 focus:outline-none focus:ring-2 focus:ring-dental-blue/30 focus:border-dental-blue transition-colors"
                />
                {query && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dental-text-secondary hover:text-dental-text transition-colors"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={!query.trim() || papersLoading}
                className="btn-primary px-4 text-xs flex items-center gap-1.5 whitespace-nowrap disabled:opacity-60"
              >
                {papersLoading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                Search Papers
              </button>
            </form>

            {/* Suggested searches */}
            {!hasSearched && (
              <div>
                <p className="text-[10px] font-semibold text-dental-text-secondary uppercase tracking-widest mb-2">
                  Suggested Searches
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED.map(s => (
                    <button
                      key={s}
                      onClick={() => { setQuery(s); runSearch(s) }}
                      className="text-[10px] px-3 py-1.5 rounded-full bg-white border border-dental-border text-dental-text-secondary hover:border-dental-blue hover:text-dental-blue transition-colors font-medium"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading Skeletons */}
            {papersLoading && (
              <div className="space-y-3">
                <p className="text-[10px] text-dental-text-secondary flex items-center gap-1.5">
                  <Loader2 size={11} className="animate-spin text-dental-blue" />
                  Searching PubMed...
                </p>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="card p-4 space-y-2 animate-pulse">
                    <div className="h-3 bg-dental-border rounded w-1/4" />
                    <div className="h-4 bg-dental-border rounded w-3/4" />
                    <div className="h-3 bg-dental-border rounded w-1/2" />
                    <div className="h-7 bg-dental-border rounded w-40 mt-2" />
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {papersError && !papersLoading && (
              <div className="card p-4 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-xs text-red-600 font-medium">Error fetching papers</p>
                <p className="text-[10px] text-red-500 mt-1">{papersError}</p>
                <button onClick={() => runSearch(query)}
                  className="mt-3 btn-secondary text-[10px] py-1 px-2.5 flex items-center gap-1">
                  <RefreshCw size={10} /> Retry
                </button>
              </div>
            )}

            {/* Results */}
            {papers && !papersLoading && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold text-dental-text-secondary uppercase tracking-widest">
                    {papers.length} Papers Found
                  </p>
                  <button onClick={() => runSearch(query)}
                    className="text-[10px] text-dental-blue flex items-center gap-1 hover:underline">
                    <RefreshCw size={10} /> Refresh
                  </button>
                </div>

                {papers.length === 0
                  ? (
                    <div className="card p-6 text-center">
                      <BookOpen size={24} className="text-dental-text-secondary mx-auto mb-2 opacity-40" />
                      <p className="text-xs text-dental-text-secondary">No papers found for this query.</p>
                      <p className="text-[10px] text-dental-text-secondary mt-1">Try different keywords or click a related topic.</p>
                    </div>
                  )
                  : (
                    <div className="space-y-3">
                      {papers.map((paper, i) => (
                        <PaperCard key={paper.pmid} paper={paper} index={i} />
                      ))}
                    </div>
                  )
                }
              </>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="w-64 border-l border-dental-border overflow-y-auto p-4 space-y-4 bg-dental-surface flex-shrink-0">
            <div className="card p-3">
              <h3 className="text-xs font-semibold text-dental-text mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><BookOpen size={12} className="text-dental-blue" /> Research Assistant</span>
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-dental-text-secondary hover:text-dental-blue transition-colors"
                  title="Service Settings"
                >
                  <RefreshCw size={10} className={showSettings ? 'rotate-180 transition-transform' : ''} />
                </button>
              </h3>
              <p className="text-[10px] text-dental-text-secondary leading-relaxed">
                Papers are fetched live from <strong>PubMed</strong>. Related topics and clinical summaries are generated for deeper research insights.
              </p>

              {showSettings && (
                <div className="mt-3 pt-3 border-t border-dental-border space-y-2">
                  <label className="text-[9px] font-bold text-dental-text-secondary uppercase">Gemini API Key</label>
                  <div className="flex gap-1.5">
                    <input 
                      type="password"
                      value={apiKeyInput}
                      onChange={e => setApiKeyInput(e.target.value)}
                      placeholder="Enter API key..."
                      className="flex-1 text-[10px] px-2 py-1 rounded bg-white border border-dental-border focus:outline-none focus:border-dental-blue"
                    />
                    <button 
                      onClick={saveApiKey}
                      className="px-2 py-1 bg-dental-blue text-white text-[10px] rounded hover:bg-dental-blue-dark transition-colors font-medium"
                    >
                      Save
                    </button>
                  </div>
                  <p className="text-[9px] text-dental-text-secondary italic">
                    Overrides the key in your .env file. Key is stored locally in your browser.
                  </p>
                </div>
              )}
            </div>

            {(hasSearched || topicsLoading) && (
              <RelatedTopicsSidebar
                topics={topics}
                onTopicClick={handleTopicClick}
                loading={topicsLoading}
                error={topicsError}
              />
            )}

            {!hasSearched && (
              <div className="card p-3">
                <h3 className="text-xs font-semibold text-dental-text mb-2">Search Tips</h3>
                <ul className="space-y-1.5 text-[10px] text-dental-text-secondary">
                  <li className="flex gap-1.5"><span className="text-dental-blue font-bold">→</span> Use clinical terminology for best results</li>
                  <li className="flex gap-1.5"><span className="text-dental-blue font-bold">→</span> Combine a procedure + condition (e.g. "GBR peri-implantitis")</li>
                  <li className="flex gap-1.5"><span className="text-dental-blue font-bold">→</span> Click "Summarise" for a clinical breakdown</li>
                  <li className="flex gap-1.5"><span className="text-dental-blue font-bold">→</span> Click related topics to explore adjacent research</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
