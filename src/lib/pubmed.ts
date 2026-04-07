import { fallbackResearch } from './mock'
import { formatRelativeMinutes, readStorage, writeStorage } from './utils'
import type { ResearchPaper } from '../types'

const SEARCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=dentistry&retmax=18&sort=pub+date&retmode=json'
const CACHE_KEY = 'dental-ai-pubmed-cache'
const CACHE_AGE = 1000 * 60 * 15

interface PubmedCache {
  fetchedAt: number
  papers: ResearchPaper[]
}

function buildPaperLink(id: string) {
  return `https://pubmed.ncbi.nlm.nih.gov/${id}/`
}

async function fetchAbstracts(ids: string[]) {
  if (!ids.length) return new Map<string, string>()
  const response = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(',')}&retmode=text&rettype=abstract`)
  const text = await response.text()
  const chunks = text.split(/\n\n(?=\\d+\.)/g)
  const map = new Map<string, string>()
  ids.forEach((id, index) => {
    const chunk = chunks[index] ?? ''
    map.set(id, chunk.replace(/\s+/g, ' ').trim().slice(0, 220) || 'Abstract preview unavailable from PubMed.')
  })
  return map
}

export async function getLatestResearch(forceRefresh = false): Promise<{ papers: ResearchPaper[]; lastUpdatedLabel: string }> {
  const cached = readStorage<PubmedCache | null>(CACHE_KEY, null)
  if (!forceRefresh && cached && Date.now() - cached.fetchedAt < CACHE_AGE) {
    return {
      papers: cached.papers,
      lastUpdatedLabel: formatRelativeMinutes(cached.fetchedAt),
    }
  }

  try {
    const searchJson = await fetch(SEARCH_URL).then(res => res.json())
    const ids: string[] = searchJson.esearchresult?.idlist ?? []
    if (!ids.length) throw new Error('No PubMed results')
    const summaryJson = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`).then(res => res.json())
    const abstractMap = await fetchAbstracts(ids)
    const papers = ids.map(id => {
      const item = summaryJson.result?.[id]
      return {
        id,
        title: item?.title || 'Untitled paper',
        authors: (item?.authors || []).map((author: { name: string }) => author.name).join(', ') || 'Unknown authors',
        journal: item?.fulljournalname || item?.source || 'PubMed',
        year: String(item?.pubdate || '').slice(0, 4) || 'Current',
        abstract: abstractMap.get(id) || 'Abstract preview unavailable.',
        link: buildPaperLink(id),
      }
    })
    writeStorage(CACHE_KEY, { fetchedAt: Date.now(), papers })
    return {
      papers,
      lastUpdatedLabel: formatRelativeMinutes(Date.now()),
    }
  } catch {
    return {
      papers: fallbackResearch,
      lastUpdatedLabel: 'fallback data',
    }
  }
}
