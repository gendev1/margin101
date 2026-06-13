import { Callout, Formula, Reveal } from '@/components/shared'

export default function M24() {
  return (
    <>
      <p>
        <a href="#m20">Risk-based margin: the idea</a> taught the methodology. This module
        teaches <strong>portfolio margin as a product</strong> — because PM is not a formula, it
        is an <em>account regime</em>: a thing a customer applies for, a firm must be approved to
        offer, and an account can be ejected from. The mechanics of getting in, living in, and
        falling out of that regime are margin knowledge in their own right, and they're where
        the business risk actually lives.
      </p>

      <h3>Getting in — eligibility is the first risk control</h3>
      <table>
        <thead><tr><th>Gate</th><th>Typical shape</th><th>What it's protecting against</th></tr></thead>
        <tbody>
          <tr><td><strong>Minimum equity</strong></td><td>$100,000 regulatory floor (FINRA 4210(g)); houses commonly demand $125k–$250k</td><td>leverage this high on small accounts wipes out before anyone can react</td></tr>
          <tr><td><strong>Options approval + attestation</strong></td><td>highest options level; signed acknowledgment of PM risk</td><td>the regime assumes the customer understands short option tails</td></tr>
          <tr><td><strong>Firm approval</strong></td><td>the <em>broker</em> needs regulatory approval to offer PM at all — real-time risk monitoring capability is part of the bar</td><td>a firm that can only compute margin at EOD has no business offering 6:1 leverage</td></tr>
        </tbody>
      </table>
      <p>
        That last row deserves a beat: offering PM creates an <em>obligation on the firm's
        systems</em>. Intraday monitoring (<a href="#m19">the streaming module</a>) stops being a
        nice-to-have and becomes part of the regulatory posture. Product decisions create
        platform requirements — this is the cleanest example in the whole domain.
      </p>

      <h3>The leverage arithmetic — what the customer actually gets</h3>
      <Formula>{`same $100,000 of equity, long diversified stock:

Reg-T:   initial 50%        → max position ≈ $200,000   (2:1)
PM:      TIMS ≈ 15% worst    → max position ≈ $666,000   (~6.6:1)

and the cushion-burn rate scales the same way:
Reg-T:   market −10% → equity −$20k, requirement falls $10k   → cushion −$10k
PM:      market −10% → equity −$66k, requirement falls ~$10k  → cushion −$56k`}</Formula>
      <p>
        Read the second half twice — it's the part the sales page omits. Leverage doesn't just
        scale the upside; it scales how fast the cushion evaporates. A Reg-T account at 2:1 can
        sleep through a bad week. A PM account at 6:1 can go from healthy to liquidation in a
        session, which is <em>why</em> the regime requires the firm to watch it in real time.
      </p>

      <h3>Buying power without the SMA theatrics</h3>
      <p>
        PM accounts don't run on the <a href="#m17">SMA ratchet</a>. Buying power derives
        directly from <strong>excess equity over the PM requirement</strong>, recomputed as
        prices and the TIMS number move. Simpler conceptually — no high-water-mark memory — but
        operationally harder: where Reg-T buying power changes on <em>events</em> (deposits,
        trades), PM buying power changes <em>continuously with the market</em>. The ledger
        problem shrinks; the real-time problem grows. (For limen: the host's BP layer must be
        per-regime — same boundary, different formula feeding it.)
      </p>

      <h3>Falling out — the downgrade cliff (the part nobody warns about)</h3>
      <Formula>{`PM account, equity $110,000, hedged option book:
  TIMS requirement:           $45,000      → comfortable, excess $65k

equity drifts to $95,000 (below the $100k PM minimum):
  → firm must revert the account to Reg-T treatment
  Reg-T requirement, SAME book: $130,000   → deficiency −$35,000
  → margin call into a falling account, forced liquidation of
    positions that were fully compliant the day before`}</Formula>
      <Callout kind="warn">
        <p>
          The cliff is the regime's nastiest property: the requirement <em>methodology itself</em>{' '}
          flips at the eligibility boundary, so a falling account doesn't degrade smoothly — it
          steps off a ledge. The same positions, the same prices, a 3× requirement jump. Real
          desks manage this with early-warning bands above the minimum (the{' '}
          <a href="#m19">intraday warning-band machinery</a>, pointed at equity-vs-$100k instead
          of equity-vs-requirement) and by restricting new openings as the account approaches the
          line. For limen the lesson is architectural: <strong>account type is an input that
          selects the baseline</strong>, and a recon system must know which methodology an
          account was on <em>that day</em> — one more reason the bitemporal habits matter.
        </p>
      </Callout>

      <h3>Living in the regime — what changes day to day</h3>
      <ul>
        <li><strong>House add-ons bind harder.</strong> TIMS is the floor; every real PM offering
          layers <a href="#m25">add-ons</a> on top — concentration, liquidity, event risk —
          because the regulatory band assumption (±15%) is exactly the thing leverage amplifies.</li>
        <li><strong>Day trading interacts — and the rules just changed.</strong> The PDT
          designation and $25k minimum were eliminated June 4, 2026 (FINRA Notice 26-10):
          day-trading buying power is now based on <em>real-time intraday margin excess</em>,
          for PM and Reg-T accounts alike. The composed rules are house-specific during the
          18-month phase-in — workflow territory, not engine territory.</li>
        <li><strong>Recon runs per methodology.</strong> The vendor reports PM accounts under
          their TIMS implementation and Reg-T accounts under strategy rules; comparing across
          regimes is a category error the recon layer must refuse (one more verdict-taxonomy
          job).</li>
      </ul>

      <h3>Self-check</h3>
      <Reveal q="Why ~6.6:1 for PM stock leverage — where does the number come from?">
        <p>Max position = equity ÷ requirement rate. TIMS on a diversified single-stock position
          worst-cases around the 15% band edge → 1/0.15 ≈ 6.67. The leverage IS the band: narrow
          the assumed worst move and you've widened the allowed position. Every argument about PM
          leverage is secretly an argument about the band.</p>
      </Reveal>
      <Reveal q="An account sits at $103k equity, PM minimum $100k, TIMS req $40k. What should the firm's systems be doing right now?">
        <p>Treating it as <em>nearly critical despite the huge requirement cushion</em>. The
          binding constraint isn't equity-vs-requirement ($63k of room) — it's equity-vs-minimum
          ($3k of room to the methodology cliff, where the same book re-prices to ~3× under
          Reg-T). Warning bands must watch the eligibility line, restrict new openings, and brief
          the customer before the cliff, not after.</p>
      </Reveal>
      <Reveal q="Why is 'which methodology was this account on, on date X' a bitemporal question?">
        <p>Because regime membership changes (upgrades, downgrades, corrections backdated by
          ops), and a sealed recon or audit run from date X must replay under the methodology the
          account was actually on at X — even if the membership record was corrected afterward.
          Same valid-time/transaction-time machinery as overrides, applied to account state.</p>
      </Reveal>
    </>
  )
}
