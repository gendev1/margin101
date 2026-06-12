import { Callout, Formula, Reveal } from '../components/ui.jsx'

export default function M20() {
  return (
    <>
      <p>
        Everything in Core Mechanics is <strong>strategy-based margin</strong>: recognize the
        shape, apply the cited formula. There is a second, completely different philosophy —{' '}
        <strong>risk-based margin</strong> — and it's important enough to get three modules.
        This one is the idea itself: what changes, who gets it, why the numbers drop, and what
        assumption buys all of that. The next module is the TIMS machinery in detail; the third
        is the futures world's version. No prior knowledge assumed.
      </p>

      <h3>Two philosophies, one question</h3>
      <p>
        Both methodologies answer the broker's question from <a href="#m0">the language</a> — “how much customer money
        must stand behind this position?” They disagree about what to <em>measure</em>:
      </p>
      <table>
        <thead><tr><th></th><th>Strategy-based (Reg-T / Cboe)</th><th>Risk-based (portfolio margin)</th></tr></thead>
        <tbody>
          <tr><td><strong>Core move</strong></td><td>name the structure, look up its formula</td><td>forget names — simulate bad markets, charge the worst loss</td></tr>
          <tr><td><strong>Unit of analysis</strong></td><td>each strategy separately; account = sum</td><td>the whole portfolio per underlying, valued together</td></tr>
          <tr><td><strong>Risk estimate</strong></td><td>fixed percentages (20%, 50%) set by rule</td><td>actual simulated P&amp;L across defined market moves</td></tr>
          <tr><td><strong>Source of truth</strong></td><td>a citable manual page</td><td>a methodology + a pricing model + market data</td></tr>
          <tr><td><strong>Blind spot</strong></td><td>over-charges hedged books (structure list is finite)</td><td>blind beyond its shock band; model risk</td></tr>
        </tbody>
      </table>
      <p>
        A one-line caricature that's basically accurate: strategy-based margin asks{' '}
        <em>“what is this?”</em>; risk-based margin asks <em>“what would this lose?”</em>
      </p>

      <h3>Why hedged accounts pay so much less under risk-based</h3>
      <Formula>{`account: long 100 sh XYZ @ $100  +  long 1 protective put K=95

strategy-based:  protective-put rule (still generous): maintenance ≈ $1,800
risk-based:      worst loss if XYZ drops 15%? stock −1,500, put gains ≈ +1,000
                 worst simulated loss ≈ $500  →  that IS the requirement

same position. ~3–4× difference. Multiply across a hedged book.`}</Formula>
      <p>
        Strategy-based rules credit hedges only where a rule <em>names</em> the pairing —
        and always through conservative fixed percentages. Risk-based valuation nets{' '}
        <em>everything in the underlying automatically</em>: the hedge helps exactly as much as
        it would actually help, because the measurement is a simulation, not a classification.
        That's the entire commercial pitch of <strong>portfolio margin accounts</strong>, and
        why active options traders migrate to them.
      </p>

      <h3>Who actually gets this — the eligibility reality</h3>
      <ul>
        <li><strong>It's an account type, not a flag.</strong> Portfolio margin is offered under
          FINRA 4210(g): minimum account equity (commonly $100,000+, house-set, often higher),
          an options-knowledge attestation, and house approval. Drop below the minimum and the
          account reverts to Reg-T treatment.</li>
        <li><strong>It coexists with strategy-based.</strong> A firm runs both methodologies
          side by side forever — Reg-T accounts on the rulebook, PM accounts on TIMS. This is why
          limen's planned architecture (a <em>swappable baseline</em> under the same{' '}
          <a href="#m15">overlay layer</a>) is right: the methodology is per-account, the policy
          layer is universal.</li>
        <li><strong>Brokers gate it for self-protection.</strong> Lower requirements mean more
          leverage on the same equity; the broker's tail risk grows. Houses respond with their
          own add-ons <em>on top of</em> TIMS (<a href="#m25">the add-on catalog</a>) — which
          land in exactly the policy layer you already built. The full account regime —
          eligibility, the leverage arithmetic, the downgrade cliff — is{' '}
          <a href="#m24">its own module</a>.</li>
      </ul>

      <h3>The assumption that pays for everything</h3>
      <Callout kind="warn">
        <p>
          Risk-based margin charges for the worst loss <strong>inside a defined band</strong> —
          ±15% for single stocks, roughly −8%/+6% for broad indexes. Moves beyond the band are{' '}
          <em>structurally invisible to the requirement</em>. A 40% single-stock gap (earnings
          fraud, biotech trial) blows straight through a PM account's collateral in a way a
          Reg-T account's flat 20%+premium cushion partially anticipated. That's the trade:
          sharper measurement inside the band, bought by assuming the band. Every house add-on
          (concentration charges, per-contract minimums, stress overlays) is someone patching
          that assumption after living through an exception. When you eventually review a TIMS
          epic, the band — not the model — is where the risk conversation should start.
        </p>
      </Callout>

      <h3>What this does to verification (the part that matters for limen)</h3>
      <p>
        A strategy-based number is right because page 28 says so — exact match, greppable. A
        risk-based number is right because the model, the volatility inputs, and the grid were
        all right. Two consequences you'll meet again in the TIMS module:
      </p>
      <ul>
        <li><strong>The oracle changes species:</strong> from exact-match worked examples to
          tolerance-banded comparison (two correct implementations legitimately differ by cents)
          plus invariants that must hold exactly — a hedge must never margin worse than its naked
          leg, more adverse shocks must never produce smaller requirements.</li>
        <li><strong>The recon spec was written for this day:</strong> its comparison semantics are
          methodology-agnostic and its delta buckets absorb tolerance naturally. The decision to
          keep recon methodology-blind (<a href="#m9">your system decisions</a>) was this module's
          foreshadowing.</li>
      </ul>

      <h3>Self-check</h3>
      <Reveal q="Why does risk-based margin barely change the requirement for a single naked short call, while transforming it for a collar?">
        <p>The naked call has nothing to net against — its worst-in-band loss is just “the stock
          rallies 15%,” roughly what the 20%-stress formula already charged. The collar's three
          legs offset each other almost perfectly inside the band, and simulation <em>sees</em>{' '}
          that netting while strategy rules only approximate it through fixed percentages.
          Risk-based margin's discount is proportional to how hedged you really are.</p>
      </Reveal>
      <Reveal q="A firm wants to offer PM accounts but is nervous about gap risk in meme stocks. Which layer holds the fix, and why is it NOT the TIMS engine?">
        <p>The house policy layer: a concentration add-on or per-symbol floor on top of the TIMS
          baseline. The TIMS methodology is a published standard — editing it makes your numbers
          incomparable with the OCC's and every vendor's. The baseline stays citable; the fear
          lives in the overlay, exactly like penny-stock floors over Reg-T. Same boundary,
          new methodology.</p>
      </Reveal>
      <Reveal q="Why must the two methodologies run side by side forever, rather than risk-based replacing strategy-based?">
        <p>Because methodology is per-account-type, set by regulation and eligibility: Reg-T
          accounts must get Reg-T numbers; PM accounts get TIMS. A margin platform is therefore
          a multi-baseline system by definition — which is why “TIMS as a swappable baseline
          under one policy layer” is the only architecture that doesn't fork the whole stack.</p>
      </Reveal>
    </>
  )
}
