import { Callout, Formula, Reveal, RuleRef } from '../components/ui.jsx'

export default function M14() {
  return (
    <>
      <p>
        Core Mechanics priced one <em>position</em> at a time. A real customer has many positions,
        plus cash, plus a loan from the broker. <strong>Account aggregation</strong> is the step
        that rolls position-level results into one account-level picture — and it's where words
        like <em>equity</em> and <em>excess</em> get their precise meanings. This is a built
        system (<code>internal/account</code>), but nobody ever taught it. From zero, now.
      </p>

      <h3>The five quantities (learn these cold)</h3>
      <div className="anatomy">
        <div className="card"><div className="sym">LMV</div><div className="name">Long market value</div>
          <div className="desc">Current value of everything you own: long stock + long option value. Always ≥ 0.</div></div>
        <div className="card"><div className="sym">SMV</div><div className="name">Short market value</div>
          <div className="desc">Current cost to close everything you're short. Carried as a negative number — it's value you owe.</div></div>
        <div className="card"><div className="sym">cash / debit</div><div className="name">Cash balance</div>
          <div className="desc">Positive = uninvested cash sitting in the account. Negative (a “debit balance”) = the margin loan the broker extended you.</div></div>
        <div className="card"><div className="sym">equity</div><div className="name">Equity</div>
          <div className="desc">LMV + SMV + cash. The customer's own money at stake — what's left if everything were closed right now.</div></div>
        <div className="card"><div className="sym">excess</div><div className="name">Excess equity</div>
          <div className="desc">equity − maintenance requirement. The cushion. Negative excess = margin call territory.</div></div>
      </div>

      <h3>One account, worked end to end</h3>
      <p>
        Customer holds three positions; the engine has already priced each (<a href="#m6">the
        engine</a>'s pipeline, once per position):
      </p>
      <table>
        <thead><tr><th>Position</th><th>Market value</th><th>Maintenance req (engine)</th></tr></thead>
        <tbody>
          <tr><td>200 sh ABC @ $50</td><td>+$10,000 (LMV)</td><td>0.25 × 10,000 = $2,500</td></tr>
          <tr><td>Covered call: 100 sh XYZ @ $40 + short 35C @ $6</td><td>+$4,000 stock, −$600 option</td><td>0.25 × min(40,35) × 100 = $875</td></tr>
          <tr><td>Short 1 naked put DEF K=20 @ $1.50, U=19.50</td><td>−$150 (SMV)</td><td>$540 (the p.28 number)</td></tr>
        </tbody>
      </table>
      <Formula>{`LMV    = 10,000 + 4,000            = $14,000
SMV    = −600 − 150                = −$750
cash   = −6,000  (debit balance — the broker financed part of the stock)

equity = 14,000 − 750 − 6,000      = $7,250
maintenance requirement = 2,500 + 875 + 540 = $3,915
excess equity = 7,250 − 3,915      = $3,335   ✓ comfortable`}</Formula>
      <p>
        Read what each line is doing. <strong>Aggregation adds; it never re-prices.</strong> The
        account requirement is the sum of position requirements the engine already produced.
        Equity is pure arithmetic over market values and the cash line. There is no judgment in
        this layer — which is precisely what makes it trustworthy and testable.
      </p>
      <Callout kind="tip">
        <p>
          <strong>Sign conventions are the whole battle here.</strong> SMV negative, debit balance
          negative, short option premium received as negative MV. Get one sign wrong and equity is
          silently off by 2× that line. That's why the aggregation tests lock LMV/SMV conventions
          explicitly — an accounting identity (equity = LMV + SMV + cash, always) is the layer's
          invariant, and every test asserts it.
        </p>
      </Callout>

      <h3>Why this layer is deliberately boring</h3>
      <ul>
        <li><strong>It's pure.</strong> Same position evaluations + same balances → same account
          numbers, byte-for-byte. No clock, no state, no I/O — same discipline as the engine
          (<a href="#m9">your system decisions</a>), so the account number is replayable too.</li>
        <li><strong>It's the comparison point.</strong> When the vendor sends an EOD <em>house
          call</em> for an account, what gets compared is this layer's output: total requirement
          and the call amount. Position-level recon localizes a bug; account-level recon is the
          number the business actually runs on.</li>
        <li><strong>It is NOT a ledger.</strong> Aggregation answers “what is the account's state
          right now, given these inputs?” It has no memory of yesterday. The thing with memory —
          SMA and buying power — is <a href="#m17">its own module</a>, and confusing the two is
          the classic mistake (it opens with exactly why).</li>
      </ul>

      <h3>What feeds it and what reads it</h3>
      <Formula>{`positions ──▶ engine (one Result each) ──┐
balances (cash, debit, proceeds) ────────┼──▶ Aggregate ──▶ { LMV, SMV, equity,
                                         │                   total requirement,
house overlay & overrides ◀─────────────┘                   excess / deficiency }
                                                                  │
                                              deficiency < 0 ──▶ margin-call workflow`}</Formula>
      <RuleRef rule="internal/account/aggregate.go" test="TestShortPutShortStockMaintenance_p47 (the inline arithmetic)" />

      <h3>Self-check</h3>
      <Reveal q="Account: LMV $30,000, SMV −$2,000, debit balance −$12,000, total maintenance req $9,100. Equity and excess?">
        <p>Equity = 30,000 − 2,000 − 12,000 = <strong>$16,000</strong>. Excess = 16,000 − 9,100 ={' '}
          <strong>$6,900</strong>. No call — the cushion is healthy.</p>
      </Reveal>
      <Reveal q="Same account, market drops: LMV falls to $22,000 and the requirement falls to $7,100. Now?">
        <p>Equity = 22,000 − 2,000 − 12,000 = $8,000; excess = 8,000 − 7,100 = <strong>$900</strong>.
          Notice both moved: equity fell with the market AND the requirement fell (it's 25% of a
          smaller value). The cushion shrank from $6,900 to $900 — equity falls dollar-for-dollar
          while the requirement falls at 25 cents per dollar. That 4:1 ratio is why drops eat
          cushions fast.</p>
      </Reveal>
      <Reveal q="Why must aggregation never re-price a position 'while it's at it'?">
        <p>Because then two layers would own pricing, and a recon DIFF could live in either —
          undebuggable. One layer prices (engine), one layer adds (aggregation), one layer
          policies (overlay). Every number has exactly one author; that's what makes the proof
          chain in <a href="#m6">the engine</a> possible.</p>
      </Reveal>
    </>
  )
}
