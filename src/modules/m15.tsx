import { Callout, Formula, Reveal, RuleRef } from '../components/ui.jsx'

export default function M15() {
  return (
    <>
      <p>
        The baseline engine answers one question: <em>what does regulation require?</em> But your
        firm is allowed to be <strong>stricter</strong> than regulation — more cautious on penny
        stocks, nervous about one concentrated symbol, unwilling to let a risky account add
        exposure. The <strong>house overlay</strong> and <strong>targeted overrides</strong> are
        the machinery for that. This system is fully built (<code>internal/overlay</code>) and
        carries some of your most interesting locked decisions — but here we teach it from zero.
      </p>

      <h3>The two-layer cake</h3>
      <Formula>{`engine baseline   "Reg-T/Cboe requires $2,500"     ← citable law, universal
        +
house layer       "this firm wants at least $8,000"  ← firm policy, audited
        =
final requirement  max/sum per the rule's mode        ← what the customer sees`}</Formula>
      <p>
        Why two layers instead of editing the YAML? Because the two numbers answer to different
        authorities. The baseline must match the manual page — a regulator can check it. The
        house number answers to the firm's risk desk — it changes weekly, differs per symbol,
        per account, even per customer risk profile. Mixing them would make both unverifiable:
        you couldn't recon the baseline against the manual, and you couldn't audit policy changes
        without diffing margin formulas.
      </p>
      <Callout>
        <p>
          This module teaches the <em>machinery</em>. The actual policy content that flows
          through it — concentration charges, liquidity add-ons, hard-to-borrow surcharges,
          event floors, and where their numbers come from — is its own lesson:{' '}
          <a href="#m25">Add-ons in practice</a>, right after this one.
        </p>
      </Callout>

      <h3>The four modes — everything policy is allowed to do</h3>
      <table>
        <thead><tr><th>Mode</th><th>Meaning</th><th>Worked example (baseline $2,500 on $10,000 of stock)</th></tr></thead>
        <tbody>
          <tr><td><code>add</code></td><td>unconditional surcharge on top</td><td>“+5% of market value buffer” → 2,500 + 500 = <b>$3,000</b></td></tr>
          <tr><td><code>max</code> / <code>floor</code></td><td>raise to at least X</td><td>“floor 80% of MV” → max(2,500, 8,000) = <b>$8,000</b></td></tr>
          <tr><td><code>block</code></td><td>moves no dollars; flags the position as policy-violating</td><td>requirement stays $2,500, plus a recorded violation (“no new openings in XYZ”)</td></tr>
        </tbody>
      </table>
      <p>
        Notice what's missing: a <code>set</code> mode that could assign a number directly. That's
        deliberate and locked (<a href="#m8">your decisions: the number</a> has the full argument): every allowed mode can only{' '}
        <strong>raise</strong> the requirement above baseline. A mode that can lower it would let
        an override typo silently under-margin a whole symbol — and raise-only modes compose in
        any order (floors collapse to the biggest floor, adds sum), so the audit trail never
        depends on which rule fired first.
      </p>

      <h3>Overlay rules vs targeted overrides — who writes what</h3>
      <table>
        <thead><tr><th></th><th>House overlay rules</th><th>Targeted overrides</th></tr></thead>
        <tbody>
          <tr><td><strong>Authored by</strong></td><td>engineers, in YAML, code-reviewed</td><td>ops / risk desk, via the host's tooling, at runtime</td></tr>
          <tr><td><strong>Shape</strong></td><td>“all leveraged ETFs: floor 90% MV”</td><td>“symbol GME, this week: floor 100% MV”</td></tr>
          <tr><td><strong>Lifetime</strong></td><td>changes with releases</td><td>minutes to months; closed, never deleted</td></tr>
          <tr><td><strong>Storage</strong></td><td>versioned rulebook (content-hashed)</td><td>bitemporal Mongo store (below)</td></tr>
        </tbody>
      </table>
      <p>
        Same modes, same composition, different authors and cadence. The split exists because
        “our standing policy on leveraged products” and “we're nervous about one meme stock this
        week” have different owners, review processes, and lifespans — and the system records
        both as <code>HouseComponent</code>s with full attribution, so any final number can be
        decomposed into <em>baseline + named policy deltas</em>.
      </p>

      <h3>The time problem — why the store is bitemporal</h3>
      <p>
        Overrides change, and ops sometimes corrects them <em>retroactively</em> (“the GME floor
        should have been 100% since Monday”). Now replay an audit from Tuesday: should it see the
        correction? The store records two independent clocks per row to make this answerable:
      </p>
      <Formula>{`valid time   when the override is true in the world   (valid_from / valid_to)
txn time     when the store learned about it           (txn_time, append-only)

Tuesday's sealed run pinned (as_of = Tue, txn_cutoff = Tue 18:00).
Wednesday's backdated correction has txn_time = Wed > cutoff
  → excluded from Tuesday's replay (it reproduces exactly)
  → included in every run from Wednesday on`}</Formula>
      <p>
        And “delete” is a <em>valid-time close</em> (set <code>valid_to</code>), never a physical
        row removal — a sealed run may have legitimately used the row you'd be erasing. If this
        feels familiar: it's the same supersede-don't-edit discipline as your ADRs, enforced at
        the database layer.
      </p>

      <Callout kind="warn">
        <p>
          The failure mode this entire design prevents: a margin number that <em>cannot be
          explained after the fact</em>. Final requirement $11,400 — why? Without attribution and
          bitemporal seals the answer is archaeology. With them it's a query: baseline $2,500
          (rule <code>long_stock</code>) + floor to $8,000 (override <code>gme-floor-100</code>,
          v3, valid since Monday) + $3,400 account buffer (overlay rule <code>risk-tier-c</code>).
          Every dollar has an author.
        </p>
      </Callout>

      <RuleRef rule="internal/overlay (engine + ApplyOverrides)" test="rules/house_overlay.example.yaml" />

      <h3>Self-check</h3>
      <Reveal q="Baseline $1,200. Active policy: add 10% of MV ($800), floor $1,500, floor $2,300. Final number, and why is order irrelevant?">
        <p>Floors collapse to the biggest: max(1,500, 2,300) = 2,300 as the raise-to level →
          max(1,200, 2,300) = 2,300; then the add stacks: 2,300 + 800 = <strong>$3,100</strong>.
          Order can't matter because every mode is computed off the <em>basis</em> (market value,
          baseline) rather than off the running result — that's the locked composition rule, and
          it's what makes the audit stream readable.</p>
      </Reveal>
      <Reveal q="Ops wants to CUT the requirement on a negotiated account below baseline. What does the system say, and what's the honest path?">
        <p>It refuses — no mode can go below baseline, by locked decision. The honest paths:
          change the <em>baseline</em> if the regulation actually permits a lower number (a rule
          change, code-reviewed, citable), or accept that requirement reductions are a different,
          dangerous feature that needs its own design with its own guardrails — not a side effect
          of the override store.</p>
      </Reveal>
      <Reveal q="Why does a `block` rule still emit a component even though it moves no dollars?">
        <p>Because the components stream is the complete audit log of <em>every</em> policy that
          fired. A block that left no trace would mean the position's history reads clean even
          though policy intervened. Violations are surfaced separately for humans; components
          keep the math stream complete.</p>
      </Reveal>
    </>
  )
}
