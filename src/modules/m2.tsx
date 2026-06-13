import { ShortOptionCalc } from '@/components/labs'
import { Callout, Formula, Reveal, RuleRef } from '@/components/shared'

export default function M2() {
  return (
    <>
      <p>
        Now we price the atoms. Four families: long stock, short stock, long options, short
        options. Everything more complex is built by combining these and then arguing about
        how much the combination <em>reduces</em> the risk.
      </p>

      <h3>Long stock — the 50/25 baseline</h3>
      <RuleRef rule="long_stock" test="TestLongStockInitial_RegT" />
      <Formula>{`initial     = 0.50 × U × shares     // Reg T: finance at most half
maintenance = 0.25 × U × shares     // FINRA 4210: keep 25% equity`}</Formula>
      <p>
        Buy $10,000 of stock in a margin account: post $5,000, borrow $5,000. From then on your
        equity must stay above 25% of current market value. These two percentages are the
        anchors the whole system hangs off — you'll see <code>0.50</code> and <code>0.25</code>
        reappear inside every stock-containing structure.
      </p>

      <h3>Short stock — gross convention + the tier floor</h3>
      <RuleRef rule="short_stock" test="TestShortStockMaintenance_FiveDollarFloorBinds" />
      <p>
        Shorting stock means selling shares you borrowed. The sale <em>proceeds</em> stay in the
        account as collateral, and you post 50% on top:
      </p>
      <Formula>{`initial     = short_sale_proceeds + 0.50 × U × shares
maintenance = U × shares + (U < $5  ? max($2.50 × shares, U × shares)
                                    : max($5.00 × shares, 0.30 × U × shares))`}</Formula>
      <p>
        Note the shape: <strong>gross</strong> — the full current value of the shares
        (<code>U × shares</code>, what it costs to buy them back) plus a cushion. The cushion has
        a low-price regime: under $5 the per-share floors dominate because cheap stocks can
        double overnight; above $5 it's the larger of $5/share or 30%. The locked-in
        proceeds are credited via <code>AppliedProceeds</code>, so a short that moves against
        you surfaces the mark-to-market loss in <code>CashCall</code> automatically.
      </p>
      <Reveal q="Worked: short 100 shares at $12 (proceeds $1,200). Initial and maintenance at U=12?">
        <p>Initial = 1200 + 0.50 × 12 × 100 = <strong>$1,800</strong>; CashCall = 1800 − 1200 = $600.</p>
        <p>Maintenance = 12 × 100 + max($500, 0.30 × 1200 = $360) = 1200 + 500 = <strong>$1,700</strong>
          (the $5/share floor binds — 30% would only be $360).</p>
      </Reveal>

      <h3>Long options — pay in full, with one wrinkle</h3>
      <RuleRef rule="long_option_short_dated / long_option_long_dated_listed" />
      <p>
        A long option can't lose more than its premium, so the requirement is simply the
        premium: <code>P0 × qty × mult</code>, in cash or margin alike. The wrinkle:
        options with <strong>more than 9 months</strong> to expiry are durable enough that listed
        ones get <em>loan value</em> — the requirement drops to{' '}
        <strong>75% of current market value</strong>, i.e. the broker will finance a quarter of it.
        The threshold lives in the YAML as{' '}
        <code>constants.long_option_loan_value_threshold_months: 9</code>.
      </p>
      <Callout>
        <p>
          Why 75% on long-dated but 100% on short-dated? An option near expiry can evaporate in
          days — terrible collateral. A two-year option behaves more like the stock itself, so
          it can support a little credit. “How fast can this collateral vanish?” is the question
          behind most of the manual's special cases.
        </p>
      </Callout>

      <h3>Short options — the 20%/10% formula (memorize this one)</h3>
      <RuleRef rule="short_put_uncovered" test="TestShortPutOTM_p28" page="pp.28–34" />
      <p>
        The naked short option is where margin gets real. The requirement is{' '}
        <strong>premium + max(basic, minimum)</strong>:
      </p>
      <Formula>{`basic   = 20% × U − OTM_amount     // a 20% adverse move, credited for OTM distance
minimum = 10% × K  (puts)          // floor: never below 10% of what you'd owe
        = 10% × U  (calls)
requirement = qty × mult × (P + max(basic, minimum))`}</Formula>
      <p>The intuition, piece by piece:</p>
      <ul>
        <li><strong>20% × U</strong> — “assume the stock moves 20% against you tonight.” That's the
          regulator's stress scenario for a single equity.</li>
        <li><strong>− OTM amount</strong> — distance out of the money is a head start; a put $15 OTM
          must eat through $15 before it hurts you, so $15/share is credited back.</li>
        <li><strong>max(…, minimum)</strong> — deep-OTM options would otherwise margin near zero, but
          they're exactly the “picking up pennies in front of a steamroller” trade. The 10% floor
          keeps a real deposit behind them. Note the asymmetry: puts floor on <em>K</em> (your
          obligation is to buy at K), calls floor on <em>U</em> (your obligation scales with the
          market).</li>
        <li><strong>+ premium</strong> — the current premium is the market's own estimate of the
          option's danger; it rides on top.</li>
      </ul>

      <h4>The four manual examples, exactly as the tests pin them</h4>
      <table>
        <thead><tr><th>Position</th><th>U</th><th>basic</th><th>minimum</th><th>binds</th><th>Requirement</th></tr></thead>
        <tbody>
          <tr><td>Short 80 put @ $2 (OTM)</td><td>95</td><td>19 − 15 = 4</td><td>8</td><td>min</td><td><strong>$1,000</strong></td></tr>
          <tr><td>Short 20 put @ $1.50 (ITM)</td><td>19.50</td><td>3.90 − 0</td><td>2</td><td>basic</td><td><strong>$540</strong></td></tr>
          <tr><td>Short 120 call @ $8.40 (ITM)</td><td>128.50</td><td>25.70 − 0</td><td>12.85</td><td>basic</td><td><strong>$3,410</strong></td></tr>
          <tr><td>Short 30 call @ $0.05 (OTM)</td><td>26.38</td><td>5.28 − 3.62</td><td>2.638</td><td>min</td><td><strong>$268.80</strong></td></tr>
        </tbody>
      </table>
      <p>
        (Per-share numbers; requirement = (P + binding branch) × 100. These are{' '}
        <code>TestShortPutOTM_p28</code>, <code>TestShortPutITM_p28</code>,{' '}
        <code>TestShortCallITM_p32</code>, <code>TestShortCallOTM_p32</code>.)
      </p>

      <h4>Now drive it yourself</h4>
      <ShortOptionCalc />

      <h3>The rates table — not all underlyings are 20%</h3>
      <Formula>{`equity, narrow ETF/index:   base 20%, min 10%
broad index, broad ETF:     base 15%, min 10%    // diversified → smaller stress move
leveraged ETF:              multiply by lev      // 2× ETF: 40%/20%`}</Formula>
      <p>
        A broad index can't gap 20% the way a single stock can, so it stresses at 15%
        (<code>TestBroadETFShortPut_p30</code>: short 410 put on a broad ETF at 445.35 → the 10%-of-strike
        floor binds → $4,110). A leveraged ETF moves <code>lev</code>× its index, so the whole
        formula scales (<code>TestLeveragedETFShortPut_p29</code>: lev=2.0 → $14,800).
      </p>
      <Callout kind="warn">
        <p>
          In limen, a <code>class</code> string that isn't in the rates table is a{' '}
          <strong>hard error</strong>, never a silent 0%. A typo'd class falling back to zero
          margin is the “confidently wrong number” failure mode — the worst outcome a margin
          system can produce. Same philosophy as the stock rules refusing leveraged ETFs
          (<code>lev != 1.0</code> → NoRule) rather than pricing them flat.
        </p>
      </Callout>

      <h3>The instrument zoo — where “stock” stops being simple</h3>
      <p>
        The rates table hides a taxonomy worth knowing, because it's where reference data starts
        deciding correctness (plane 3 of the map):
      </p>
      <table>
        <thead><tr><th>Instrument</th><th>What it really is</th><th>Margin consequence</th></tr></thead>
        <tbody>
          <tr><td><strong>ETF</strong></td><td>a fund holding the assets it tracks</td><td>broad ones stress at 15% — diversification is real</td></tr>
          <tr><td><strong>ETN</strong></td><td>an exchange-traded <em>note</em> — unsecured bank debt promising the index return</td><td>carries the issuer's credit risk on top of market risk; that's why <code>etn_broad ≠ etf_broad</code> in the rates table (20% vs 15%), and why long-dated ETN options get no 75% loan value</td></tr>
          <tr><td><strong>Leveraged ETF</strong></td><td>a fund engineered to return lev× the <em>daily</em> index move</td><td>everything scales by <code>lev</code>; and daily rebalancing means it drifts from lev× over weeks — why the ETF-hedge rule refuses them as cover entirely</td></tr>
          <tr><td><strong>Penny stock</strong></td><td>equity under ~$5</td><td>short side: FINRA's own sub-$5 tiers (in the engine). Long side: only <em>house</em> haircuts exist — which is the next section's point</td></tr>
        </tbody>
      </table>
      <p>
        Every row of that table reaches the engine as two fields: <code>class</code> and{' '}
        <code>lev</code>. The engine cannot verify them — it trusts the host's reference data.
        A mislabeled ETN priced as a broad ETF under-margins by a quarter of the stress, silently.
        That's why instrument classification sits on the platform map as host-owned reference
        data with real operational weight, and why the corpus's stock-hedge findings centered on
        exactly these fields.
      </p>

      <h4>What the house layer does with this — a preview</h4>
      <p>
        The engine encodes <em>citable</em> regulation only. Everything firm-specific arrives as
        an override on top — and now you can read one. A house that wants 100% margin on penny
        longs writes, conceptually:
      </p>
      <Formula>{`scope: symbol   key: PENNY   mode: floor
amount: 100% × market_value
→ requirement = max(engine_baseline, 1.00 × U × shares)`}</Formula>
      <p>
        A <code>floor</code> can only raise (<a href="#m15">house overlay &amp; overrides</a> explains why <code>set</code> doesn't
        exist). The engine's flat 25% stays untouched and citable; the house's risk appetite
        lives in a bitemporal store with its own audit trail. One number, two layers, each
        defensible to a different authority — that separation is one of your locked decisions
        (naked-stock D5) doing its job.
      </p>

      <h3>Cash account: same atoms, different philosophy</h3>
      <table>
        <thead><tr><th>Position</th><th>Cash-account treatment</th></tr></thead>
        <tbody>
          <tr><td>Long stock / long option</td><td>Pay in full. Done.</td></tr>
          <tr><td>Short put</td><td>Deposit the full exercise price K × qty × mult (“cash-secured put”) — you can always afford assignment.</td></tr>
          <tr><td>Short call</td><td>Deposit the underlying shares themselves (that's a covered call) or an escrow receipt.</td></tr>
          <tr><td>Short stock, naked anything</td><td><code>permitted: false</code> — no credit, no leverage, no exceptions.</td></tr>
        </tbody>
      </table>

      <h3>Self-check</h3>
      <Reveal q="Short 2× 50-strike puts @ $1.20, U=54, plain equity. Requirement?">
        <p>OTM by 4. basic = 0.20 × 54 − 4 = 6.80; minimum = 0.10 × 50 = 5 → basic binds.
          (1.20 + 6.80) × 100 × 2 = <strong>$1,600</strong>.</p>
      </Reveal>
      <Reveal q="Short 60-strike call @ $0.50, U=50. Which branch binds and why does the floor matter here?">
        <p>basic = 10 − 10 = 0 (fully eaten by the OTM credit); minimum = 0.10 × 50 = 5 → floor
          binds. (0.50 + 5) × 100 = <strong>$550</strong>. Without the floor this deep-OTM call
          would margin at $50 — for a position that loses $4,000 if the stock doubles.</p>
      </Reveal>
      <Reveal q="Same short put, but class is broad_based_index. What changes?">
        <p>basic uses 15% instead of 20%. For the K=50/U=54 put: basic = 8.10 − 4 = 4.10 vs
          minimum 5 → now the <em>floor</em> binds: (1.20 + 5) × 100 × 2 = <strong>$1,240</strong>.
          Diversification bought a smaller stress move, and the floor quietly became the binding
          constraint — exactly the kind of branch-flip a corpus test should pin.</p>
      </Reveal>
      <Reveal q="Why does an ETN stress at 20% even when it tracks a broad index?">
        <p>An ETN is unsecured debt of the issuing bank — the index exposure rides on top of the
          issuer's credit risk. Diversification of the <em>index</em> doesn't diversify the{' '}
          <em>promise</em>. The rates table encodes that as etn_broad keeping the 20% base, and
          the long-dated loan-value rule excludes ETNs for the same reason: debt that can gap on
          issuer news is worse collateral than a fund holding assets.</p>
      </Reveal>
    </>
  )
}
