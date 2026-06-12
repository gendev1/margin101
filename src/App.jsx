import { useEffect, useState } from 'react'
import { MODULES, MODULES_BY_SECTION, SECTIONS } from './modules/index.jsx'
import { loadDone, saveDone, recordVisit } from './lib/store.js'

export default function App() {
  const [hash, setHash] = useState(window.location.hash || '#home')
  const [done, setDone] = useState(loadDone)

  useEffect(() => {
    const onHash = () => {
      setHash(window.location.hash || '#home')
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const current = MODULES.find(m => `#${m.id}` === hash) ?? MODULES[0]

  useEffect(() => { recordVisit(current.id) }, [current.id])

  const idx = MODULES.findIndex(m => m.id === current.id)
  const section = SECTIONS.find(s => s.id === current.section) ?? SECTIONS[0]

  const toggleDone = id => {
    const next = { ...done, [id]: !done[id] }
    setDone(next)
    saveDone(next)
  }

  const Body = current.component
  const prev = idx > 0 ? MODULES[idx - 1] : null
  const next = idx < MODULES.length - 1 ? MODULES[idx + 1] : null

  return (
    <>
      <nav className="sidebar">
        <div className="brandblock">
          <h1>margin<span>101</span></h1>
          <div className="tagline">the living handbook of the limen margin system</div>
        </div>

        {MODULES_BY_SECTION.map(sec => (
          <div key={sec.id} className="sectiongroup">
            <div className="sectiontitle">{sec.label}</div>
            <div className="navcluster">
              {sec.modules.map(m => {
                const n = MODULES.findIndex(x => x.id === m.id)
                return (
                  <a key={m.id} href={`#${m.id}`}
                    className={'navitem' + (current.id === m.id ? ' active' : '') + (done[m.id] ? ' done' : '')}>
                    <span className="num">{String(n).padStart(2, '0')}</span>
                    <span className="navcopy">
                      <span className="navtitle">{m.title}</span>
                    </span>
                  </a>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <main className="main">
        <header className="masthead">
          <div className="page-kicker">{section.label} · {String(idx).padStart(2, '0')}</div>
          <h2>{current.title}</h2>
          <div className="subtitle">{current.subtitle}</div>
        </header>

        <Body />

        <div className="course-nav">
          {prev ? (
            <a href={`#${prev.id}`} className="course-nav-link">
              <span>← Previous</span>
              <strong>{prev.title}</strong>
            </a>
          ) : <div />}
          {next ? (
            <a href={`#${next.id}`} className="course-nav-link next">
              <span>Next →</span>
              <strong>{next.title}</strong>
            </a>
          ) : <div />}
        </div>

        {current.trackable !== false && (
          <div className="donebox">
            <input type="checkbox" id="done" checked={!!done[current.id]} onChange={() => toggleDone(current.id)} />
            <label htmlFor="done">Mark “{current.title}” complete</label>
          </div>
        )}
      </main>
    </>
  )
}
