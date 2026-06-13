import { ArrowRight } from 'lucide-react'

import { Callout, Panel, Reveal } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { DAILY_GOAL, lastVisit, loadDrills, weakestFamilies } from '@/lib/store'
import { MODULES } from '@/modules'

export default function Home() {
  const visit = lastVisit()
  const lastMod = visit && visit.id !== 'home' ? MODULES.find(m => m.id === visit.id) : null
  const weak = weakestFamilies(loadDrills())

  return (
    <>
      {lastMod && (
        <div className="my-1 mb-4.5 flex items-center justify-between gap-4 rounded-xl border border-input bg-[linear-gradient(135deg,_color-mix(in_oklch,var(--primary)_12%,transparent),_transparent_55%)] bg-card px-5 py-4">
          <div>
            <div className="text-xs text-muted-foreground">Continue where you left off</div>
            <div className="mt-0.5 font-display text-lg font-semibold">{lastMod.title}</div>
          </div>
          <Button asChild variant="default">
            <a href={`#${lastMod.id}`}>resume <ArrowRight className="size-3.5" /></a>
          </Button>
        </div>
      )}

      <div className="my-3.5 mb-2 grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-3">
        <Panel className="m-0" title="Drills">
          <p className="text-sm">
            The fastest way to make any module stick: a handful of corpus drills against the
            family you just read.
          </p>
          <Button asChild>
            <a href="#m10">go to drills <ArrowRight className="size-3.5" /></a>
          </Button>
        </Panel>
        <Panel className="m-0" title="Your weakest families">
          {weak.length ? (
            <ul className="ml-4.5 text-sm">
              {weak.map(w => <li key={w.fam}><code>{w.fam}</code> — {w.pct}% over {w.total}</li>)}
            </ul>
          ) : (
            <p className="text-sm">Answer a few drills and the families that need work show up here.</p>
          )}
        </Panel>
        <Panel className="m-0" title="The deal">
          <p className="text-sm">
            This isn't a course to finish — it's the handbook you keep open beside the repo.
            Mechanics teach the math, the decision modules teach <em>your own</em> locked calls,
            drills make both automatic, and the map tells you what to build next.
          </p>
        </Panel>
      </div>

      <h3>Route me fast</h3>
      <table>
        <thead><tr><th>If the live question is…</th><th>Start here</th><th>Why</th></tr></thead>
        <tbody>
          <tr><td>“What does this symbol / formula even mean?”</td><td><a href="#m0">The language</a> → <a href="#m2">single legs</a></td><td>vocabulary, payoff pictures, the 20%/10% formula</td></tr>
          <tr><td>“Is this baseline regulation or house policy?”</td><td><a href="#m15">House overlay</a></td><td>the two-layer cake and the raise-only modes</td></tr>
          <tr><td>“Is this rule, optimizer, or host behavior?”</td><td><a href="#m6">The engine</a></td><td>that is the seam map</td></tr>
          <tr><td>“Is this bounded, sound, safe to genericize?”</td><td><a href="#m1">Payoffs</a>, <a href="#m3">time</a>, <a href="#m5">catch-all</a></td><td>tails, expiry ordering, then is_limited_risk</td></tr>
          <tr><td>“Can I trust this vendor diff?”</td><td><a href="#m6">The engine</a>, <a href="#m9">system decisions</a></td><td>verdicts, recon buckets, replay boundaries</td></tr>
          <tr><td>“How does the account-level number come together?”</td><td><a href="#m14">Aggregation</a></td><td>LMV/SMV/equity worked end to end</td></tr>
          <tr><td>“Why did the optimizer group it that way?”</td><td><a href="#m16">The optimizer</a></td><td>B&amp;B from zero, with the $1,700 example</td></tr>
          <tr><td>“What's buying power?” / “why did a call fire?”</td><td><a href="#m17">SMA</a> / <a href="#m21">call lifecycle</a></td><td>the ratchet ledger; the call state machine</td></tr>
          <tr><td>“Would this order pass? Can we warn earlier?”</td><td><a href="#m18">Pre-trade</a>, <a href="#m19">intraday</a></td><td>simulate-the-fill; the warning band</td></tr>
          <tr><td>“What would portfolio margin change?”</td><td><a href="#m20">The idea</a> → <a href="#m24">the account</a> → <a href="#m22">TIMS</a></td><td>philosophy, the regime, then the grid machinery</td></tr>
          <tr><td>“What add-ons should the house run, and why?”</td><td><a href="#m25">Add-ons in practice</a></td><td>the catalog, worked dollars, calibration</td></tr>
          <tr><td>“Do we need to care about futures?”</td><td><a href="#m23">SPAN</a></td><td>the buy-vs-build reality check</td></tr>
          <tr><td>“Where does the next roadmap item belong?”</td><td><a href="#m13">Playbook</a> then <a href="#m11">the map</a></td><td>classify first, then place it</td></tr>
        </tbody>
      </table>

      <h3>Three study loops that fit real days</h3>
      <div className="my-3.5 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
        <Panel className="m-0" title="15 min — before a decision">
          <ul>
            <li>Name the live fork in one sentence.</li>
            <li>Read the matching mechanics section (use the routing table).</li>
            <li>Run the <a href="#m13">playbook</a>'s seven questions against it.</li>
          </ul>
        </Panel>
        <Panel className="m-0" title="30 min — keep the streak">
          <ul>
            <li>{DAILY_GOAL} drills in <a href="#m10">corpus drills</a>, weakest family first.</li>
            <li>One wrong answer → reread only that section, not the module.</li>
          </ul>
        </Panel>
        <Panel className="m-0" title="90 min — proof loop">
          <ul>
            <li>Hand-derive one rule from <code>cboe_baseline.yaml</code>.</li>
            <li>Read its locked decision in <a href="#m8">08</a>/<a href="#m9">09</a>.</li>
            <li>Drill that family until it's ≥85% green.</li>
          </ul>
        </Panel>
      </div>

      <Callout kind="tip">
        <p>
          The meta-goal: when the next subsystem shows up you can say “this is a search problem,”
          “this is a stateful ledger,” or “this needs a new oracle type” — instead of feeling that
          it's hard in some vague way. Vocabulary plus drills is how intuition becomes defensible.
        </p>
      </Callout>

      <h3>Self-check</h3>
      <Reveal q="Best first page when deciding whether something belongs in limen or in the host?">
        <p><a href="#m6">The engine</a> for the seam map, then <a href="#m9">your system decisions</a> for
          the SDK boundary locks. That pair resolves most ownership questions.</p>
      </Reveal>
      <Reveal q="What does this app add if intuition is already strong?">
        <p>It converts implicit judgment into named categories — silent-wrong-number risk, oracle type,
          ownership boundary — so a decision you'd have taken anyway becomes one you can defend, teach,
          and supersede honestly.</p>
      </Reveal>
    </>
  )
}
