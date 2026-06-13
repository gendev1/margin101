import { Callout, Formula, Reveal } from '../components/ui.jsx'

export default function M18() {
  return (
    <>
      <p>
        Every margin number so far was computed <em>after</em> the customer already held the
        position. The <strong>pre-trade check</strong> flips the direction: the customer hasn't
        traded yet — they've submitted an <em>order</em> — and the broker must answer in
        milliseconds: <em>if this fills, is the account still sound?</em> This is the margin
        feature customers actually feel (every “order rejected: insufficient buying power”
        message is one), it's gray on the map, and it's the most buildable gray box because the
        hard part already exists.
      </p>

      <h3>The mechanism — a subtraction of two snapshots</h3>
      <Formula>{`1. current state:    evaluate(account today)               → Req_now
2. projected state:  apply the order as if filled
                     evaluate(account + new position)       → Req_after
3. the delta:        ΔReq = Req_after − Req_now
4. the verdict:      ΔReq ≤ available capacity (SMA/BP/excess)?  approve : reject`}</Formula>
      <p>
        That's the whole idea: <strong>simulate the fill, price the simulated account, compare
        the delta to what the customer has.</strong> No new margin math — steps 1 and 2 are the
        same engine you already trust, run on a hypothetical input. The genuinely new pieces are
        plumbing: translating an <em>order</em> (side, qty, limit price) into a <em>projected
        position</em>, and knowing the account's available capacity — which is{' '}
        <a href="#m17">the SMA ledger</a>.
      </p>

      <h3>Worked, with numbers you already own</h3>
      <p>Account: excess equity $4,000. Order: <strong>sell 1 naked put, K=95, premium $1.50, U=100</strong>.</p>
      <Formula>{`Req_now    = (whatever the book requires today)        say $3,915
Req_after  = Req_now + naked-put requirement
           = 3,915 + (1.50 + max(20−5, 9.5)) × 100
           = 3,915 + 1,650
ΔReq       = $1,650   ≤   $4,000 available   →  APPROVE ✓

same order ×3:  ΔReq = $4,950  >  $4,000     →  REJECT ✗
                (or approve 2, reject the 3rd — house choice)`}</Formula>
      <p>
        Two subtleties that make this richer than it looks:
      </p>
      <ul>
        <li><strong>The delta isn't always positive.</strong> If the account already holds 100
          uncovered-priced shares and the order sells a call against them, the projected account
          pairs them (<a href="#m16">the optimizer</a> runs on the projection) and ΔReq can be{' '}
          <em>negative</em> — the order <em>frees</em> margin. A pre-trade check that only knows
          how to add would wrongly reject risk-<em>reducing</em> orders; running the full
          decomposition on the projection gets hedges right for free.</li>
        <li><strong>“Available capacity” is the ledger's number, not the engine's.</strong>{' '}
          Whether $4,000 is spendable depends on <a href="#m17">SMA</a>, open calls, and house policy
          (<a href="#m15">the overlay's</a> blocks fire here too — a <code>block</code> rule on a symbol is enforced
          at order time, which is the entire point of having it). Pre-trade is where three
          subsystems meet.</li>
      </ul>

      <h3>What-if — the same machine, pointed at humans</h3>
      <p>
        Expose the identical simulate-and-diff to the customer <em>before</em> they submit:
        “this iron condor will require $500 and your buying power becomes $3,500.” Same code
        path, different consumer. For the ops desk it answers “what happens to account X if we
        raise the GME floor to 100%?” — a policy what-if, simulating an override instead of an
        order. Once the simulate-project-diff seam exists, every “what would happen if…”
        question in the firm routes through it.
      </p>

      <h3>Why this is the most buildable gray box</h3>
      <Formula>{`latency budget for an order check:   ~10–50 ms acceptable
limen full evaluation:                ~0.12 ms  (benchmarked)
optimizer on a typical account:       ~5 ms     (benchmarked)
                                      ────────
engine cost is ~1/10th of budget — the work is plumbing:
order → projected position, capacity lookup, and the answer's audit trail`}</Formula>
      <Callout kind="tip">
        <p>
          The design risk isn't speed — it's <strong>consistency</strong>. The pre-trade answer
          must use the same rulebook version, same overrides, and same reference data as the EOD
          run, or a customer gets approved at 2pm for a position that's an instant margin call at
          the close. The fix is everything <a href="#m9">your system decisions</a> built: content-hashed rulebooks and pinned
          override coordinates make “evaluated under exactly which rules?” answerable for an
          order check the same way as for an audit. Purity wasn't academic — it's what makes the
          hypothetical evaluation <em>trustworthy</em>.
        </p>
      </Callout>

      <h3>Self-check</h3>
      <Reveal q="Account holds 100 sh XYZ priced standalone ($2,500 maint). Order: sell 1 XYZ call K=105. Sign of ΔReq and why?">
        <p>Negative (or ~zero): the projected account decomposes the shares + short call into a
          covered call — the call adds no requirement and maintenance shifts to
          0.25 × min(U, K) × 100, which at U=100/K=105 stays 2,500 but the call's premium arrives
          as proceeds. The order is risk-capping, and a correct pre-trade check approves it even
          with zero buying power. Add-only checkers get this wrong — which rejects exactly the
          orders a risk desk most wants customers to make.</p>
      </Reveal>
      <Reveal q="Why must the projection run the optimizer, not just price the new leg standalone?">
        <p>Because the new leg can change how <em>existing</em> legs group (pairing with shares,
          completing a spread). Pricing it standalone gets ΔReq wrong in both directions: too
          high for hedging orders (false rejects), and too low when the new leg breaks an
          existing pairing (false approves — the dangerous one).</p>
      </Reveal>
      <Reveal q="What's the worst failure mode of a pre-trade checker that uses yesterday's rulebook?">
        <p>Approve-then-call: the order passes at order time, then the same position fails the
          EOD run under the current rules — the customer was sold a position that was a margin
          call on arrival. Loud rejection at order time is annoying; silent approval into a call
          is a fiduciary problem. Same-version evaluation (hash-pinned) is the guard.</p>
      </Reveal>
    </>
  )
}
