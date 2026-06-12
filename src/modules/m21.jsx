import { Callout, Formula, Reveal } from '../components/ui.jsx'

export default function M21() {
  return (
    <>
      <p>
        When the cushion runs out, margin stops being mathematics and becomes{' '}
        <strong>operations</strong>: somebody must tell the customer, start a clock, track
        whether money arrives, and — if it doesn't — decide what to sell. This is the{' '}
        <strong>margin-call lifecycle</strong>: pure workflow software, host-owned on the map,
        with limen's <code>CashCall</code> as its triggering event. From zero, including the part
        most engineers never see: what actually happens on day 4.
      </p>

      <h3>The three species of call (commonly confused, importantly different)</h3>
      <table>
        <thead><tr><th>Call type</th><th>Triggered by</th><th>Typical deadline</th><th>Cured by</th></tr></thead>
        <tbody>
          <tr><td><strong>Fed call</strong> (Reg-T / initial)</td><td>a <em>purchase</em> made without enough SMA/cash — an initial-margin shortfall at trade time</td><td>~4 business days</td><td>cash or marginable securities only — market appreciation does <em>not</em> cure it</td></tr>
          <tr><td><strong>Maintenance call</strong></td><td>equity falling below the maintenance requirement (the engine's number, or the house's higher floor)</td><td>house policy, often 2–5 days</td><td>cash, securities, position reduction — and at many houses a market rebound <em>can</em> cure it</td></tr>
          <tr><td><strong>Day-trade call</strong> <em>(historical)</em></td><td>exceeding day-trading buying power under the old PDT rules — <strong>eliminated June 4, 2026</strong> (FINRA Notice 26-10); replaced by real-time intraday margin standards, 18-month phase-in</td><td>~5 business days (legacy)</td><td>cash only (legacy); under the new regime, intraday excess governs continuously</td></tr>
        </tbody>
      </table>
      <p>
        The cure column is the conceptual heart. A <strong>Fed call punishes an act</strong> —
        “you bought something you hadn't earned the right to buy.” The market later bailing the
        account out doesn't undo the act, so only money cures it. A <strong>maintenance call
        flags a state</strong> — “your cushion is currently too thin.” If the state recovers,
        the condition is gone. Once you hold that distinction, every house-policy difference in
        call handling becomes legible.
      </p>

      <h3>The state machine</h3>
      <Formula>{`deficiency detected (CashCall > 0 / equity < requirement)
        │
        ▼
   ISSUE CALL ──────────▶ OUTSTANDING (aging against its deadline)
   type, amount,              │
   due date, notify     ┌─────┼──────────────┬───────────────┐
                        ▼     ▼              ▼               ▼
                    deposit  securities   (maintenance    deadline
                    lands    delivered     only) market    passes
                        │     │            recovers          │
                        ▼     ▼              ▼               ▼
                       MET ◀──┴──────────────┘        FORCED LIQUIDATION
                        │                              broker sells to cure
                        ▼                                     │
                  back to normal                              ▼
                                                    repeat offenses →
                                                    RESTRICTIONS
                                                    (cash-up-front, 90-day
                                                     freeze, PM revoked)`}</Formula>

      <h3>A worked timeline — one call, end to end</h3>
      <Formula>{`Mon EOD   equity $8,900 vs maintenance requirement $9,400
          → deficiency $500 → maintenance call issued, due Thu
Tue       customer does nothing; stock flat       call OUTSTANDING (2 days left)
Wed       stock rallies; equity now $9,600 > req  house A: call auto-MET (state cured)
                                                  house B: call stands until cash arrives
Thu       (house B) no deposit by cutoff
          → liquidation desk sells $2,000 of stock
            (equity is unchanged — proceeds pay down the loan — but the
             requirement falls 25% of what's sold: $2,000 sold repairs the
             $500 cushion exactly. ~$4 sold per $1 repaired, which is why
             liquidations are partial, not total)`}</Formula>
      <p>
        Notice the two genuinely hard design points hiding in that timeline:
      </p>
      <ul>
        <li><strong>Cure policy is house policy.</strong> Whether Wednesday's rally cures the call
          is a firm decision, not regulation — which means the lifecycle system needs the same
          policy-vs-baseline separation as <a href="#m15">the overlay layer</a>: the trigger is
          universal, the handling is configured.</li>
        <li><strong>What to liquidate is a real decision.</strong> Selling the position with the
          highest requirement-per-dollar repairs the cushion fastest; selling the most liquid
          position is safest to execute; selling the customer's smallest lot is gentlest. Firms
          encode liquidation preference orders — and every choice must be defensible later, which
          drags the audit discipline (<a href="#m9">attribution, replayability</a>) into workflow
          land.</li>
      </ul>

      <h3>Where limen ends and this begins</h3>
      <p>
        limen's output is the <em>event</em>: this account, this timestamp, deficiency $500.
        Everything stateful — is there already an outstanding call for this account? does
        today's deficiency extend it or start a new one? did the deposit that arrived at 2pm
        cure the Tuesday call or the Wednesday one? — lives in the lifecycle system's database,
        not in any calculation. Two accounts with <em>identical</em> snapshots can be in
        different call states because of what happened last week; snapshot-in, snapshot-out
        cannot represent that, and shouldn't try.
      </p>
      <Callout kind="tip">
        <p>
          Classification (<a href="#m13">the playbook</a>): workflow/ops. The risks are
          operational — a call issued late, a deadline computed off the wrong calendar (T+4
          across a holiday…), a liquidation of the wrong lot — not mathematical. Its tests are
          state-machine tests: every transition reachable, no deficiency event ever dropped,
          deadlines correct across weekends/holidays, and an audit row for every state change.
          The margin <em>number</em> is the easy part here; the calendar is the hard part.
        </p>
      </Callout>

      <h3>Self-check</h3>
      <Reveal q="Equity dips below maintenance Tuesday, recovers Wednesday, dips again Thursday. One call or two — and why is the answer a design decision?">
        <p>Depends on the house's cure policy. If market recovery cures (house A): Tuesday's
          call is met Wednesday, Thursday starts a fresh call with a fresh deadline. If only
          money cures (house B): one call, still aging since Tuesday. Both are defensible;
          what's not defensible is the system being unable to say which model it implements —
          this is exactly the kind of fork the decision playbook wants written down before the
          code exists.</p>
      </Reveal>
      <Reveal q="Why does selling $2,000 of stock repair only ~$500 of a maintenance deficiency, not $2,000?">
        <p>The sale proceeds pay down the loan, so equity is unchanged — you swapped stock for
          loan reduction. What moves is the <em>requirement</em>: it drops by 25% of the sold
          market value, i.e. $500. So cushion repair ≈ $1 per $4 sold for plain stock — and the
          ratio differs per position type (selling a naked short's hedge can make things{' '}
          <em>worse</em>), which is why liquidation engines compute repair-per-dollar per
          position instead of guessing.</p>
      </Reveal>
      <Reveal q="A deposit arrives while two calls are outstanding (one Fed, one maintenance). Which does it cure first, and who decides?">
        <p>House policy again — but the safe default is oldest-and-strictest first (the Fed call,
          since only money can cure it and its consequences are regulatory). The deeper lesson:
          payment <em>application</em> is itself state-machine logic that must be deterministic
          and auditable; “the deposit just makes the account better” is not an implementation.</p>
      </Reveal>
    </>
  )
}
