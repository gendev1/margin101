import type { ReactNode } from 'react'

import { Panel } from './panel'

interface DecisionProps {
  id: string
  doc: string
  q: ReactNode
  picked: ReactNode
  children?: ReactNode
}

// A locked decision, taught: the fork as it stood, what was locked, and the
// domain reasoning. `doc` names the ADR file in docs/architecture/decisions/.
export function Decision({ id, doc, q, picked, children }: DecisionProps) {
  return (
    <Panel title={`${id} · ${doc}`}>
      <p><strong>The fork:</strong> {q}</p>
      <p><strong>You locked:</strong> {picked}</p>
      {children}
    </Panel>
  )
}
