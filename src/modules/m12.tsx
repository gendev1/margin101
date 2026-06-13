import { BuildLens, Callout, Panel, Reveal } from '../components/ui.jsx'

export default function M12() {
  return (
    <>
      <p>
        This page is the <em>classification summary</em> of the systems beyond the engine — one
        screen to compare their problem types side by side. Each one now has a full from-zero
        teaching module: <a href="#m14">aggregation</a>, <a href="#m15">house overlay &amp;
        overrides</a>, <a href="#m16">the optimizer</a>, <a href="#m17">SMA &amp; buying
        power</a>, <a href="#m21">margin-call lifecycle</a>, <a href="#m18">pre-trade</a>,{' '}
        <a href="#m19">intraday</a>, <a href="#m20">risk-based margin</a>,{' '}
        <a href="#m22">TIMS</a>, and <a href="#m23">SPAN</a>. Learn there; compare here.
      </p>

      <h3>The first split: pure calculation vs stateful operations</h3>
      <p>
        The easiest way to get lost in future planning is to treat every gray box as “more margin
        logic.” It is not. Some systems are still pure calculation problems. Others are host-side
        state machines, workflows, or data pipelines.
      </p>
      <table>
        <thead><tr><th>Subsystem</th><th>Type of problem</th><th>Why it is different</th></tr></thead>
        <tbody>
          <tr><td>B&amp;B optimizer</td><td>pure search over legal partitions</td><td>same engine inputs, but computationally harder</td></tr>
          <tr><td>House overlay + targeted overrides</td><td>policy layer on top of a baseline</td><td>not new math, but new firm-specific rules with audit requirements</td></tr>
          <tr><td>Account aggregation</td><td>deterministic roll-up</td><td>combines position outputs into account-level numbers</td></tr>
          <tr><td>TIMS / portfolio margin</td><td>numerical pricing + scenario risk</td><td>not manual transcription; needs models and tolerance-based verification</td></tr>
          <tr><td>SPAN / futures margin</td><td>exchange scenario methodology</td><td>different product class, different rule source, often bought not built</td></tr>
          <tr><td>SMA / buying-power ledger</td><td>stateful accounting ledger</td><td>depends on yesterday, not just today</td></tr>
          <tr><td>Margin-call lifecycle</td><td>workflow and operations</td><td>uses limen outputs, but mostly about events, deadlines, and actioning</td></tr>
        </tbody>
      </table>

      <h3>Decomposition optimizer (B&amp;B)</h3>
      <Panel title="What it actually does">
        <p>
          The engine prices a <em>claimed structure</em>. The optimizer is what decides how a whole
          position or account should be split into those structures. Given a bag of legs, it
          searches for the partition with the <strong>lowest total legal requirement</strong>.
        </p>
        <ul>
          <li>Input: a set of legs plus the catalog of rule shapes the engine can price.</li>
          <li>Output: a partition, residual loose legs, and the summed requirement.</li>
          <li>Objective: cheapest compliant interpretation, never just first plausible grouping.</li>
        </ul>
      </Panel>
      <p>
        The hard part is not formulas. The hard part is search. As the number of legs grows, the
        number of possible groupings explodes. That is why the open work here is node budgets,
        pruning, and a decomposition corpus with an exhaustive oracle on small cases.
      </p>
      <Callout kind="tip">
        <p>
          What the current stack already bought you: once the optimizer proposes a group, the
          pricing of that group is delegated to the same rule engine you already trust. The new
          discipline is search soundness, not new margin arithmetic.
        </p>
      </Callout>

      <h3>House overlay + targeted overrides</h3>
      <Panel title="What it actually does">
        <p>
          The baseline engine answers: “what is the regulatory floor?” The overlay answers:
          “what stricter number does <em>this firm</em> want?” Targeted overrides are house rules
          like symbol floors, risk-profile surcharges, or temporary operational restrictions.
        </p>
        <ul>
          <li>Baseline remains citable and universal.</li>
          <li>Overlay may only raise, floor, add, max, or block.</li>
          <li>Every applied house rule must be auditable and replayable.</li>
        </ul>
      </Panel>
      <p>
        This is why you locked raise-only composition and bitemporal storage. The challenge here
        is not computational sophistication. It is making policy changes safe, explicit, and
        replayable. If the firm backdates an override, your sealed historical runs still have to
        replay to the old result.
      </p>

      <h3>Account aggregation</h3>
      <Panel title="What it actually does">
        <p>
          Position-level pricing gives you Requirement, AppliedProceeds, and CashCall per priced
          unit. Account aggregation is the deterministic roll-up step that converts many position
          results into one account view: LMV, SMV, equity, total requirement, and total call.
        </p>
      </Panel>
      <p>
        This is important because it is easy to confuse with SMA. Aggregation is still same-day,
        pure, and deterministic. SMA is not. Aggregation answers: “what is the account requirement
        right now?” SMA answers: “what buying power has this account accumulated over time?”
      </p>

      <h3>TIMS / portfolio margin</h3>
      <Panel title="What it actually does">
        <p>
          TIMS stops asking “which strategy is this?” and starts asking “what is the worst loss
          across a scenario grid?” You shock the underlying across a range, theoretically price
          every option at each node, net the positions, and take the worst result after approved
          offsets.
        </p>
        <ul>
          <li>Needs an option pricing model, not just payoff-at-expiry algebra.</li>
          <li>Needs vol surfaces and market data as first-class dependencies.</li>
          <li>Needs a new oracle style: tolerance bands, model checks, and scenario sanity tests.</li>
        </ul>
      </Panel>
      <p>
        This is the first subsystem where “the manual said so” stops being enough. You are no
        longer transcribing a citable formula. You are implementing a numerical methodology. That
        changes verification, data needs, and recon semantics all at once.
      </p>
      <Callout kind="warn">
        <p>
          TIMS is not “add more rules.” If you treat it like a bigger YAML file, you will build
          the wrong thing. The point is scenario pricing under a model, with approximation and
          tolerance becoming part of the contract.
        </p>
      </Callout>

      <h3>SPAN / futures margin</h3>
      <Panel title="What it actually does">
        <p>
          SPAN is the futures-world cousin of scenario-based margin. Instead of equity-option
          strategy rules, the exchange publishes risk arrays and scenario methodology for futures
          and options-on-futures. It is a different product regime with different source data,
          different contract semantics, and often different vendor expectations.
        </p>
      </Panel>
      <p>
        The main lesson is strategic, not mathematical: if the product does not need futures, this
        belongs far down the sequence. And if the product <em>does</em> need futures, many firms
        buy or integrate this capability instead of treating it as the next obvious extension of a
        Reg-T engine.
      </p>

      <h3>SMA / buying-power ledger</h3>
      <Panel title="What it actually does">
        <p>
          SMA is a ledger that tracks accumulated credits and debits over time to determine what a
          margin account may do next. It is not simply “today’s excess equity.” It has carry
          forward, event rules, and day-over-day effects.
        </p>
        <ul>
          <li>Inputs include account equity, requirements, transactions, and prior SMA state.</li>
          <li>Output is buying power, not just requirement.</li>
          <li>Errors here are accounting bugs, not pricing bugs.</li>
        </ul>
      </Panel>
      <p>
        This is why it belongs on top of limen rather than inside the pure engine. limen computes
        the requirement events. SMA decides what those events mean for future customer capacity.
      </p>

      <h3>Margin-call lifecycle</h3>
      <Panel title="What it actually does">
        <p>
          Once an account falls short, the problem becomes operational: issue the right type of
          call, calculate due dates, track whether it is met, extended, or liquidated, and expose
          that state to humans and downstream systems.
        </p>
        <ul>
          <li>Trigger: limen emits a CashCall or related deficit signal.</li>
          <li>System of record: host-side workflow state, notifications, and actions.</li>
          <li>Primary risk: operational inconsistency, not formula correctness.</li>
        </ul>
      </Panel>
      <p>
        This is where margin stops being purely mathematical and becomes desk software. The engine
        still matters, but it is upstream of a queue, not the queue itself.
      </p>

      <BuildLens title="How to sequence these without lying to yourself">
        <ul>
          <li><strong>Finish first:</strong> B&amp;B optimizer hardening and bridge validation, because they de-risk systems you already own.</li>
          <li><strong>Highest near-term product value:</strong> pre-trade and buying-power surfaces, once account-state assumptions are explicit.</li>
          <li><strong>Biggest new research discipline:</strong> TIMS, because it changes data, oracle, and methodology together.</li>
          <li><strong>Most obviously host-owned:</strong> margin-call lifecycle and ops UI.</li>
          <li><strong>Most optional:</strong> SPAN, unless the product explicitly needs futures.</li>
        </ul>
      </BuildLens>

      <h3>Self-check</h3>
      <Reveal q="Why is SMA not just part of account aggregation?">
        <p>
          Aggregation is a pure same-day roll-up of current position results. SMA is a day-over-day
          state machine that depends on prior ledger state, account events, and rule-specific carry
          behavior. One is a deterministic summary; the other is accounting memory.
        </p>
      </Reveal>
      <Reveal q="Why is TIMS a different kind of problem from the current rulebook engine?">
        <p>
          The rulebook engine transcribes citable formulas. TIMS requires theoretical pricing under
          scenarios, model inputs like vol surfaces, and tolerance-based verification instead of
          exact-match manual examples. It changes the oracle itself.
        </p>
      </Reveal>
      <Reveal q="Why does B&B optimizer work not imply new pricing math?">
        <p>
          Because the optimizer searches over ways to group legs, then hands each candidate group
          back to the same pricing engine. The novelty is search quality and proof that the chosen
          partition is cheapest, not inventing new requirement formulas.
        </p>
      </Reveal>
    </>
  )
}
