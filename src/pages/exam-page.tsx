import { useState } from 'react'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { PageHeader } from '../components/common/page-header'
import { examQuestions } from '../lib/mock'

export function ExamPage() {
  const [selected, setSelected] = useState<Record<string, string>>({})
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Exam Mode" title="Quick revision and viva practice" description="Student-friendly lightweight mode with instant MCQs and recall-based explanations." />
      <div className="grid gap-4">
        {examQuestions.map(question => (
          <Card key={question.id}>
            <CardContent className="space-y-4">
              <p className="font-medium">{question.prompt}</p>
              <div className="grid gap-2">
                {question.options.map(option => (
                  <Button
                    key={option}
                    variant={selected[question.id] === option ? 'default' : 'secondary'}
                    className="justify-start"
                    onClick={() => setSelected(current => ({ ...current, [question.id]: option }))}
                  >
                    {option}
                  </Button>
                ))}
              </div>
              {selected[question.id] ? (
                <div className="rounded-xl bg-muted/30 p-4 text-sm text-muted-foreground">
                  Answer: <span className="font-medium text-foreground">{question.answer}</span><br />
                  {question.explanation}
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
