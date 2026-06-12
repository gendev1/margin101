import { Callout, Formula, Reveal } from '../components/ui.jsx'

export default function M25() {
  return (
    <>
      <p>
        <a href="#m15">House overlay &amp; overrides</a> taught the <em>pipes</em>: modes,
        composition, the bitemporal store. This module is the <em>water</em> — the actual
        add-ons real risk desks run through those pipes, what each one protects against, and
        where the numbers come from. This is the domain content a risk manager would quiz you
        on, and none of it is in the Cboe manual: baselines are the regulator's floor;
        add-ons are the firm's actual risk appetite, expressed in dollars.
      </p>

      <h3>The catalog — eight add-ons that exist at every serious desk</h3>
      <table>
        <thead><tr><th>Add-on</th><th>Trigger</th><th>What it protects against</th><th>limen shape</th></tr></thead>
        <tbody>
          <tr><td><strong>Concentration</strong></td><td>one name &gt; X% of account equity</td><td>diversification assumptions failing — the whole account is one bet</td><td><code>add</code>, account scope</td></tr>
          <tr><td><strong>Liquidity</strong></td><td>position large vs daily volume</td><td>the liquidation itself moving the price against you</td><td><code>add</code>, symbol scope</td></tr>
          <tr><td><strong>Low-price / penny floor</strong></td><td>price &lt; $5</td><td>cheap stocks halving or doubling overnight</td><td><code>floor</code> % of MV</td></tr>
          <tr><td><strong>Hard-to-borrow short surcharge</strong></td><td>borrow rate / utilization high</td><td>recalls and squeezes — the short may be forced closed at the worst price</td><td><code>add</code> or <code>floor</code>, symbol</td></tr>
          <tr><td><strong>Event / binary-risk</strong></td><td>earnings, FDA dates, court rulings</td><td>gaps that ignore every band — the ±15% assumption dying on schedule</td><td>temporary <code>floor</code>, symbol</td></tr>
          <tr><td><strong>Leveraged-product multiplier</strong></td><td>lev ≠ 1.0 instruments</td><td>2× products moving 2× (and drifting) — beyond the baseline's lev scaling</td><td><code>floor</code>, instrument-kind</td></tr>
          <tr><td><strong>Stress overlay</strong></td><td>house scenario wider than the regulatory band (e.g. ±25%)</td><td>the band assumption itself (the PM module's warning, patched with money)</td><td><code>floor</code> at house-scenario loss</td></tr>
          <tr><td><strong>Sector / correlation cap</strong></td><td>net exposure to one sector &gt; X%</td><td>“diversified” books that are actually one macro bet in five costumes</td><td><code>add</code> or <code>block</code>, group scope</td></tr>
        </tbody>
      </table>

      <h3>Two of them worked, so the shapes are real</h3>
      <Formula>{`CONCENTRATION — account equity $100,000, policy: a single name above
25% of equity adds 10% of the excess to the requirement.

position: $80,000 of one stock
  excess over the 25% line: 80,000 − 25,000 = 55,000
  add-on: 10% × 55,000 = $5,500          (on top of the $20,000 baseline)
  → component: { mode: add, scope: account, basis: concentration_excess }

LIQUIDITY — policy: positions over 1 day-to-liquidate add 2%/extra day.
  position: 400,000 shares; ADV 1,000,000; max participation 20%
  days_to_liquidate = 400,000 / (1,000,000 × 0.20) = 2.0 days
  add-on: (2.0 − 1.0) × 2% × MV          — priced for the exit, not the holding`}</Formula>
      <p>
        Notice what both have in common: the trigger and the size are computed off{' '}
        <strong>facts about the position and account</strong> (equity share, ADV), not off the
        baseline requirement — which is exactly the basis-derived arithmetic that keeps
        composition order-independent (<a href="#m15">the overlay module</a>'s locked rule).
        The catalog is firm-specific; the discipline is universal.
      </p>

      <h3>Where the numbers come from (calibration is the real work)</h3>
      <ul>
        <li><strong>Historical worst moves</strong> — the penny floor's 100% and the event
          add-on's size come from someone tabulating what these things actually did: biotech
          FDA-date gaps, meme-squeeze magnitudes, post-earnings moves by market cap.</li>
        <li><strong>Liquidation cost studies</strong> — the liquidity add-on encodes measured
          market impact: what did it cost us to unwind the last forced liquidation of this size?</li>
        <li><strong>Risk appetite, written down</strong> — “no single account may put more than
          $X of firm capital at risk in a 3-sigma day” cascades down into the concentration and
          stress numbers. The add-on is the appetite statement, compiled to dollars.</li>
        <li><strong>Quarterly review</strong> — appetites drift, markets change regime, and the{' '}
          bitemporal store is what makes “what was the policy last March, and who changed it” a
          query instead of an argument.</li>
      </ul>

      <Callout kind="tip">
        <p>
          <strong>Margin policy is a competitive product surface.</strong> Too strict and active
          traders leave for the broker with better leverage; too loose and one squeeze eats a
          year of commissions. Every row in the catalog is a dial the business turns under
          pressure from both sides — which is precisely why add-ons live in an ops-editable,
          audited, raise-only store instead of in the engine's YAML. The baseline answers to the
          regulator; the add-ons answer to the P&amp;L. Keep them in separate rooms.
        </p>
      </Callout>

      <h3>The discipline that keeps the catalog honest</h3>
      <ul>
        <li><strong>Attributable</strong> — every applied add-on emits a named component, so a
          $31,400 requirement decomposes into baseline + concentration + HTB + event, each with
          an owner. A number that can't be decomposed can't be defended — to the customer or the
          regulator.</li>
        <li><strong>Raise-only</strong> — no add-on may go below baseline (the <code>set</code>-mode
          argument from <a href="#m8">your decisions</a>). Relief is a different, rarer, more
          dangerous feature with its own approvals.</li>
        <li><strong>Temporary by default</strong> — event add-ons carry <code>valid_to</code>{' '}
          (the earnings date passes, the floor expires). An add-on without an expiry is a policy;
          an add-on with one is a reaction. The store treats both as first-class.</li>
        <li><strong>Tested like code</strong> — a policy change replays against yesterday's book
          before it ships: “this new concentration rule would have moved 1,200 accounts by a
          median $400” is a one-evaluation what-if (<a href="#m18">the same machinery</a> as
          pre-trade, pointed at policy).</li>
      </ul>

      <h3>Self-check</h3>
      <Reveal q="The desk asks: 'charge extra for meme stocks with high short interest.' Classify it: which add-on type, mode, scope?">
        <p>Hard-to-borrow / squeeze-risk surcharge: trigger = borrow utilization or short
          interest above a threshold; shape = <code>floor</code> or <code>add</code> at symbol
          scope, sized off short-side market value; probably temporary (squeeze conditions pass).
          The follow-up question that earns respect: “what data feed tells us short interest,
          how stale is it, and what happens when it's missing?” — every add-on imports a data
          dependency, and missing-data behavior must be loud, as always.</p>
      </Reveal>
      <Reveal q="Why is the stress overlay an overlay floor rather than a change to the TIMS band?">
        <p>The TIMS band is the published, comparable methodology — widen it inside the engine
          and your baseline stops reconciling against the vendor and the OCC. The house's wider
          scenario is policy expressed as a floor over the citable number: baseline stays
          comparable, fear stays attributable, and the recon stream can tell them apart. Same
          boundary as penny floors over Reg-T, at a bigger scale.</p>
      </Reveal>
      <Reveal q="Concentration uses account scope while HTB uses symbol scope. Why does the scope follow the risk?">
        <p>Concentration is a property of the <em>account's composition</em> — the same $80k
          position is fine inside a $1M account and dangerous inside a $100k one, so the trigger
          needs account-level facts. HTB risk is a property of the <em>symbol</em> — the borrow
          market doesn't care whose account holds the short. Scope isn't a technical choice;
          it's where the risk actually lives, and getting it wrong either misses the risk or
          charges the wrong people.</p>
      </Reveal>
    </>
  )
}
