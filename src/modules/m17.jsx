import { Callout, Formula, Reveal } from '../components/ui.jsx'

export default function M17() {
  return (
    <>
      <p>
        Everything before this module computes <em>requirements</em> — how much equity must be
        present. This module is about a different question the manual keeps gesturing at:{' '}
        <em>how much can the customer buy next?</em> That's <strong>buying power</strong>, it's
        governed by a strange Reg-T bookkeeping device called the <strong>SMA</strong>, and it is
        the single most misunderstood object in margin. limen deliberately doesn't compute it —
        by the end of this page you'll know exactly why.
      </p>

      <h3>What SMA literally is</h3>
      <p>
        <strong>SMA — the Special Memorandum Account</strong> — is not money. It's a{' '}
        <em>memo line</em> the broker keeps next to your account: a running record of borrowing
        entitlement you've earned. Think of it as a tab of “credit you've established and haven't
        spent yet.” It goes up when value flows your way; it goes down only when you{' '}
        <em>use</em> it. Crucially — and this is the part that breaks everyone's intuition —{' '}
        <strong>it does not go down when the market drops.</strong>
      </p>
      <table>
        <thead><tr><th>SMA increases when…</th><th>SMA decreases when…</th></tr></thead>
        <tbody>
          <tr><td>you deposit cash (dollar-for-dollar)</td><td>you buy securities (by the initial requirement, usually 50%)</td></tr>
          <tr><td>you sell stock (50% of proceeds)</td><td>you withdraw cash (dollar-for-dollar)</td></tr>
          <tr><td>dividends land</td><td><em>that's it. Market moves never reduce it.</em></td></tr>
          <tr><td>the market rises (excess over 50% can be journaled in)</td><td></td></tr>
        </tbody>
      </table>
      <Formula>{`buying power (Reg-T marginable stock) = SMA × 2    // initial req is 50%
buying power (options, non-marginable) = SMA × 1    // paid in full — no leverage
withdrawable cash                       ≈ SMA        // entitlement is also cash access`}</Formula>

      <h3>Four days in the life of one account (work through this slowly)</h3>
      <Formula>{`Day 1  deposit $10,000                    SMA = 10,000   BP = 20,000
       buy $20,000 of stock              SMA −10,000 → 0
       (loan = 10,000, equity = 10,000 = exactly 50%)

Day 2  stock rises to $24,000
       equity = 24,000 − 10,000 = 14,000
       50% of MV = 12,000 → excess = 2,000 → journaled to SMA
                                          SMA = 2,000    BP = 4,000

Day 3  stock falls back to $20,000
       equity = 10,000, excess = 0 …
       but SMA STAYS at 2,000  ◀── the ratchet. Once earned, never
                                    taken back by the market.

Day 4  buy $4,000 more stock using SMA   SMA −2,000 → 0
       loan = 14,000, MV = 24,000, equity = 10,000 = 41.7%`}</Formula>
      <p>
        Stop at Day 4 and stare: the account is at <strong>41.7% equity — below the Fed's 50%
        initial requirement — and this is completely legal.</strong> No call, no violation.
        Initial margin applies to <em>each purchase</em> (funded here by SMA, the entitlement
        earned on Day 2), not to the account's standing state. The only hard floor on standing
        state is the 25% maintenance requirement. The popular belief that “your account must
        always be at 50%” is simply false, and SMA's ratchet is why.
      </p>
      <p>
        Why does the ratchet exist at all? It's a deliberate regulatory kindness with a logic:
        the customer <em>demonstrated</em> they had collateral at the high-water mark, and Reg-T
        chose “entitlement once earned is durable” over “entitlement marks to market.” The cost
        of that kindness is that buying power can exceed what the current account state would
        justify — which is exactly the risk the 25% maintenance floor (and house floors above
        it) exist to backstop. SMA giveth; maintenance taketh away.
      </p>

      <h3>Why limen cannot own this (and what must)</h3>
      <Callout kind="warn">
        <p>
          Day 4's answer depends on Day 2's high-water mark — on <em>history</em>. limen is a
          pure function over a snapshot: same input, same output, no memory (that purity is what
          makes replay and recon possible — <a href="#m9">your system decisions</a>). A ledger
          with a ratchet is the opposite kind of object: its whole value <em>is</em> its memory.
          Computing “SMA ≈ excess equity × something” from a snapshot would be confidently wrong
          the day after any market dip — the silent-wrong-number failure mode applied to buying
          power. So the boundary is locked: limen emits requirement events; a host-side ledger
          (plane 5 on <a href="#m11">the map</a>, not built) accumulates them into SMA and
          buying power.
        </p>
      </Callout>
      <p>
        And because it's a ledger, its <em>verification</em> is a different discipline too. There
        is no manual page that says what this account's SMA is — the oracle is{' '}
        <strong>event-sequence invariants</strong>: replay the deposits, trades, and marks from
        inception and the ledger must reproduce its own balance; SMA must never decrease without
        a use-event; every decrease must trace to a purchase or withdrawal. Errors here are
        accounting bugs (a missed dividend credit, a double-counted journal), caught by
        replayable bookkeeping — which is why the bitemporal habits from{' '}
        <a href="#m15">the override store</a> are the right instincts to carry over.
      </p>

      <h3>Self-check</h3>
      <Reveal q="Deposit $6,000, buy $12,000 stock same day. SMA, loan, equity?">
        <p>SMA: +6,000 then −6,000 (50% of the purchase) → <strong>0</strong>. Loan = 6,000.
          Equity = 12,000 − 6,000 = 6,000 = exactly 50%. Buying power now zero — fully deployed.</p>
      </Reveal>
      <Reveal q="That stock rises to $16,000, then falls back to $12,000. What survived the round trip?">
        <p>At the peak: equity = 10,000, 50% of MV = 8,000, excess = 2,000 → SMA = 2,000. After
          the fall: equity back to 6,000, excess 0 — but <strong>SMA is still 2,000</strong>{' '}
          (ratchet). The customer can buy $4,000 of stock with no new cash, taking the account
          legally below 50%. The high-water mark is spendable.</p>
      </Reveal>
      <Reveal q="Same SMA of $2,000 — why is it $4,000 of stock buying power but only $2,000 of options buying power?">
        <p>Buying power = SMA ÷ initial requirement rate. Marginable stock requires 50% → ×2.
          Options must be paid in full (100%) → ×1. One entitlement, different leverage per
          asset class — which is why “buying power” without naming the asset class is an
          ambiguous number.</p>
      </Reveal>
      <Reveal q="Why is 'SMA ≈ excess equity' wrong, and when does the difference bite?">
        <p>They agree only while the account sits at its high-water mark. After any dip, SMA
          (ratcheted) exceeds excess equity (marked to market). A system that derives BP from
          excess equity under-grants after dips — annoying; one that derives SMA from a snapshot
          after the dip over-grants — dangerous. The difference IS the history; no snapshot
          recovers it.</p>
      </Reveal>
    </>
  )
}
