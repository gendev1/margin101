import { Callout, Decision, Formula, Reveal } from '../components/ui.jsx'

export default function M8() {
  return (
    <>
      <p>
        These are decisions <em>you</em> took — locked in{' '}
        <code>docs/architecture/decisions/</code> during grilling sessions and epic reviews.
        Each card restates the fork as it actually stood, what you locked, and the
        first-principles reason. Read each one asking: <strong>could I defend this choice to a
        teammate today, without the doc?</strong> If not, that card is your homework. (Modules
        0–5 are the prerequisites; nothing here introduces new margin math.)
      </p>

      <h3>The spine: a wrong number is worse than no number</h3>
      <p>
        One principle generates more of your decisions than any other. A margin system has
        three failure modes, and they are not equally bad:
      </p>
      <ol>
        <li><strong>Loud error</strong> — annoying, gets fixed the same day.</li>
        <li><strong>Refusal (NoRule)</strong> — visible gap, gets prioritized honestly.</li>
        <li><strong>Silently wrong number</strong> — invisible, compounds daily, surfaces as a loss
          (or a regulator) months later.</li>
      </ol>
      <p>
        Almost every contested fork below was some version of “may the engine produce a
        plausible number here?” — and you consistently answered no. That consistency is what
        makes the system trustworthy.
      </p>

      <Decision id="D1" doc="naked-stock-rules.md"
        q="A stock leg arrives with class='etf_narrow' or lev=2.0. Should long_stock/short_stock price it at the flat Reg-T 50/25 anyway?"
        picked="No. The stock rules carry class == 'equity' && lev == 1.0 guards; anything else returns NoRule. House charges for leveraged instruments live in the override layer.">
        <p>
          The dollars: $10,000 of a 2× leveraged ETF margined at flat 50% demands $5,000 — but
          the instrument moves like $20,000 of exposure; the defensible number is ~$10,000.
          Flat-pricing under-margins by half, <em>silently</em>. NoRule shows up in recon as a
          gap; a half-priced requirement shows up nowhere until it costs money. Also note what
          you did <em>not</em> do: plumb <code>rate()/lev</code> into the stock rules — that
          would add the <em>mechanism</em> of class-awareness with no validated math behind it,
          the appearance of correctness without the substance.
        </p>
      </Decision>

      <Decision id="D1" doc="review-correctness-fixes.md"
        q="A rule binds and its constraints hold, but a requires guard fails (e.g. covered call with 50 shares against qty×mult=100). Hard error, or quietly try the next rule?"
        picked="Hard error (*RequiresError) on every evaluation path — Evaluate, EvaluateAll, and EvaluateWithTrace identically. The trace path's quiet continue was the bug, not the spec.">
        <p>
          The domain logic: constraints answer <em>“is this that strategy?”</em> (miss → try the
          next rule — correct routing). Requires answers <em>“is the data fit to price?”</em>{' '}
          (miss → someone's feed is broken). Letting a requires failure fall through means an
          under-covered covered call silently prices as something else or vanishes into NoRule —
          a data defect laundered into a plausible outcome. And the subtle part you caught: the
          engine had <em>two paths disagreeing</em>; you fixed the divergence toward the strict
          one, then locked path-parity tests so it can't reopen.
        </p>
      </Decision>

      <Decision id="D2" doc="corpus-remediation.md"
        q="A combo mixes dated and undated legs of the same option type, with a short in the mix. The call side silently no-matched while the put side errored. Which is right?"
        picked="Hard error from both soundness guards (is_limited_risk and mpl carry the identical check), for both option types. Mixed datedness is a feed defect, not a strategy.">
        <p>
          The payoff teaches why: a dated long “covering” an undated short nets to zero at every
          shared-expiry sample point — so the engine would charge ~$650 of long premium on a slip
          carrying ~$10,000 of post-expiry naked exposure. A sound loss bound requires knowing{' '}
          <em>when each leg stops existing</em>; half-dated input means the engine doesn't.
          Classifying it NO_RULE would file data bugs in the same recon bucket as product gaps —
          worst case, someone authors a rule to price garbage data.
        </p>
      </Decision>

      <h3>Refusal has two flavors — and you used both correctly</h3>
      <p>
        Refusing isn't one move. Compare two coverage decisions you took fifteen months of
        evidence apart:
      </p>
      <Decision id="D1" doc="declarative-rule-preconditions.md"
        q="short_index_call_long_etf: the ETF value doesn't cover the index obligation. Hard error, or no-match?"
        picked="No-match: the coverage test lives in match.constraints, so an under-covered position falls through — to the naked short-call rule below, which charges MORE.">
        <p>
          Falling through is safe here because of <em>direction</em>: the position structurally{' '}
          <em>is</em> a naked call without its coverage, and the rule it lands on is the more
          expensive one. Mis-routing toward conservatism is acceptable routing.
        </p>
      </Decision>
      <Decision id="D1" doc="corpus-remediation.md"
        q="Stock-hedge rules accepted shares ≥ qty×mult (excess coverage OK). The corpus then proved the maintenance formulas price ALL shares against the hedge — six pinned under-margining divergences. Keep ≥, invent split-rate formulas, or require exact coverage?"
        picked="Exact coverage: shares == qty×mult (1e-9 relative tolerance), mispairing is a typed RequiresError naming the remedy. B&B decomposition — already proven optimal on 340 portfolios — is the only authority allowed to split a mixed position.">
        <p>
          Why not split-rate formulas in CEL? They'd transcribe margin math <em>the manual never
          wrote</em> into seven rules, duplicating the optimizer's economics in a second
          implementation that can drift. The manual defines a covered call; it does not define
          “covered call plus 90 loose shares.” And this card is also a lesson in process:
          it <strong>explicitly supersedes</strong> the earlier ≥ decision and its test — your
          own corpus produced the evidence, and the decision record says so instead of silently
          flipping. That's how a locked decision is supposed to die.
        </p>
      </Decision>

      <h3>The ledger convention — gross, proceeds, cash</h3>
      <Decision id="D2+D3" doc="naked-stock-rules.md"
        q="The short_stock draft formula was 'maintenance = tier only'. Also: if short_sale_proceeds is missing, fall back to U×shares?"
        picked="Gross form (U×shares + tier) with the LOCKED short-sale proceeds credited as AppliedProceeds — and proceeds must be present and positive, no fallback.">
        <Formula>{`maintenance Requirement = U×shares + tier        (gross — cost to buy back, plus cushion)
AppliedProceeds         = locked proceeds       (what the sale actually banked)
CashCall                = Requirement − proceeds (grows with mark-to-market loss)`}</Formula>
        <p>
          Two subtleties you should be able to reproduce: (1) the draft's tier-only formula
          dropped the <code>U×shares</code> term — it under-reported the gross requirement and
          contradicted the already-proven combo arithmetic (<code>p47</code>: 25,500 + 7,650).
          (2) Crediting the <em>locked</em> proceeds rather than current value is what makes a
          short that moves against the customer surface its loss in CashCall. A{' '}
          <code>U×shares</code> fallback would peg CashCall to the tier forever — hiding exactly
          the loss the convention exists to show. That's why the missing-proceeds case must be
          an error, not a default.
        </p>
      </Decision>

      <Decision id="D4" doc="naked-stock-rules.md"
        q="Short stock in a cash account: omit the cash formula family (accidental NO_RULE), or declare it?"
        picked="Explicit cash: permitted: false. 'Recognized but disallowed in this account type' and 'no rule recognizes this' are different verdicts, and the caller debugging a rejection deserves the precise one.">
        <p>
          Cheap decision, big debugging dividend: silence-by-absence makes every rejection a
          research project. The verdict taxonomy (Result / not-permitted / NoRule / error) only
          works if each outcome is produced <em>deliberately</em>.
        </p>
      </Decision>

      <h3>The baseline / house boundary</h3>
      <p>
        Several forks were really one question: <em>is this number regulation, or is it
        policy?</em> Regulation is universal and lives in the engine YAML; policy varies by firm
        and lives in the override layer. Your test for the boundary held up every time:
      </p>
      <Decision id="D5" doc="naked-stock-rules.md"
        q="Long penny stocks: encode a sub-$5 haircut branch in long_stock like short_stock has?"
        picked="No — flat 25%. The short-stock sub-$5 tier is FINRA-4210 baseline (citable regulation); penny-long haircuts are house practice that differs per firm. Houses author them as overrides (floor 100% of MV).">
        <p>
          The asymmetry <em>looks</em> inconsistent and isn't: one branch has a regulatory
          citation, the other has only “most desks do something like this.” The engine
          transcribes citations.
        </p>
      </Decision>
      <Decision id="D6" doc="account-house-recon.md"
        q="Should overrides support a set/replace mode that hard-assigns a requirement?"
        picked="No. Only add / max / floor / block — modes that can only RAISE the requirement above the Reg-T-derived baseline.">
        <p>
          Two first-principles reasons. Domain: a <code>set</code> can push the number{' '}
          <em>below</em> the regulatory floor — an override typo of <code>0.05</code> could
          under-margin an entire symbol silently. Mechanical: raise-only modes compose
          order-independently (floors collapse to max-of-floors, adds sum); two <code>set</code>s
          need a winner, making priority load-bearing and breaking the audit story. The litmus
          you recorded is worth memorizing: <em>“does this rule ever need to push the
          requirement below what the calc produced?”</em> If no, it's a floor, not a set.
        </p>
      </Decision>

      <h3>Time, calendars, and over- vs under-margining</h3>
      <Decision id="D2" doc="review-correctness-fixes.md"
        q="vertical_spread's requires demanded expiration EQUALITY, but the constraint allowed short ≤ long. Under hard-requires semantics that contradiction would error every legal calendar. Tighten to equality, or relax to ordering?"
        picked="Ordering: short_leg.expiration <= long_leg.expiration, with date-format validation riding along in the same rule. Calendars and diagonals get spread treatment.">
        <p>
          This fork is the rare one where <em>both</em> directions have a real cost, and you had
          to price them: tighten → every legal calendar over-margins vs the vendor → systematic
          recon DIFFs → permanent noise in the oracle your whole verification model depends on.
          Relax → sound, because the MPL bound is valid exactly when the long outlives the short
          (the dangerous direction — long dies first, short stands naked — stays excluded).
          Over-margining isn't “safe”; it poisons your measurement instrument. Footnote that
          became a corpus finding: the string comparison is only sound for zero-padded ISO dates —
          “2026-6-19” sorts wrong lexically — which is why format validation is part of the same
          decision, not a nicety.
        </p>
      </Decision>

      <h3>Optimizer semantics</h3>
      <Decision id="D2" doc="wire-l05-optimizer.md"
        q="When decomposing an account, may the optimizer pool legs across the caller's submitted positions to find cheaper offsets?"
        picked="No — one bucket per submitted PositionInput; the caller's grouping is authoritative. Cross-position pooling is deferred to the Universal Spread Rule epic as its own deliverable.">
        <p>
          The trap you avoided: pooling isn't a toggle, it's a <em>different number</em> for the
          same account (cross-position offsets can be cheaper). Two numbers from one flag means
          the recon oracle no longer knows what it's comparing against. v1 commits to “the
          caller's grouping is the unit of offset” — and the corpus-remediation refusal semantics
          (mispaired groupings bounce back to the caller) lean on exactly this authority.
        </p>
      </Decision>
      <Decision id="D6+D7" doc="naked-stock-rules.md"
        q="Should long_stock/short_stock be optimizer targets so B&B can use them?"
        picked="No — they stay non-targets, reached only by the residual sink via explicit rule ID, after B&B has exhausted every pairing.">
        <p>
          “Residual sink” and “optimizer target” are <em>opposite roles</em>. Naked/standalone
          rules are excluded from the search on purpose: if B&B could “decompose” a leg straight
          into its naked rule, it could short-circuit a better pairing — score a lone short stock
          standalone when it could have capped a short call into a covered combo. The cheap
          fallback must only be reachable when nothing better exists, which the search order
          guarantees.
        </p>
      </Decision>

      <Callout kind="tip">
        <p>
          <strong>The pattern in your own decisions:</strong> (1) never let the engine produce a
          number it can't cite; (2) refusal routes by direction — fall through only when the
          landing rule charges more; (3) the engine transcribes regulation, the override layer
          expresses policy, and policy may only raise; (4) when evidence proves a lock wrong,
          supersede it in writing. You took most of these by intuition — now you know the
          arguments, they're yours to defend.
        </p>
      </Callout>

      <h3>Self-check (no peeking at the cards)</h3>
      <Reveal q="A teammate proposes: 'if short_sale_proceeds is missing, just use U×shares — it's approximately right.' What breaks?">
        <p>CashCall stops growing when the short moves against the customer (the credit would
          track the requirement), hiding mark-to-market losses — the exact signal the
          locked-proceeds convention exists to surface. Approximately-right inputs that zero out
          a loss signal are the silent-wrong-number failure mode; the field is required-positive
          for that reason.</p>
      </Reveal>
      <Reveal q="Why is over-margining calendars 'not safe' even though it never under-collects?">
        <p>Because the vendor margins them correctly, every calendar becomes a
          permanent recon DIFF. The recon stream is your correctness oracle; systematic noise in
          it means real bugs hide behind 'oh, that's just the calendar thing.' Conservatism that
          degrades your measurement instrument is a cost, not a safety margin.</p>
      </Reveal>
      <Reveal q="Why may overrides never lower the requirement, in one sentence each: domain and mechanical?">
        <p>Domain: anything that can go below the Reg-T baseline can silently under-margin a
          whole symbol on a typo. Mechanical: raise-only modes compose in any order; lowering
          modes need a winner, which makes ordering load-bearing and audit ambiguous.</p>
      </Reveal>
    </>
  )
}
