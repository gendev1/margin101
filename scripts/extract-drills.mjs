// Extracts drill cases from limen's corpus testdata into src/data/corpus-drills.json.
// Run: bun scripts/extract-drills.mjs [path-to-testdata]
// Default source: the test-corpus-1000 worktree. Every answer in the output
// is oracle-derived and mutation-validated in the limen repo — this script
// only selects and reshapes, never computes.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'fs'
import { join, basename } from 'path'
import { parseAllDocuments } from 'yaml'

const SRC = process.argv[2] ??
  `${process.env.HOME}/wt/margincalc/test-corpus-1000/internal/corpus/testdata`
const OUT = new URL('../src/data/corpus-drills.json', import.meta.url).pathname

const COMPUTE_PER_FILE = 30
const VERDICT_PER_FILE = 8

// Deterministic stride-sample: sorted by name, pick evenly spaced entries so
// the subset spans the family's whole grid instead of clustering.
function sample(arr, n) {
  if (arr.length <= n) return arr
  const out = []
  const step = arr.length / n
  for (let i = 0; i < n; i++) out.push(arr[Math.floor(i * step)])
  return out
}

const compute = []
const verdict = []
for (const file of readdirSync(SRC).filter(f => f.endsWith('.yaml')).sort()) {
  const family = basename(file, '.yaml')
  const docs = parseAllDocuments(readFileSync(join(SRC, file), 'utf8'))
  const cases = docs.flatMap(d => d.toJS() ?? [])

  const computable = cases
    .filter(c => c.outcome === 'match' && !c.oracle_disagrees &&
      c.requirement != null && c.proceeds != null)
    .sort((a, b) => a.name.localeCompare(b.name))
  for (const c of sample(computable, COMPUTE_PER_FILE)) {
    compute.push({
      family, name: c.name, account: c.account, phase: c.phase,
      position: c.position, rule: c.rule,
      requirement: c.requirement, proceeds: c.proceeds,
      cashCall: +(c.requirement - c.proceeds).toFixed(4),
      depositKind: c.deposit_kind ?? null,
    })
  }

  // Verdict drills: spread across outcome classes within the family.
  const byOutcome = new Map()
  for (const c of cases) {
    if (c.oracle_disagrees) continue
    const k = c.outcome
    if (!byOutcome.has(k)) byOutcome.set(k, [])
    byOutcome.get(k).push(c)
  }
  const perClass = Math.max(1, Math.floor(VERDICT_PER_FILE / byOutcome.size))
  for (const [, arr] of [...byOutcome.entries()].sort()) {
    arr.sort((a, b) => a.name.localeCompare(b.name))
    for (const c of sample(arr, perClass)) {
      verdict.push({
        family, name: c.name, account: c.account, phase: c.phase,
        position: c.position, outcome: c.outcome, rule: c.rule ?? null,
        errContains: c.err_contains ?? null,
      })
    }
  }
}

mkdirSync(new URL('../src/data/', import.meta.url).pathname, { recursive: true })
writeFileSync(OUT, JSON.stringify({
  generatedFrom: SRC,
  note: 'answers are oracle-derived + mutation-validated in limen; do not edit by hand',
  compute, verdict,
}, null, 1))
console.log(`compute drills: ${compute.length}, verdict drills: ${verdict.length} -> ${OUT}`)
