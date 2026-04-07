import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle, Loader2, Pill, Search } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import PageTransition from '../components/PageTransition'
import { getDrugCatalog } from '../lib/appData'
import { checkDrugInteractions } from '../lib/gemini'

function normalizeDrug(item) {
  return {
    id: item.id,
    genericName: item.genericName || item.generic_name,
    brandNames: item.brandNames || item.brand_names || [],
    class: item.class || item.drug_class || 'Dental drug',
    dentalDose: item.dentalDose || item.dental_dose || 'Refer standard prescribing guide',
    contraindications: item.contraindications || [],
    commonDentalUse: item.commonDentalUse || item.common_dental_use || 'Common chairside prescribing support',
    sideEffects: item.sideEffects || [],
  }
}

export default function DrugReference() {
  const [drugs, setDrugs] = useState([])
  const [search, setSearch] = useState('')
  const [selectedDrug, setSelectedDrug] = useState(null)
  const [existingMeds, setExistingMeds] = useState('')
  const [plannedDrugs, setPlannedDrugs] = useState('')
  const [interactions, setInteractions] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getDrugCatalog().then(result => {
      const normalized = result.map(normalizeDrug)
      setDrugs(normalized)
      setSelectedDrug(normalized[0] || null)
    })
  }, [])

  const filtered = useMemo(() => {
    return drugs.filter(item => {
      const q = search.toLowerCase()
      return item.genericName.toLowerCase().includes(q) ||
        item.class.toLowerCase().includes(q) ||
        item.brandNames.some(name => name.toLowerCase().includes(q))
    })
  }, [drugs, search])

  async function handleCheck() {
    if (!existingMeds.trim() || !plannedDrugs.trim()) return
    setLoading(true)
    setError('')
    setInteractions(null)
    try {
      const result = await checkDrugInteractions(existingMeds, plannedDrugs)
      setInteractions(result)
    } catch (err) {
      setError(err.message === 'GEMINI_KEY_MISSING'
        ? 'Gemini API key missing. Add it to use live interaction analysis.'
        : `Interaction check failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <PageTransition>
        <div className="min-h-full bg-[#f6f3ec] px-4 py-5 md:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[300px_minmax(0,1fr)_360px]">
            <section className="rounded-[28px] border border-black/6 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Drug catalog</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">Chairside prescribing reference</h1>
              <div className="relative mt-5">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Search by generic, class, brand"
                  className="w-full rounded-[18px] border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-[#ff7a59]"
                />
              </div>

              <div className="mt-5 space-y-3">
                {filtered.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedDrug(item)}
                    className={`w-full rounded-[20px] border px-4 py-4 text-left transition ${
                      selectedDrug?.id === item.id
                        ? 'border-[#ff7a59] bg-[#fff5f2]'
                        : 'border-slate-200 bg-slate-50 hover:border-[#ff7a59]/40'
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900">{item.genericName}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.class}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] border border-black/6 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
              {selectedDrug ? (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Selected drug</p>
                      <h2 className="mt-2 text-3xl font-semibold text-slate-900">{selectedDrug.genericName}</h2>
                      <p className="mt-2 text-sm text-slate-600">{selectedDrug.class}</p>
                    </div>
                    <div className="rounded-2xl bg-[#101b35] p-3 text-white">
                      <Pill size={18} />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-[24px] bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Dental dose</p>
                      <p className="mt-2 text-sm leading-6 text-slate-800">{selectedDrug.dentalDose}</p>
                    </div>
                    <div className="rounded-[24px] bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Common use</p>
                      <p className="mt-2 text-sm leading-6 text-slate-800">{selectedDrug.commonDentalUse}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-[24px] border border-slate-200 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Contraindications</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedDrug.contraindications.map(item => (
                          <span key={item} className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">{item}</span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-[24px] border border-slate-200 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Common side effects</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedDrug.sideEffects.map(item => (
                          <span key={item} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">{item}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-[24px] bg-[#101b35] p-5 text-white">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">Brand names</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedDrug.brandNames.map(item => (
                        <span key={item} className="rounded-full border border-white/12 bg-white/10 px-3 py-1 text-xs">{item}</span>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </section>

            <section className="rounded-[28px] border border-black/6 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Interaction checker</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Prescription safety review</h2>
              <div className="mt-5 space-y-4">
                <textarea
                  value={existingMeds}
                  onChange={event => setExistingMeds(event.target.value)}
                  rows={4}
                  placeholder="Current medications"
                  className="w-full rounded-[18px] border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-[#ff7a59]"
                />
                <textarea
                  value={plannedDrugs}
                  onChange={event => setPlannedDrugs(event.target.value)}
                  rows={4}
                  placeholder="Planned dental prescription"
                  className="w-full rounded-[18px] border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-[#ff7a59]"
                />
                <button onClick={handleCheck} disabled={loading} className="btn-primary w-full justify-center">
                  {loading ? <><Loader2 size={14} className="animate-spin" /> Checking safety</> : 'Check interactions'}
                </button>
                {error ? <p className="text-sm text-rose-600">{error}</p> : null}

                {interactions ? (
                  <div className={`rounded-[24px] p-4 ${
                    interactions.safeToAdminister === false ? 'bg-rose-50' :
                    interactions.interactions?.length ? 'bg-amber-50' : 'bg-emerald-50'
                  }`}>
                    <div className="flex items-center gap-2">
                      {interactions.safeToAdminister === false ? <AlertTriangle size={16} className="text-rose-600" /> : <CheckCircle size={16} className="text-emerald-600" />}
                      <p className="text-sm font-semibold text-slate-900">{interactions.summary}</p>
                    </div>
                    <div className="mt-4 space-y-3">
                      {(interactions.interactions || []).map((item, index) => (
                        <div key={index} className="rounded-[18px] bg-white/70 p-3">
                          <p className="text-sm font-medium text-slate-900">{item.drugs || `Interaction ${index + 1}`}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{item.severity}</p>
                          <p className="mt-2 text-sm text-slate-700">{item.management || item.effect}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  )
}
