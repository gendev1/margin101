import PayoffChart from '../components/PayoffChart.jsx'
import { LegLab } from '../components/labs.jsx'
import { Callout, Reveal, RuleRef } from '../components/ui.jsx'

export default function M1() {
  return (
    <>
      <p>
        Margin is priced off <strong>what a position can lose</strong>, and the tool for seeing
        that is the payoff diagram. Learn to read these and 80% of the rulebook becomes
        “oh, that formula is just this picture in algebra.” Every chart here is{' '}
        <em>payoff at expiration</em>: x-axis is where the underlying U ends up, y-axis is your
        profit or loss in dollars, for one contract (×100 shares).
      </p>

      <h3>Atom 1 — Long call: pay premium, unlimited upside</h3>
      <PayoffChart legs={[{ kind: 'call', side: 1, K: 100, P: 5 }]} lo={70} hi={150} showTail
        title="Long 100-strike call, premium $5 (cost $500)" />
      <p>
        Below K the option expires worthless — you lose exactly the $500 premium, never more.
        Above K it gains $100 per $1 of stock; breakeven at K + P = $105. <strong>Worst case is
        capped at the premium.</strong> That's why a long option's margin treatment is trivial:
        pay for it in full, and nothing more is ever demanded.
      </p>

      <h3>Atom 2 — Short call: collect premium, unbounded downside</h3>
      <PayoffChart legs={[{ kind: 'call', side: -1, K: 100, P: 5 }]} lo={70} hi={170} showTail
        title="Short 100-strike call, premium $5 (collected $500)" />
      <p>
        The exact mirror image. You keep $500 if U stays under 100. Above it, you lose $100 per
        dollar of rally — and <em>a stock price has no ceiling</em>. This is the single most
        important picture in the course: the uncovered short call is the unboundedly dangerous
        atom, and half the rulebook's machinery (coverage checks,{' '}
        <code>is_limited_risk</code>, expiry ordering) exists to detect whether something is
        quietly carrying one.
      </p>
      <RuleRef rule="short_call_uncovered" test="TestShortCallITM_p32" page="p.32" />

      <h3>Atoms 3 &amp; 4 — Long put / short put</h3>
      <PayoffChart legs={[{ kind: 'put', side: -1, K: 100, P: 4 }]} lo={30} hi={150}
        title="Short 100-strike put, premium $4 — worst case at U=0 is K−P = $9,600" />
      <p>
        A long put is bounded loss (premium) with big-but-bounded upside (stock to zero). A short
        put is the risky one again, but with a crucial difference from the short call:{' '}
        <strong>the loss is bounded, because U stops at zero</strong>. Worst case = (K − P) × 100.
        Dangerous, not infinite. The rulebook treats the two tails differently for exactly this
        reason — watch for it in the naked-short formulas (the put's minimum floor uses K, the
        call's uses U).
      </p>
      <RuleRef rule="short_put_uncovered" test="TestShortPutOTM_p28" page="p.28" />

      <h3>Stock is a straight line</h3>
      <PayoffChart legs={[{ kind: 'stock', side: 1, basis: 100, shares: 100 }]} lo={40} hi={160}
        title="Long 100 shares @ $100" />
      <p>
        Long stock: +$100 per $1 up, −$100 per $1 down, floor at U=0 (max loss = what you paid).
        Short stock is the mirror — and inherits the unbounded-upside problem of the short call.
        When stock combines with options the payoff lines <em>add</em>, which is the whole idea
        of hedged structures (<a href="#m4">stock hedges</a>).
      </p>

      <h3>Play with it</h3>
      <LegLab />

      <Callout kind="tip">
        <p>
          <strong>The tail walk.</strong> For any position, ask two questions: what happens as
          U → ∞, and what happens as U → 0? Walk each leg: longs can only lose their premium;
          every short call bleeds without limit on the right tail; every short put bleeds to a
          floor on the left tail. If either tail is uncovered, the position is unbounded and no
          “max loss” number is meaningful. This is, almost verbatim, what{' '}
          <code>is_limited_risk(legs)</code> checks.
        </p>
      </Callout>

      <h3>Where the expiry picture stops being enough</h3>
      <p>
        Every chart above shows the option <em>at the moment it dies</em>. Before expiry, an
        option is worth more than its intrinsic value — it carries <strong>time value</strong>,
        the market's price for everything that could still happen. A 100-strike call with the
        stock at 100 has zero intrinsic value and might trade at $5; the entire $5 is time value,
        and it decays toward zero as expiry approaches. Three consequences worth knowing now:
      </p>
      <ul>
        <li><strong>The premium in the formulas is doing real work.</strong> When the naked-short
          formula adds <code>P</code> on top of the 20% stress, it's incorporating the market's own
          live estimate of the option's danger — a volatile stock's options carry fat premiums, and
          the requirement automatically rises with them. The rulebook gets a crude volatility input
          without ever modeling volatility.</li>
        <li><strong>Exercise style is a risk parameter.</strong> <em>American</em> options can be
          exercised any day; <em>European</em> only at expiry. That's why hedge rules demand{' '}
          <code>style: american</code> on the protecting leg (a hedge you can't exercise early can't
          rescue you early), and why the European box gets loan-value treatment while the American
          box doesn't (<a href="#m5">limited risk &amp; the catch-all</a>). When a <code>requires</code> guard checks <code>style</code>, this
          is what it's protecting.</li>
        <li><strong>This is the exact doorstep of risk-based margin.</strong> Strategy-based margin
          (everything in this course) only ever needs the expiry picture plus stress percentages.
          TIMS — the roadmap's portfolio margin — asks instead: “what is this position worth{' '}
          <em>tomorrow</em> if the stock drops 12%?” Answering that requires a theoretical pricing
          model (time value as a function of volatility and time), vol surfaces as input data, and
          tolerance-based verification. Same payoff intuition, completely different machinery — when
          that epic arrives, this section is where it plugs in.</li>
      </ul>

      <h3>Self-check</h3>
      <Reveal q="Short 110-strike call, premium $3. Where is breakeven, and what is the loss at U=150?">
        <p>Breakeven at 113 (K + P). At U=150: intrinsic = 40, minus the 3 collected → loss
          of $37/share = <strong>$3,700</strong>. At U=200 it's $8,700. Keeps going.</p>
      </Reveal>
      <Reveal q="Short 40-strike put, premium $2.50. Absolute worst case in dollars?">
        <p>U=0: obligated to buy at 40 what is worth 0, minus premium collected:
          (40 − 2.50) × 100 = <strong>$3,750</strong>. Bounded — the stock can't go below zero.</p>
      </Reveal>
      <Reveal q="You own 100 shares @ $80 and are short one 85-strike call. Tail walk both directions.">
        <p>U→∞: the shares cover the short call — every dollar the call loses, the shares gain.
          Capped profit, no unbounded risk. U→0: shares lose to a floor of $8,000, call expires
          worthless. Bounded both ways — that's why a covered call is margined like
          stock, not like a naked call (<a href="#m4">stock hedges</a>).</p>
      </Reveal>
      <Reveal q="Why do hedge rules require style: american on the protecting leg?">
        <p>An American option can be exercised any day, so the hedge is live the whole time. A
          European put under a stock position can't be exercised until expiry — if the stock
          collapses next week, the “floor” isn't usable yet. The guard makes the formula's
          assumption (“the hedge is always exercisable”) an enforced input condition.</p>
      </Reveal>
    </>
  )
}
