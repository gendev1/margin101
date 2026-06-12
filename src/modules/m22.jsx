import PayoffChart from '../components/PayoffChart.jsx'
import { Callout, Formula, Reveal } from '../components/ui.jsx'

export default function M22() {
  return (
    <>
      <p>
        The previous module gave you the philosophy; this one is the machine.{' '}
        <strong>TIMS — the Theoretical Intermarket Margining System</strong> — is the OCC's
        implementation of risk-based margin, the methodology behind every portfolio-margin
        account in US equities. We build it up in the order the computation actually runs:
        group → shock → reprice → net → worst node → add-ons.
      </p>

      <h3>Step 1 — group by class, not by strategy</h3>
      <p>
        TIMS first buckets the account into <strong>class groups</strong>: everything on the
        same underlying (the stock, all its options) margins together. Related groups join{' '}
        <strong>product groups</strong> where the methodology grants partial cross-underlying
        offsets — SPX index options against SPY ETF positions, for example, at a defined
        percentage rather than 1:1 (the indexes are 90%+ correlated, not identical). This is the
        “Intermarket” in the name, and it replaces the entire slot-binding/strategy-recognition
        layer: no covered calls, no verticals, no names at all. Just exposures to an underlying.
      </p>

      <h3>Step 2 — the shock grid</h3>
      <Formula>{`for each class group, define equally-spaced valuation points across a band:

single stocks / narrow ETFs:    −15% … +15%
broad-based indexes:             −8% … +6%     (down > up: crashes are sharper)
(10 points per side typical; concentration & house policy can widen)`}</Formula>
      <p>
        Why are indexes narrower? Diversification: a single biotech can halve overnight; the
        S&amp;P 500 moving 15% in a day has happened a handful of times in a century. And the
        asymmetry (−8 vs +6) encodes that equity markets crash <em>down</em>, not up. These
        bands are the methodology's load-bearing assumption — the previous module's warning
        about “inside the band” lives exactly here.
      </p>

      <h3>Step 3 — reprice every position at every node (the hard part)</h3>
      <p>
        At each grid node, every option must be valued <em>as of the margin horizon</em> — one
        day ahead, not at expiry. A 30-day option at a −15% node is still a 29-day option
        there, carrying time value. So TIMS needs a <strong>theoretical pricing model</strong>{' '}
        (Black-Scholes-family) and the model needs inputs:
      </p>
      <Formula>{`option value at node = f( shocked U′, K, time remaining, RATES, DIVIDENDS,
                          IMPLIED VOLATILITY at that strike/expiry )
                                            └── the "vol surface": a fitted grid of
                                                market-implied vols per (K, expiry),
                                                per underlying, refreshed daily`}</Formula>
      <p>
        TIMS also shocks the vol itself (markets that drop get more volatile — valuing the −15%
        node at calm-market vol would understate option prices there). This is the precise point
        where the discipline changes: <strong>limen's correctness would for the first time
        depend on a market-data pipeline</strong> (plane 3 of <a href="#m11">the map</a>), not
        just on positions and a rulebook.
      </p>

      <h3>Step 4 — worked grid #1: naked short put</h3>
      <Formula>{`short 1 put K=100 @ $3, U=100   (collected $300)

node      U′      intrinsic     P&L (intrinsic)    P&L (with time value*)
−15%      85      15.00         −1,200             ≈ −1,400
−10%      90      10.00           −700             ≈   −850
 −5%      95       5.00           −200             ≈   −330
  0%     100       0.00           +300             ≈   +120
+5%…+15%           0.00           +300             ≈ +150…+290

TIMS requirement = worst node ≈ $1,400      Reg-T strategy-based: $2,300

* model-priced: at the −15% node the put still has ~29 days of time value,
  so it's worth MORE than intrinsic → bigger loss. Intrinsic-only is a floor.`}</Formula>
      <p>
        Two readings of the same table. The customer's: $1,400 beats $2,300 — portfolio margin
        is cheaper even for a <em>naked</em> short. The engineer's: the answer moved when we
        switched valuation methods. Intrinsic-only under-margins by ~$200 here, and by much more
        for longer-dated options. <strong>The model is not a refinement; it's the number.</strong>
      </p>

      <h3>Step 5 — worked grid #2: the hedge nets automatically</h3>
      <PayoffChart
        legs={[
          { kind: 'put', side: -1, K: 100, P: 3 },
          { kind: 'put', side: 1, K: 90, P: 1 },
        ]}
        lo={75} hi={120}
        annotations={[{ u: 85, label: '−15% node' }, { u: 115, label: '+15%' }]}
        title="Short 100P / long 90P — the grid values both legs together at every node" />
      <Formula>{`add: long 1 put K=90 @ $1   (paid $100)

node      short 100P      long 90P      net P&L (intrinsic)
−15%      −1,200          +400            −800     ◀── worst node
−10%        −700           +(−100)→ ~0    −700…−800 region
  0%        +300           −100           +200

TIMS ≈ $800        strategy-based vertical (gross − proceeds): also ≈ $800 cash

…the same answer here — because the spread rule's MPL logic IS a tiny
risk-based calculation. TIMS generalizes that idea to any combination,
priced with a real model, without needing the structure to have a name.`}</Formula>

      <h3>Step 6 — add-ons, minimums, concentration</h3>
      <ul>
        <li><strong>Per-contract minimums</strong> — e.g. a floor of $0.375 × index multiplier per
          option, so a “riskless” book never margins to zero (model humility, encoded).</li>
        <li><strong>Concentration</strong> — a portfolio that is one giant single-name bet gets its
          band widened or a surcharge; diversification was the argument for narrow bands, so its
          absence must cost something.</li>
        <li><strong>House add-ons</strong> — the firm's own floors and stress overlays
          (<a href="#m25">the add-on catalog</a>), applied in the policy layer
          (<a href="#m15">overlay &amp; overrides</a>) on top of the TIMS baseline, never
          inside it.</li>
      </ul>

      <h3>What building this means for limen — the epic, honestly scoped</h3>
      <table>
        <thead><tr><th>Workstream</th><th>What it is</th><th>New discipline?</th></tr></thead>
        <tbody>
          <tr><td>Grid engine</td><td>class groups, shock nodes, worst-node selection</td><td>no — deterministic, testable, very limen-shaped</td></tr>
          <tr><td>Pricing model</td><td>Black-Scholes-family with dividends/rates, American-exercise handling</td><td><strong>yes</strong> — numerical code, convergence, edge cases</td></tr>
          <tr><td>Vol surface pipeline</td><td>daily fitted surfaces per underlying, staleness guards</td><td><strong>yes</strong> — a market-data dependency with quality gates</td></tr>
          <tr><td>Verification</td><td>OCC reference values within tolerance + exact invariants (hedge ≤ naked, monotonic in shock, offsets bounded)</td><td><strong>yes</strong> — tolerance design becomes part of the contract</td></tr>
          <tr><td>Recon</td><td>tolerance-banded DIFF instead of exact-match</td><td>no — the spec's buckets already absorb it</td></tr>
        </tbody>
      </table>
      <Callout kind="warn">
        <p>
          The trap, named once more because it's the expensive one: <strong>TIMS is not “more
          rules.”</strong> Treat it as a bigger YAML file and you'll transcribe a methodology
          that cannot be transcribed — the answers come from a model evaluated on data, not from
          formulas evaluated on fields. The epic's first deliverable should be the{' '}
          <em>oracle design</em> (reference values, tolerances, invariants), before any pricing
          code exists. That's the same discipline that built the corpus — applied to a system
          where exactness is no longer on the menu.
        </p>
      </Callout>

      <h3>Self-check</h3>
      <Reveal q="Why does the grid need ~10 nodes per side instead of just the two band edges?">
        <p>Because with options the worst loss isn't always at the extremes. A short straddle
          loses at <em>both</em> edges but a short butterfly loses most in the <em>middle</em>;
          multi-leg books have interior worst points wherever short gamma concentrates. The
          interior nodes exist to catch payoffs whose minimum sits between the edges — the
          grid is a sampling of a curve, not a two-point check.</p>
      </Reveal>
      <Reveal q="Why is intrinsic-only valuation a floor on the true requirement for short options — and when is the gap biggest?">
        <p>At every node a live option is worth intrinsic + remaining time value; for a short
          position, higher value = bigger loss, so intrinsic understates every node's loss. The
          gap is biggest for long-dated, near-the-money options (maximum time value) and in
          shocked-vol scenarios — precisely the nodes that tend to be the worst ones. The
          simplification fails exactly where it matters most, which is why it's a teaching
          device and not a methodology.</p>
      </Reveal>
      <Reveal q="Two correct TIMS implementations disagree by $11 on a large account. Walk the triage.">
        <p>First: is $11 inside the agreed tolerance band for an account this size? If yes —
          done, that's what tolerance means. If no: check invariants (does either violate
          hedge-≤-naked or shock monotonicity? that one's buggy); then diff inputs — same vol
          surface snapshot, same dividends, same rates? Nine times in ten it's an input-pin
          difference, which is why every input must be content-hashed into the trace exactly
          like rulebooks are today (<a href="#m9">same playbook</a>).</p>
      </Reveal>
    </>
  )
}
