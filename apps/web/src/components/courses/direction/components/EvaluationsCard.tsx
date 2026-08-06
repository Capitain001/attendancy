import { Section, SectionHeader } from '../ui/Section'
import type { EvaluationSummary } from '../types'
import { EVAL_TYPE_LABELS } from '../constants'

interface EvaluationsCardProps {
  summaries: EvaluationSummary[]
}

export function EvaluationsCard({ summaries }: EvaluationsCardProps) {
  return (
    <Section>
      <SectionHeader title="Évaluations" />

      {summaries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune évaluation enregistrée.</p>
      ) : (
        <div className="divide-y divide-border/50">
          {summaries.map((ev) => (
            <div key={ev.type} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm font-medium text-foreground">{EVAL_TYPE_LABELS[ev.type]}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ev.count} évaluation{ev.count > 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right">
                <span className="text-base font-medium text-foreground">
                  {ev.avgScore.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground"> / {ev.maxScore}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  )
}
