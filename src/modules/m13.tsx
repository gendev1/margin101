import { BuildLens, Callout, Panel, Reveal } from '../components/ui.jsx'

const TYPES = [
  {
    name: 'Baseline engine',
    question: 'Is the problem a citable margin rule or refusal path?',
    signs: 'manual page, rates class, hedge soundness, verdict semantics',
    home: 'rules + pure engine',
  },
  {
    name: 'Optimizer / search',
    question: 'Is the challenge finding the cheapest legal grouping rather than pricing a known grouping?',
    signs: 'partitioning, pooling, residual legs, branch-and-bound, search budget',
    home: 'optimizer',
  },
  {
    name: 'House policy',
    question: 'Is the request firm-specific and allowed to be stricter than baseline?',
    signs: 'symbol floor, blocklist, account policy, risk profile, raise-only logic',
    home: 'overlay / overrides',
  },
  {
    name: 'Numerical model',
    question: 'Does the system need theoretical prices or scenario-grid evaluation rather than manual transcription?',
    signs: 'TIMS, portfolio margin, vol surfaces, tolerances, model calibration',
    home: 'new methodology layer',
  },
  {
    name: 'Data plane',
    question: 'Does the correctness depend on better reference data or external feeds?',
    signs: 'class, lev, corporate actions, contract adjustments, market-data quality',
    home: 'host-fed snapshots and validation',
  },
  {
    name: 'Stateful ledger',
    question: 'Does yesterday materially change today’s answer?',
    signs: 'carry forward, debit/credit accumulation, due dates, rolling balances',
    home: 'SMA / bookkeeping',
  },
  {
    name: 'Workflow / ops',
    question: 'Is the real work about actions, queues, deadlines, and humans?',
    signs: 'margin calls, notifications, approvals, triage dashboards, desk tooling',
    home: 'host operations',
  },
]

export default function M13() {
  return (
    <>
      <p>
        The biggest way to get fooled in a system like margincalc is to think every future piece
        is “just another engineering task.” It is not. The quality of the decision usually comes
        from recognizing <em>what kind of system</em> the next thing really is.
      </p>

      <h3>Step 1 — classify the subsystem before you design it</h3>
      <table>
        <thead><tr><th>Type</th><th>First question to ask</th><th>Signals</th><th>Where it belongs</th></tr></thead>
        <tbody>
          {TYPES.map(type => (
            <tr key={type.name}>
              <td><strong>{type.name}</strong></td>
              <td>{type.question}</td>
              <td>{type.signs}</td>
              <td>{type.home}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Step 2 — ask the seven hard questions</h3>
      <ol>
        <li><strong>What is the silent-wrong-number risk?</strong> If the answer is “it could plausibly under-margin without obvious signal,” the bar goes up immediately.</li>
        <li><strong>What is the oracle?</strong> Manual example, exhaustive search on small cases, model tolerance, vendor compare, or accounting invariants?</li>
        <li><strong>What is the primary dependency?</strong> Better rules, better search, better data, better state handling, or better workflow?</li>
        <li><strong>Is the output pure or stateful?</strong> Same input same output, or does history matter?</li>
        <li><strong>Who should own it?</strong> limen core, optimizer, overlay store, host, or an external vendor?</li>
        <li><strong>What would make supersession likely later?</strong> New evidence, new product scope, new host reality, or new methodology?</li>
        <li><strong>What does “good enough” verification look like?</strong> Exact match, bounded diff, replay seal, or operational reconciliation?</li>
      </ol>

      <h3>Applying the playbook to the missing systems</h3>
      <div className="studygrid">
        <Panel title="TIMS / portfolio margin">
          <p><strong>Type:</strong> numerical model.</p>
          <p><strong>Primary new risk:</strong> wrong methodology or weak oracle, not weak YAML coverage.</p>
          <p><strong>Verification:</strong> scenario sanity tests, model checks, tolerance-banded vendor compare.</p>
        </Panel>
        <Panel title="Decomposition optimizer">
          <p><strong>Type:</strong> search / optimization.</p>
          <p><strong>Primary new risk:</strong> missing the cheapest legal partition.</p>
          <p><strong>Verification:</strong> exhaustive oracle on small portfolios, replayable partition traces.</p>
        </Panel>
        <Panel title="SMA / buying power">
          <p><strong>Type:</strong> stateful ledger.</p>
          <p><strong>Primary new risk:</strong> accounting drift over time.</p>
          <p><strong>Verification:</strong> event-sequence invariants, ledger snapshots, rule-specific regression cases.</p>
        </Panel>
        <Panel title="Margin-call lifecycle">
          <p><strong>Type:</strong> workflow / ops.</p>
          <p><strong>Primary new risk:</strong> missed actions, wrong deadlines, broken desk state.</p>
          <p><strong>Verification:</strong> state-machine tests, due-date logic, operational auditability.</p>
        </Panel>
      </div>

      <h3>How this keeps intuition from staying private</h3>
      <p>
        Intuition is strongest at pattern recognition. The failure mode is not “bad intuition.” It
        is skipping the explicit classification step and therefore picking the wrong evaluation
        standard. For example:
      </p>
      <ul>
        <li>Treating TIMS like a rulebook extension makes you under-invest in model and tolerance design.</li>
        <li>Treating SMA like account aggregation makes you miss the stateful ledger problem.</li>
        <li>Treating overlays like baseline rules makes you erase the policy boundary that protects auditability.</li>
      </ul>

      <Callout kind="warn">
        <p>
          The biggest trap is architecture by analogy. “This feels sort of like the thing we
          already have” is how a numerical model becomes fake rules, or a ledger becomes a
          convenient derived field. Classification comes first so analogy does not silently choose
          the implementation style for you.
        </p>
      </Callout>

      <h3>Recommended sequencing logic</h3>
      <p>
        Once a subsystem is classified, sequencing gets much easier:
      </p>
      <ul>
        <li><strong>Finish amber before gray</strong> when the amber work de-risks a system you already own.</li>
        <li><strong>Prefer host-facing product value</strong> when it reuses trusted math without adding a new discipline.</li>
        <li><strong>Isolate discipline shifts</strong> like TIMS and SMA into explicit epics, because the oracle and reasoning style both change.</li>
        <li><strong>Delay optional regimes</strong> like SPAN unless the product truly requires them.</li>
      </ul>

      <BuildLens title="Use this as the pre-ADR page">
        <ul>
          <li>Name the subsystem type in the first paragraph.</li>
          <li>Name the oracle before the implementation sketch.</li>
          <li>Name the ownership boundary before talking about APIs.</li>
          <li>Name the likely supersession trigger so future-you can reverse the call honestly.</li>
        </ul>
      </BuildLens>

      <h3>Self-check</h3>
      <Reveal q="What is the first classification difference between account aggregation and SMA?">
        <p>
          Aggregation is still pure same-day roll-up. SMA is a stateful ledger with memory and
          carry-forward behavior. If yesterday matters, you are already outside simple aggregation.
        </p>
      </Reveal>
      <Reveal q="What is the primary reason TIMS deserves its own epic rather than being filed under more rule coverage?">
        <p>
          Because the problem changes type: it becomes numerical scenario pricing with model
          inputs and tolerance-based validation, not rule transcription against a citable manual
          example.
        </p>
      </Reveal>
      <Reveal q="Why is classifying a subsystem before designing it worth doing if intuition is already strong?">
        <p>
          Because the classification determines the right oracle, dependency model, ownership
          boundary, and failure mode. Strong intuition gets sharper when those categories are made
          explicit instead of remaining implicit.
        </p>
      </Reveal>
    </>
  )
}
