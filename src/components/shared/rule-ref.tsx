import { Badge } from '@/components/ui/badge'

interface RuleRefProps {
  rule?: string
  test?: string
  page?: string
}

// Chip row linking a lesson to the engine: rule id, test fixture, manual page.
export function RuleRef({ rule, test, page }: RuleRefProps) {
  return (
    <div className="my-1.5 mb-4 flex flex-wrap gap-2">
      {rule && <Badge variant="accent">rules/cboe_baseline.yaml → {rule}</Badge>}
      {test && <Badge variant="good">{test}</Badge>}
      {page && <Badge variant="warn">Cboe manual {page}</Badge>}
    </div>
  )
}
