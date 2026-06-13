import { Callout, Formula, Reveal } from '../components/ui.jsx'

export default function M6() {
  return (
    <>
      <p>
        You now know enough margin to read the engine the way the team does. This module maps
        every domain concept onto the code so that when a decision fork shows up
        (“should this hard-error or NoRule?”), you can reason about it from first principles.
      </p>

      <h3>The evaluation pipeline</h3>
      <Formula>{`Position { U, class, lev, legs[] }
   │
   ▼  for each rule, in YAML order:
match.legs        → bindSlots: assign legs to named slots by (side, kind, option_type, venue)
match.constraints → CEL predicates over the binding (strikes, expiries, underlyings)
requires          → pre-formula guards: fields present, coverage, expiry ordering
   │                  • constraint miss → fall through to next rule
   │                  • requires miss   → hard, descriptive error (not silent fall-through)
   ▼  first rule that survives all three wins
formulas.{cash|margin}.{initial|maintenance}  → Requirement, AppliedProceeds, CashCall`}</Formula>
      <p>
        The division of labor matters: <strong>constraints decide “is this that strategy?”</strong>{' '}
        (a failed constraint just means try the next rule), while{' '}
        <strong>requires decides “do I have the data to price it safely?”</strong> (a failure
        there is a loud error naming the missing field). Mixing those up either hides data bugs
        as NoRule or turns benign non-matches into errors.
      </p>

      <h3>The verdict taxonomy — every outcome means something</h3>
      <table>
        <thead><tr><th>Outcome</th><th>Meaning</th><th>Is it a bug?</th></tr></thead>
        <tbody>
          <tr><td>Result with numbers</td><td>a rule matched and priced</td><td>only if the number is wrong</td></tr>
          <tr><td><code>permitted: false</code></td><td>structure is disallowed in this account type (short stock in cash)</td><td>no — a deliberate verdict</td></tr>
          <tr><td>NoRule</td><td>no rule claims this position (ratio spread, leveraged ETF stock)</td><td>no — refusing beats guessing; may mean “author a rule”</td></tr>
          <tr><td>Hard error</td><td>data problem: missing field, unknown rates class, reverse-calendar MPL</td><td>yes — in the input or the rulebook, never to be swallowed</td></tr>
        </tbody>
      </table>
      <Callout kind="tip">
        <p>
          The house philosophy in one line: <strong>a wrong number is worse than no number.</strong>{' '}
          Every guard, every hard error, every NoRule exists to convert “silently wrong” into
          “loudly absent.” When you design a new rule, your first question is not the formula —
          it's “what inputs would make this formula lie, and which guard catches each one?”
        </p>
      </Callout>

      <h3>Slot binding — why patterns must be uniquely attributed</h3>
      <p>
        <code>bindSlots</code> assigns concrete legs to a rule's named slots. Within one rule,
        slot patterns must differ on at least one attribute (side, kind, option_type, venue) —
        otherwise two legs could bind either way, constraints would see an arbitrary one, and
        evaluation stops being deterministic. This is the codebase invariant behind
        “slot patterns must be uniquely attributed” in CLAUDE.md: it's a determinism guarantee,
        not a style rule.
      </p>

      <h3>The requires vocabulary maps to the stock-hedges lessons</h3>
      <table>
        <thead><tr><th>Primitive</th><th>Domain meaning you now know</th></tr></thead>
        <tbody>
          <tr><td><code>required_fields</code> / <code>positive_fields</code></td><td>the formula reads it, so it must exist / be &gt; 0 (a zero proceeds would silently inflate CashCall)</td></tr>
          <tr><td><code>min_fields (shares ≥ qty×mult)</code></td><td>coverage arithmetic — the hedge must cover every contract priced against it (being superseded by exact coverage per corpus-remediation D1)</td></tr>
          <tr><td><code>same_across_slots (underlying)</code></td><td>shares of the wrong stock cover nothing</td></tr>
          <tr><td><code>expiration_slots / expiration_order</code></td><td>shared-expiry MPL soundness / the reverse-calendar trap</td></tr>
          <tr><td><code>same_contract_size</code></td><td>mixed multipliers (mini vs standard) break per-contract netting</td></tr>
        </tbody>
      </table>

      <h3>Decomposition — pricing a whole account</h3>
      <p>
        Real accounts aren't one strategy; they're 30 legs that <em>contain</em> strategies. The
        optimizer partitions the legs into rule-priceable groups and picks the partition with
        the <strong>lowest total requirement</strong> — the customer is entitled to the cheapest
        compliant interpretation. Pairing a short call with shares (covered, ~$0 for the call)
        instead of leaving it naked (~$2,000) is the optimizer earning its existence. It's
        branch-and-bound over partitions with a node budget — the only CPU-hungry path in the
        engine, and the part your pricing corpus doesn't yet exercise (<a href="#m16">the
        optimizer module</a> has the open work).
      </p>

      <h3>The proof chain in production — recon, end to end</h3>
      <p>
        Ground truth comes from outside, and since the sdk-only pivot the comparison itself runs
        at the integrating service. The contract is{' '}
        <code>docs/architecture/recon-oracle-spec.md</code>, and it's worth knowing at the
        mechanism level because it's where every correctness claim eventually lands:
      </p>
      <Formula>{`for each position the host priced:
  limen says R_l, the vendor says R_v
  ├─ both present, |R_l − R_v| ≤ tolerance (default: exact) → MATCH
  ├─ both present, differ → DIFF, bucketed by |delta|: <$1, <$100, <$1k, ≥$1k
  ├─ limen returned NoRule → NO_RULE      (coverage gap — author a rule or accept)
  └─ either side errored / absent → ERROR  (absent oracle is FATAL-loud, never $0)`}</Formula>
      <ul>
        <li><strong>The buckets are triage, not decoration.</strong> A &lt;$1 DIFF is a rounding
          convention; a ≥$1k DIFF is a methodology disagreement. Trend the buckets over nights and
          you can tell “we fixed something” from “the vendor changed something” without reading a
          single row.</li>
        <li><strong>One-sided layers.</strong> The account and house layers compare one-directionally
          with mandatory attribution — a house override on our side with no vendor counterpart must
          name itself, so policy deltas don't masquerade as engine bugs.</li>
        <li><strong>Fail-loud input guards.</strong> An absent vendor number is fatal for that row —
          zero-filling would manufacture MATCHes against $0. The spec inherits the engine's
          philosophy: silence is never a number. (After a night when the vendor half-fails — which
          happens — ERROR rows spike and that's <em>correct</em>; the report should say “oracle
          didn't show up,” not “everything diffs.”)</li>
      </ul>
      <p>
        The full verification ladder, weakest to strongest oracle: frozen self-output
        (regression only) → computable properties (mutation testing, the corpus's brute-force
        checks, the decompose oracle) → published spec (the manual fixtures) → second-party data
        (the vendor, through this spec). Every layer you've built sits somewhere on that ladder,
        and the ladder is why a recon DIFF starts an investigation rather than a panic: you
        check the stronger oracles first.
      </p>

      <h3>What's moving under this module — the open work</h3>
      <ul>
        <li><strong>Trace schema v2 (ROADMAP #21).</strong> Traces are additive-frozen on v1;
          accumulated wants (richer decomposition records, attribution detail) graduate together
          as a deliberate breaking bump — schema changes are batched, never dribbled.</li>
        <li><strong>Corpus remediation epic.</strong> The corpus findings (exact coverage, date
          validation, mixed-datedness errors) land as rule + guard changes whose done-signal is
          the corpus pins flipping — the drills in this app regenerate from the same data
          afterward.</li>
        <li><strong>The bridge.</strong> First production consumer: embeds <code>pkg/limen</code>,
          implements the recon spec against the vendor's EOD house calls, gated on your internal
          corpus testing. When it lights up, every concept in this module becomes a nightly
          report you'll actually read.</li>
      </ul>

      <h3>Reading order for the codebase</h3>
      <ol>
        <li><code>rules/cboe_baseline.yaml</code> top-to-bottom — you can now read every formula in it.</li>
        <li><code>internal/engine/types.go</code> — <code>Result</code> semantics doc comment.</li>
        <li><code>internal/engine/rulebook_test.go</code> — pick five <code>_p&lt;page&gt;</code> tests, hand-compute each before reading the assertion.</li>
        <li><code>internal/engine/env.go</code> — the CEL primitives (<code>mpl</code>, <code>is_limited_risk</code>, <code>short_*_req</code>).</li>
        <li><code>docs/architecture/recon-oracle-spec.md</code> — the comparison contract the bridge implements.</li>
      </ol>

      <h3>Self-check</h3>
      <Reveal q="A position hits vertical_spread, binds, passes constraints, but the short leg has no venue. What happens and why is that the right design?">
        <p>The <code>required_fields</code> guard hard-errors naming the slot and field. Falling
          through instead would mean a data-quality problem silently became “no rule matched” —
          and a position that <em>should</em> price as a cheap spread might price expensively as
          something else, or not at all, with no signal anyone would investigate.</p>
      </Reveal>
      <Reveal q="Why must specific rules sit above generic_limited_risk_combo, mechanically?">
        <p>First match wins. The catch-all matches any bounded 3–8-leg all-options position, so
          anything below it is unreachable for those shapes. Order in the YAML is precedence —
          which is why it's reviewed like code.</p>
      </Reveal>
      <Reveal q="The optimizer faces 1 short call + 150 shares. What partitions exist and which wins?">
        <p>(a) covered_call(100 sh + call) + long_stock(50 sh), or (b) naked call + long_stock(150).
          Partition (a) wins — the covered call zeroes the option's requirement. The 50 leftover
          shares still margin as stock either way. “Cheapest compliant partition” is the spec.
          (Note: under corpus-remediation D1's exact coverage, (a) is the <em>only</em> legal way
          to get covered treatment — submitting all 150 shares as one covered-call group is a
          typed refusal.)</p>
      </Reveal>
      <Reveal q="Recon shows 40 ERROR rows tonight, up from ~0. First hypothesis and first check?">
        <p>Hypothesis: the vendor's feed half-failed (their EOD pipeline is upstream-fragile), not
          an engine bug — engine errors are account-specific and persistent, vendor absence is
          run-wide and transient. First check: are the ERROR rows “vendor absent” or “limen
          errored”? The spec separates them precisely so this question takes one query.</p>
      </Reveal>
    </>
  )
}
