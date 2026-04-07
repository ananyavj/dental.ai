import { useEffect, useMemo, useState } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { PageHeader } from '../components/common/page-header'
import { getDrugCatalog } from '../lib/data-client'
import { analyzeDrugInteractions } from '../lib/gemini'
import type { DrugItem } from '../types'

export function DrugsPage() {
  const [drugs, setDrugs] = useState<DrugItem[]>([])
  const [search, setSearch] = useState('')
  const [existing, setExisting] = useState('')
  const [planned, setPlanned] = useState('')
  const [result, setResult] = useState<{ summary: string; safeToAdminister: boolean; interactions: Array<{ severity: string; drugs: string; management: string }> } | null>(null)

  useEffect(() => {
    void getDrugCatalog().then(setDrugs)
  }, [])

  const filtered = useMemo(() => drugs.filter(item => item.genericName.toLowerCase().includes(search.toLowerCase()) || item.className.toLowerCase().includes(search.toLowerCase())), [drugs, search])

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Drug Reference" title="Chairside drug guidance" description="Fast drug cards, simple interaction checks, and clean fallback behaviour if Gemini is unavailable." />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardContent className="space-y-4">
            <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by generic name or class" />
            <div className="grid gap-3 md:grid-cols-2">
              {filtered.map(item => (
                <div key={item.id} className="rounded-xl border border-border p-4">
                  <p className="font-medium">{item.genericName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.className}</p>
                  <p className="mt-3 text-sm">{item.dentalDose}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{item.commonDentalUse}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-lg font-semibold">Interaction checker</h2>
            <Textarea value={existing} onChange={event => setExisting(event.target.value)} placeholder="Existing medications" />
            <Textarea value={planned} onChange={event => setPlanned(event.target.value)} placeholder="Planned dental prescription" />
            <Button className="w-full" onClick={async () => setResult(await analyzeDrugInteractions(existing, planned))}>Check interactions</Button>
            {result ? (
              <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                <p className="font-medium">{result.summary}</p>
                {result.interactions.map((item, index) => (
                  <div key={index} className="text-sm text-muted-foreground">
                    {item.severity}: {item.drugs} — {item.management}
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
