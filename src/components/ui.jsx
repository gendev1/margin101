// Small shared UI pieces used across modules.

export function Slider({ label, value, onChange, min, max, step = 1, money = false }) {
  return (
    <div className="sliderrow">
      <label>{label}</label>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))} />
      <span className="val">{money ? '$' : ''}{value}</span>
    </div>
  )
}

export function Reveal({ q, children }) {
  return (
    <details className="reveal">
      <summary>{q}</summary>
      <div className="answer">{children}</div>
    </details>
  )
}

export function Formula({ children }) {
  return <pre className="formula">{children}</pre>
}

// Chip row linking a lesson to the engine: rule id, test fixture, manual page.
export function RuleRef({ rule, test, page }) {
  return (
    <div className="ruleref">
      {rule && <span className="rid">rules/cboe_baseline.yaml → {rule}</span>}
      {test && <span className="tname">{test}</span>}
      {page && <span className="mpage">Cboe manual {page}</span>}
    </div>
  )
}

export function Callout({ kind = 'note', label, children }) {
  const cls = kind === 'warn' ? 'callout warn' : kind === 'tip' ? 'callout tip' : 'callout'
  const lbl = label ?? (kind === 'warn' ? 'Trap' : kind === 'tip' ? 'Mental model' : 'Note')
  return (
    <div className={cls}>
      <span className="label">{lbl}</span>
      {children}
    </div>
  )
}

export function Stat({ k, v, note, tone }) {
  return (
    <div className={'stat' + (tone ? ' ' + tone : '')}>
      <div className="k">{k}</div>
      <div className="v">{v}</div>
      {note && <div className="note">{note}</div>}
    </div>
  )
}

export function Stats({ children }) {
  return <div className="bigstat">{children}</div>
}

export function Panel({ title, children }) {
  return (
    <div className="panel">
      {title && <div className="panel-title">{title}</div>}
      {children}
    </div>
  )
}

export function BuildLens({ title = 'Build-Next Lens', children }) {
  return (
    <div className="buildlens">
      <div className="buildlens-title">{title}</div>
      {children}
    </div>
  )
}

// A locked decision, taught: the fork as it stood, what was locked, and the
// domain reasoning. `doc` names the ADR file in docs/architecture/decisions/.
export function Decision({ id, doc, q, picked, children }) {
  return (
    <div className="panel">
      <div className="panel-title">{id} · {doc}</div>
      <p><strong>The fork:</strong> {q}</p>
      <p><strong>You locked:</strong> {picked}</p>
      {children}
    </div>
  )
}
