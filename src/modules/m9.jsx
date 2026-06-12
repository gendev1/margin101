import { Callout, Decision, Formula, Reveal } from '../components/ui.jsx'

export default function M9() {
  return (
    <>
      <p>
        <a href="#m8">The previous module</a> covered the decisions that protect the <em>number</em>. These protect the{' '}
        <em>proof</em> — determinism, audit, replay, and the system's boundaries. They matter
        because your entire verification model (oracle-driven, recon against the vendor, replay of
        sealed traces) only works if the calculation is reproducible bit-for-bit and every input
        that shaped a number is pinned. Same format: the fork, what you locked, why.
      </p>

      <h3>Engine purity — the foundation everything else stands on</h3>
      <p>
        Three decisions from the audit epic form one idea: <strong>the engine is a pure
        function</strong>. Same input, same bytes out, forever.
      </p>
      <Decision id="D2 + D4 + D6" doc="audit-versioning.md"
        q="May the engine read the wall clock? Call the audit sink itself? Know the position's ID?"
        picked="No, no, and no. The engine is clock-free (caller stamps EvaluatedAt; sinks reject zero timestamps), sink-free (EvaluateWithTrace returns a Trace, never writes one), and identity-free (position_id lives on the sink Envelope, not in engine types).">
        <p>
          Each “no” removes a source of nondeterminism or coupling. A clock read would be the
          only nondeterministic effect in the engine — the determinism property test would have
          to special-case it forever. A sink call would couple math success to I/O success.
          Identity is a deployment concept (recon joins on CSV rows; an API uses whatever its
          upstream sends) — there is no universal position-ID the engine could rightly impose.
          The payoff: replay can re-run any sealed trace and demand <em>byte-identical</em>{' '}
          output, which is what makes “the engine changed behavior” detectable at all. Notice
          sinks <em>reject</em> zero timestamps — purity moved the stamping duty to the caller,
          so the design adds a guard that makes forgetting loud. Purity without that guard would
          just relocate the silent failure.
        </p>
      </Decision>

      <h3>Content addressing — names that can't lie</h3>
      <Decision id="D8 (audit) + D4 (api-first)" doc="audit-versioning.md / api-first-recon.md"
        q="How do traces refer to the rulebook, the CEL expressions, and themselves?"
        picked="By content hash, all the way down: rulebook_sha over canonical post-load state; expr_id = sha256(expression)[:8]; trace_id = sha256(position ‖ rulebook_sha ‖ time ‖ …). Expressions dedup into their own collection; traces store refs.">
        <p>
          The principle: a content-derived name is a name that cannot lie — if the bytes change,
          the name changes. Version strings drift (“v2.1” pointing at edited rules); a SHA can't.
          Retries become free dedup (same content → same trace_id → upsert, not duplicate).
          And the audit question “which formula produced this 2024 number?” has a forensic
          answer even after the YAML moved on. One refinement came later the hard way — see the
          trace-ID card below.
        </p>
      </Decision>
      <Decision id="D3" doc="review-correctness-fixes.md"
        q="trace_id was sha256(position_id ‖ rulebook_sha ‖ time)[:16], plain-concatenated. Position IDs are caller-supplied. Problem?"
        picked="Domain-separated encoding (length-prefixed fields), account_type and phase folded into the pre-image, and 32 hex chars instead of 16 — explicitly superseding the earlier 'locked' encoding and evicting the stale CodeRabbit learning that defended it.">
        <p>
          Two real bugs hid in the old scheme. Concatenation ambiguity: caller-supplied IDs mean{' '}
          <code>("ab"+"c")</code> and <code>("a"+"bc")</code> can collide on purpose. Missing
          coordinates: account_type and phase change the <em>result</em>, so two different
          evaluations could mint the same ID — and the Mongo sink upserts by trace_id, so one
          audit record <em>silently overwrites</em> the other. The risk calculus you recorded is
          the reusable lesson: probability × <strong>detectability</strong> — a collision was
          unlikely, but its failure mode was an undetectable overwrite, and undetectable is what
          justifies paying for 128 bits.
        </p>
      </Decision>

      <h3>Bitemporality — two clocks, because ops backdates</h3>
      <Decision id="D1 + D4" doc="account-house-recon.md"
        q="The override store is mutable (ops adds/corrects overrides). How does a sealed recon run stay replayable when the data under it changes?"
        picked="Every row carries two independent time axes — valid time (when it's true in the world) and transaction time (when the store learned it); writes are append-only; DELETE is a valid-time close, never a physical delete. A recon run pins both as_of and txn_cutoff.">
        <Formula>{`Monday:  recon run R seals (as_of = Mon, txn_cutoff = Mon 18:00)
Tuesday: ops backdates a correction: "AAPL floor was wrong since last week"
         → new row, valid_from = last week, txn_time = Tue

Replay R: valid_from ≤ Mon ✓  BUT txn_time(Tue) > cutoff(Mon 18:00) ✗ → excluded
          R reproduces exactly what it computed Monday. Forward runs see the fix.`}</Formula>
        <p>
          One clock can't do this: valid-time alone lets Tuesday's backdated insert silently
          change what Monday's sealed run replays to. And physical deletion is forbidden for the
          same reason — a sealed run may have legitimately used the row you'd be erasing.
          “Correct by writing a new version” is the database version of supersede-don't-edit.
        </p>
      </Decision>
      <Decision id="D2 + D5" doc="account-house-recon.md"
        q="Bitemporal resolution is deterministic — so why also hash the resolved override set into the trace?"
        picked="overrides_sha as an integrity SEAL, not a resolution mechanism: replay re-resolves from the store, re-hashes, and a mismatch is a loud failure. Hashing uses a canonical-JSON (JCS) encoder.">
        <p>
          Bitemporal gives determinism <em>only if the store is honest</em> — append-only is a
          convention in write code, not a physical guarantee. A bad migration, a manual delete, a
          stale backup restore: with resolution alone, a divergent replay is indistinguishable
          from a correct one. The seal converts corruption into a detectable event. And JCS
          because hand-rolled JSON hashing dies on float formatting — a hash has no tolerance,
          so the encoding must be canonical down to the last bit.
        </p>
      </Decision>

      <h3>The supersession arc — your decisions have a history, and that's the point</h3>
      <p>
        Trace one thread through four epics and watch locked decisions die honestly:
      </p>
      <ul>
        <li><strong>audit D7:</strong> Mongo lives in a separate <code>pkg/mongo</code> submodule —
          keep the driver out of the minimal core, because limen might be embedded someday.</li>
        <li><strong>durable-deployment D1:</strong> supersedes D7 — dissolve the submodule into core,
          one Mongo-default binary. Stated reasoning: “the SDK story is not load-bearing today;
          limen is service-first. If an embed use case becomes real, carve out a facade{' '}
          <em>then</em>.”</li>
        <li><strong>go-sdk-facade D1–D9:</strong> the embed use case became real (the bookkeeping
          host). Public facade types in <code>pkg/limen</code>; host owns refdata, jobs, provider
          recon; house overlay is the default mode; Mongo behind <code>pkg/limenmongo</code> (D8 —
          and note: <em>not</em> re-split into a submodule; one module, public package).</li>
        <li><strong>sdk-only-surface (#227):</strong> the API itself deleted; recon semantics
          extracted to a normative spec the bridge implements. The entire api-first-recon ADR now
          describes deleted code — kept as history, because the <em>reasoning</em> (async jobs for
          durability, idempotency keys, trace endpoints) survives as design vocabulary even
          though the code didn't.</li>
      </ul>
      <Callout kind="tip">
        <p>
          The lesson is not “the early decisions were wrong.” Each was correctly priced{' '}
          <em>on the evidence available when it was taken</em> — D7's isolation was right when
          embedding was hypothetical; dissolving it was right when deployment was the bottleneck;
          the facade was right when the host became real. What made the sequence cheap instead of
          chaotic is that every reversal names what it supersedes and why the evidence changed.
          Decisions are bets, not identities. The doc trail is what lets you re-bet without
          re-fighting.
        </p>
      </Callout>

      <h3>The SDK boundary — what limen is, settled in nine decisions</h3>
      <Decision id="D1–D5 (condensed)" doc="go-sdk-facade.md"
        q="What does the library expose, and what stays the host's job?"
        picked="Stable facade types only (never internal/*); narrow interfaces (RulesProvider, AuditSink…) so the SDK runs storage-free from a complete snapshot; host passes hydrated refdata (no market-data providers in v1); provider/oracle recon stays out; sync + batch calculation only, no job orchestration.">
        <p>
          One principle, five applications: <strong>limen computes; the host operates.</strong>{' '}
          Every “should the SDK also…?” fork resolved by asking which side of that line the
          capability lives on. Provider interfaces in v1 would have baked in guesses about query
          shapes nobody knew yet; job stores would have recreated the service runtime the epic
          existed to remove. The discipline of leaving capabilities <em>out</em> is what kept the
          public surface stable through everything that followed — including #227, which could
          delete the whole HTTP layer precisely because nothing in <code>pkg/limen</code>{' '}
          depended on it.
        </p>
      </Decision>
      <Decision id="D6 + D9" doc="go-sdk-facade.md"
        q="Should the SDK default to baseline-only calculation (simpler) with house overlay opt-in?"
        picked="No — house overlay is the DEFAULT mode; baseline-only is the explicit opt-out. House mode with no overlay provider configured fails loudly rather than silently returning the baseline number. Audit stays optional; overrides do not (explicit NoOverrides or a resolver, never silent skip).">
        <p>
          The customer-facing number is the <em>house</em> number. If the easy path returned the
          less conservative baseline, every host that forgot a flag would under-margin in
          production — a risk-control bug shipped as a default. Note the fine distinction you
          drew: audit is optional (its absence changes nothing about the number) but overrides
          are not (their absence silently changes the number) — optionality tracks whether the
          dependency can alter the result.
        </p>
      </Decision>

      <h3>Trace shape for decomposition — replay the search, not just the parts</h3>
      <Decision id="D5" doc="wire-l05-optimizer.md"
        q="A decomposed position produced N sub-evaluations. One trace per sub-position, or one decomposition trace wrapping them?"
        picked="One wrapping trace (Outcome = 'decomposed') carrying the N sub-traces, per-leg attribution, and the residual outcome; replay re-runs optimizer.Optimize and demands the regenerated PARTITION be byte-identical.">
        <p>
          Two reasons, one mechanical, one conceptual. Mechanical: N sub-traces sharing the
          parent's position ID and timestamp hash to the <em>same</em> trace_id — and the sink
          upserts, so N−1 of them silently vanish. Conceptual: the behavior under test is the{' '}
          <em>search</em> — which legs were grouped into which strategies. Scattered sub-traces
          could each replay individually while the partition that produced them is
          unreproducible. Record the unit you need to verify, not the fragments.
        </p>
      </Decision>

      <h3>How to take the next one</h3>
      <p>
        Distilling your own decision history into the checklist it implies — this is what every
        card above has in common:
      </p>
      <ol>
        <li><strong>Find the silent-wrong-number option first.</strong> In almost every fork, one
          option could produce a plausible-but-wrong result with no signal. Identify it and the
          decision usually takes itself.</li>
        <li><strong>State what each option protects, in domain terms.</strong> “Under-margining risk
          vs recon noise,” not “fewer files touched.”</li>
        <li><strong>Price it on a concrete position.</strong> $5,000 vs $10,000 on the 2× ETF beat
          any abstract argument.</li>
        <li><strong>Ask what the choice does to your measurement instruments</strong> — recon
          buckets, trace dedup, replay. Several of your best calls (calendar ordering, error-vs-NoRule
          taxonomy, the trace wrapper) were really about keeping the oracle clean.</li>
        <li><strong>Lock it in writing with its reasoning; supersede explicitly.</strong> The arc
          above only worked because every reversal cited what it replaced.</li>
      </ol>

      <h3>Self-check</h3>
      <Reveal q="Why must the engine never call time.Now(), in terms of what it would cost the project?">
        <p>It would be the engine's only nondeterministic effect: byte-identical replay becomes
          impossible without special-casing, the determinism property test weakens, and 'the
          engine changed behavior' stops being mechanically detectable. The caller stamps time
          because time is metadata about the call, not an input to the math.</p>
      </Reveal>
      <Reveal q="A recon run from last Monday replays differently today. Walk the diagnostic tree your design gives you.">
        <p>First check overrides_sha: mismatch → the store itself changed under the seal
          (corruption/manual edit — D2's loud failure). Seal matches → re-resolve with the pinned
          (as_of, txn_cutoff): a backdated correction has txn_time &gt; cutoff and is excluded,
          so resolution is identical — then the divergence is code, and rulebook_sha/engine
          version pin which code. Every layer has a hash that localizes the lie.</p>
      </Reveal>
      <Reveal q="Your team proposes adding a convenience: 'if no overlay provider is configured, just return the baseline number.' Argue against it from your own D6/D9.">
        <p>That makes the failure mode of a misconfigured host 'silently under-margin every
          customer' instead of 'fail at startup.' The default path must be the conservative
          number, and a missing dependency that would change the number must be loud. Convenience
          that converts loud failures into quiet number changes is the exact trade this SDK was
          designed to refuse.</p>
      </Reveal>
    </>
  )
}
