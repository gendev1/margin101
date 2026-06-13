import { useEffect, useState } from 'react'
import { MDXProvider } from '@mdx-js/react'

import { mdxComponents } from '@/components/mdx-components'
import { CourseNav } from '@/components/layout/CourseNav'
import { MarkComplete } from '@/components/layout/MarkComplete'
import { Masthead } from '@/components/layout/Masthead'
import { Sidebar } from '@/components/layout/Sidebar'
import { loadDone, recordVisit, saveDone } from '@/lib/store'
import { MODULES, MODULES_BY_SECTION, SECTIONS } from '@/modules'

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

  const toggleDone = (id: string) => {
    const next = { ...done, [id]: !done[id] }
    setDone(next)
    saveDone(next)
  }

  const Body = current.component
  const prev = idx > 0 ? MODULES[idx - 1] : null
  const next = idx < MODULES.length - 1 ? MODULES[idx + 1] : null

  return (
    <div className="relative z-[1] flex min-h-screen">
      <Sidebar sections={MODULES_BY_SECTION} modules={MODULES} currentId={current.id} done={done} />

      <main
        key={current.id}
        className="min-w-0 max-w-[1000px] flex-1 animate-rise px-14 pb-28 pt-11 max-[880px]:px-4 max-[880px]:pb-20 max-[880px]:pt-6"
      >
        <Masthead module={current} section={section} index={idx} />

        <article className="module-body">
          <MDXProvider components={mdxComponents}>
            <Body />
          </MDXProvider>
        </article>

        <CourseNav prev={prev} next={next} />

        {current.trackable !== false && (
          <MarkComplete
            title={current.title}
            checked={!!done[current.id]}
            onToggle={() => toggleDone(current.id)}
          />
        )}
      </main>
    </div>
  )
}
