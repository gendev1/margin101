import { Callout, Formula, Reveal } from '../components/ui.jsx'

export default function M23() {
  return (
    <>
      <p>
        Everything so far lives in the equities world. Futures are a different country with
        different margin law, and their methodology — <strong>SPAN</strong> — is the
        scenario-grid idea again, but with one enormous practical difference that changes what
        “implementing it” even means. First futures margin from zero (it's genuinely different),
        then SPAN itself.
      </p>

      <h3>Futures margin is a different kind of thing</h3>
      <p>
        Buying stock costs money; buying a <em>future</em> costs nothing — it's a binding
        agreement to transact later at today's agreed price. So futures “margin” isn't a down
        payment on a purchase. It's a <strong>performance bond</strong>: a good-faith deposit
        proving you can absorb the contract's daily swings.
      </p>
      <table>
        <thead><tr><th></th><th>Equities (Reg-T world)</th><th>Futures</th></tr></thead>
        <tbody>
          <tr><td><strong>What margin is</strong></td><td>equity backing a loan / an obligation</td><td>a performance bond held by the clearinghouse</td></tr>
          <tr><td><strong>Who sets it</strong></td><td>Fed + FINRA + exchange + house</td><td>the exchange (CME etc.), per contract, in dollars</td></tr>
          <tr><td><strong>Daily mechanics</strong></td><td>unrealized P&amp;L floats in equity</td><td><strong>variation margin</strong>: P&amp;L settles in CASH every single day</td></tr>
          <tr><td><strong>Typical size</strong></td><td>50% of position value</td><td>3–12% of notional — leverage is the product</td></tr>
        </tbody>
      </table>
      <p>
        That daily cash settlement (“mark-to-market”) is why futures margin can be so much
        smaller than equity margin: the clearinghouse never lets losses accumulate. Yesterday's
        loss was already paid in cash this morning; the bond only needs to cover{' '}
        <em>roughly one more bad day</em>. Margin size ≈ horizon of un-settled risk — the same
        principle that made long-dated options better collateral than short-dated ones, wearing
        a different coat.
      </p>

      <h3>SPAN — the same grid idea, published as data</h3>
      <p>
        <strong>SPAN</strong> (Standard Portfolio Analysis of Risk, CME, 1988 — since evolved
        into SPAN 2) computes the bond for a portfolio of futures and options-on-futures. Like
        TIMS: shock, revalue, worst case. Unlike TIMS in one decisive way:{' '}
        <strong>the exchange publishes the entire calculation as data files.</strong>
      </p>
      <Formula>{`the 16 SPAN scenarios (per contract family):
  price moves:  0, ±1/3 range, ±2/3 range, ±full range   (7 levels)
  × vol moves:  up, down                                  (×2 = 14)
  + 2 extreme scenarios: ±2× range (charged at ~35% weight)

the exchange's DAILY RISK PARAMETER FILE contains, per contract:
  the price-scan range ($), vol-scan range, every option's value
  in all 16 scenarios (the "risk array"), spread charges, credits

scanning risk = worst scenario loss across the portfolio's risk arrays
+ inter-month spread charge   (long Mar / short Jun ≠ riskless: curve risk)
+ short option minimum        (deep-OTM shorts never margin to ~zero)
− inter-commodity credit      (crude vs heating oil: defined % offset)
= SPAN requirement`}</Formula>
      <p>
        Read the consequence carefully: the exchange computed every option's value in every
        scenario <em>for you</em> and ships it nightly. Implementing SPAN is therefore mostly{' '}
        <strong>faithfully consuming files</strong> — parse the risk parameter file, look up
        your positions' arrays, sum scenario columns across the portfolio, take the worst,
        apply the listed charges and credits. No pricing model on your side, no vol surface
        pipeline. Where TIMS implementation risk is <em>“is the model right?”</em>, SPAN
        implementation risk is <em>“did you parse a 30-year-old fixed-width file format
        correctly and apply the right charge in the right order?”</em> — data engineering, not
        quantitative modeling.
      </p>

      <h3>Worked miniature — one risk array</h3>
      <Formula>{`crude oil future, price-scan range = $4,000/contract
position: short 1 call on that future (exchange's published array, $ loss):

scenario:    price  −4k   −2.7k  −1.3k    0    +1.3k  +2.7k  +4k    vol
loss:               −800   −560   −210   +150   +700  +1,600 +2,700  ↑/↓ variants…
                                                              ────
portfolio of 1 position → scanning risk = worst column = $2,700
+ short option minimum (say $250 floor — already exceeded, no-op)
= SPAN requirement ≈ $2,700`}</Formula>
      <p>
        With more positions you sum each scenario column <em>across</em> positions first, then
        take the worst total — which is exactly how netting happens (your long future's +$4,000
        in the up-scenario cancels the short call's loss there). Same offsetting magic as TIMS,
        delivered by column addition over published arrays.
      </p>

      <h3>The strategic call for limen — buy, build, or skip</h3>
      <ul>
        <li><strong>Skip</strong> while the product has no futures: SPAN is pure scope until then.
          On <a href="#m11">the map</a> it's the one box explicitly marked optional.</li>
        <li><strong>If futures arrive</strong>, the honest decision inputs: clearing brokers and
          vendors already compute SPAN on every account nightly (you may only need to{' '}
          <em>reconcile</em> against it — a recon-spec problem, already your strength); the
          file-consumption work is unglamorous but bounded; SPAN 2's migration is ongoing
          industry-wide, so any build must track a moving format.</li>
        <li><strong>The architecture cost is low either way:</strong> like TIMS, SPAN is just
          another baseline producing a requirement per account under the same policy layer —
          the swappable-baseline design absorbs it without new seams.</li>
      </ul>

      <Callout kind="tip">
        <p>
          Classification (<a href="#m13">the playbook</a>): TIMS is a <em>numerical model</em>{' '}
          problem; SPAN is a <em>data plane</em> problem; futures variation margin is a{' '}
          <em>stateful ledger</em> problem (daily cash settlement is bookkeeping —{' '}
          <a href="#m17">SMA's cousin</a>). Three systems that look like one “futures margin”
          bucket from a distance, classifying into three different disciplines up close — the
          playbook earning its keep.
        </p>
      </Callout>

      <h3>Self-check</h3>
      <Reveal q="Why can a futures performance bond be 5% when stock margin is 50%?">
        <p>Variation margin settles all P&amp;L in cash daily, so the bond only covers ~one day
          of un-settled move (the scan range), not the accumulated drift of an open-ended loan.
          Smaller un-settled horizon → smaller bond. The 50% stock number carries days-to-weeks
          of unrealized swing plus loan risk; the 5% future carries one day.</p>
      </Reveal>
      <Reveal q="Why does SPAN charge an inter-month spread (long Mar / short Jun crude) instead of treating it as flat?">
        <p>The two contracts track the same commodity but different delivery dates — the price{' '}
          <em>curve</em> between them can twist (storage, seasonality, supply shocks at one
          horizon). Scanning risk alone would net them to ~zero because both arrays move
          together under parallel shocks; the spread charge re-introduces the curve risk the
          parallel scenarios can't see. It's the SPAN version of “the hedge isn't perfect just
          because the underlying matches.”</p>
      </Reveal>
      <Reveal q="Your firm adds micro futures for customers. What's the first build decision, per this module?">
        <p>Whether to compute SPAN at all — or consume the clearing broker's nightly SPAN and
          build only the recon + ledger sides (verify their number per the recon spec; handle
          variation-margin cash flows in the account ledger). Given SPAN is published data and
          vendors are mature, compute-it-yourself needs a justification like intraday
          requirements or pre-trade checks on futures — otherwise it's the rare case where the
          oracle is so standardized that consuming beats building.</p>
      </Reveal>
    </>
  )
}
