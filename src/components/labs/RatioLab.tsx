import { useState } from 'react'

import PayoffChart from '@/components/PayoffChart'
import { Panel } from '@/components/shared'
import { Button } from '@/components/ui/button'
import type { Leg } from '@/lib/payoff'

// Module 5: why is_limited_risk exists. A 1×2 ratio spread looks fine at
// the strikes and is catastrophic at U→∞. Zoom out to see it.
export function RatioLab() {
  const [zoom, setZoom] = useState<'in' | 'out'>('in')
  const legs: Leg[] = [
    { kind: 'call', side: 1, K: 100, P: 6, qty: 1, mult: 100 },
    { kind: 'call', side: -1, K: 110, P: 3, qty: 2, mult: 100 },
  ]
  const lo = 80
  const hi = zoom === 'in' ? 125 : 320
  return (
    <Panel title="Ratio lab — long 1× 100C, short 2× 110C (a net-short-call structure)">
      <div className="my-3 flex flex-wrap items-center gap-2">
        <Button variant={zoom === 'in' ? 'default' : 'secondary'} onClick={() => setZoom('in')}>
          What the strikes show (U up to 125)
        </Button>
        <Button variant={zoom === 'out' ? 'default' : 'secondary'} onClick={() => setZoom('out')}>
          Zoom out (U up to 320)
        </Button>
      </div>
      <PayoffChart legs={legs} lo={lo} hi={hi} showTail
        title={zoom === 'in' ? 'Looks bounded… peak profit at K=110' : 'It was never bounded. One naked call survives past 110.'} />
      {zoom === 'in' ? (
        <p className="text-sm text-muted-foreground">
          Evaluated only at the strikes (0, 100, 110), the worst loss looks like the small
          net premium. An MPL computed at existing strikes would say “limited risk.”
        </p>
      ) : (
        <p className="text-sm text-destructive">
          Past U=110 you are net short one uncovered call: every dollar of rally costs $100.
          At U→∞ the loss is unbounded. This is exactly the structure{' '}
          <code>is_limited_risk(legs)</code> exists to keep out of the catch-all rule.
        </p>
      )}
    </Panel>
  )
}
