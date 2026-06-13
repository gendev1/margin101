import type { ModuleDef, SectionDef, SectionWithModules } from './types'

import Home from './home'
import M0 from './m0.mdx'
import M1 from './m1.mdx'
import M2 from './m2.mdx'
import M3 from './m3.mdx'
import M4 from './m4.mdx'
import M5 from './m5.mdx'
import M6 from './m6.mdx'
import M7 from './m7.mdx'
import M8 from './m8.mdx'
import M9 from './m9.mdx'
import M10 from './m10'
import M11 from './m11'
import M12 from './m12.mdx'
import M13 from './m13.mdx'
import M14 from './m14.mdx'
import M15 from './m15.mdx'
import M16 from './m16.mdx'
import M17 from './m17.mdx'
import M18 from './m18.mdx'
import M19 from './m19.mdx'
import M20 from './m20.mdx'
import M21 from './m21.mdx'
import M22 from './m22.mdx'
import M23 from './m23.mdx'
import M24 from './m24.mdx'
import M25 from './m25.mdx'

// Section order IS the learning path: position math → account machine →
// account state → real-time → the other methodology → then the decision
// record, practice, and the map of what's left.
export const SECTIONS: SectionDef[] = [
  {
    id: 'desk',
    label: 'Study Desk',
    blurb: 'Use the app as a side tool while taking real margincalc decisions.',
  },
  {
    id: 'mechanics',
    label: 'Core Mechanics',
    blurb: 'How the strategy-based engine prices one position.',
  },
  {
    id: 'machine',
    label: 'The Account Machine',
    blurb: 'The built systems above the engine: aggregation, house policy, the optimizer.',
  },
  {
    id: 'state',
    label: 'Account State & Lifecycle',
    blurb: 'The stateful world limen feeds but does not own: SMA, buying power, margin calls.',
  },
  {
    id: 'realtime',
    label: 'Real-Time Margin',
    blurb: 'Pre-trade checks and intraday streaming — margin before and between the EOD runs.',
  },
  {
    id: 'risk',
    label: 'Risk-Based Margin',
    blurb: 'The other methodology: portfolio margin, TIMS mechanics, and the futures regime.',
  },
  {
    id: 'decisions',
    label: 'Decision Framework',
    blurb: 'Your locked decisions retaught, and the playbook for the next fork.',
  },
  {
    id: 'practice',
    label: 'Practice',
    blurb: 'Drills and study loops that make the rulebook and verdict taxonomy stick.',
  },
  {
    id: 'map',
    label: 'Platform Map',
    blurb: 'Where every system sits, what is built, and what comes next.',
  },
]

export const MODULES: ModuleDef[] = [
  {
    id: 'home',
    title: 'Study desk',
    subtitle: 'Use this as a sidecar for real decisions: where to start, what to read, and how to convert instinct into explicit reasoning',
    component: Home,
    section: 'desk',
    trackable: false,
    frame: {
      teaches: 'How to use the app in the middle of live work instead of treating it as a passive course.',
      unlocks: [
        'fast routing when you need the right concept without rereading everything',
        'short study loops that support real project decisions',
        'a cleaner handoff from intuition to written reasoning',
      ],
      planes: ['Plane 1 — Calculation kernel', 'Plane 2 — Verification', 'Plane 5 — Account state & lifecycle', 'Plane 6 — Integration & ops'],
    },
  },

  /* ---------------- Core Mechanics ---------------- */
  {
    id: 'm0',
    title: 'The language',
    subtitle: 'U, K, P, contracts, accounts, and the three numbers limen returns — from absolute zero',
    component: M0,
    section: 'mechanics',
    frame: {
      teaches: 'The shared nouns the engine, tests, and future data surfaces all depend on.',
      unlocks: [
        'reference-data schema decisions for class, leverage, multipliers, and account type',
        'corporate-actions thinking about what a contract actually represents',
        'host-input sufficiency checks before the engine ever runs',
      ],
      planes: ['Plane 1 — Calculation kernel', 'Plane 3 — Data plane'],
    },
  },
  {
    id: 'm1',
    title: 'Payoff pictures',
    subtitle: 'The four atoms, reading payoff diagrams, and the tail walk',
    component: M1,
    section: 'mechanics',
    frame: {
      teaches: 'Why bounded vs unbounded exposure is the first filter behind every safe margin design.',
      unlocks: [
        'limited-risk gates for new strategy families',
        'risk-based margin intuition before TIMS becomes a numerical model',
        'pre-trade product design that must explain what can still go wrong after a fill',
      ],
      planes: ['Plane 1 — Calculation kernel', 'Plane 4 — Real-time & pre-trade'],
    },
  },
  {
    id: 'm2',
    title: 'Pricing single legs',
    subtitle: 'Stock 50/25, short-stock tiers, long options, and the naked 20%/10% formula',
    component: M2,
    section: 'mechanics',
    frame: {
      teaches: 'What baseline regulation looks like before house policy, reference-data nuance, or workflow complexity gets layered on.',
      unlocks: [
        'baseline-vs-house boundary decisions',
        'leveraged ETF and special-instrument treatment without fake precision',
        'market-data and proceeds requirements that must fail loudly when absent',
      ],
      planes: ['Plane 1 — Calculation kernel', 'Plane 3 — Data plane', 'Plane 5 — Account state & lifecycle'],
    },
  },
  {
    id: 'm3',
    title: 'Spreads & time',
    subtitle: 'MPL, the vertical worked end-to-end, calendars, and the reverse-calendar trap',
    component: M3,
    section: 'mechanics',
    frame: {
      teaches: 'Why time structure is part of soundness, not just arithmetic.',
      unlocks: [
        'expiry-order rules and calendar handling in future strategy work',
        'recon decisions where over-margining can poison the oracle',
        'TIMS-era thinking about when exact-match comparison stops being enough',
      ],
      planes: ['Plane 1 — Calculation kernel', 'Plane 2 — Verification'],
    },
  },
  {
    id: 'm4',
    title: 'Stock hedges',
    subtitle: 'Coverage arithmetic, covered calls, protective puts, collars, conversions',
    component: M4,
    section: 'mechanics',
    frame: {
      teaches: 'How hedges stop being stories and become precise coverage claims the system has to verify.',
      unlocks: [
        'optimizer authority versus rule-level shortcutting',
        'corporate-actions pressure on coverage math and adjusted deliverables',
        'host workflows that need to explain why a position was refused as mispaired',
      ],
      planes: ['Plane 1 — Calculation kernel', 'Plane 3 — Data plane', 'Plane 6 — Integration & ops'],
    },
  },
  {
    id: 'm5',
    title: 'Limited risk & the catch-all',
    subtitle: 'mpl(), is_limited_risk, butterflies, boxes, and why rule order is semantics',
    component: M5,
    section: 'mechanics',
    frame: {
      teaches: 'Why precedence, soundness guards, and catch-all rules are architecture decisions, not just syntax.',
      unlocks: [
        'new rule-family authoring without accidentally shadowing safer specific logic',
        'numerical-model planning for TIMS where the oracle shape changes',
        'future review habits around when a fallback is conservative and when it is lying',
      ],
      planes: ['Plane 1 — Calculation kernel', 'Plane 2 — Verification', 'Plane 6 — Integration & ops'],
    },
  },
  {
    id: 'm6',
    title: 'The engine',
    subtitle: 'Slots, constraints vs requires, verdicts, decomposition, and recon — the codebase map',
    component: M6,
    section: 'mechanics',
    frame: {
      teaches: 'The actual seams in the codebase: what belongs in rules, what belongs in the optimizer, and what belongs outside the engine.',
      unlocks: [
        'host-vs-core boundary decisions',
        'bridge, recon, and trace design that keep correctness measurable',
        'future decomposition, pre-trade, and replay work without mixing concerns',
      ],
      planes: ['Plane 1 — Calculation kernel', 'Plane 2 — Verification', 'Plane 6 — Integration & ops'],
    },
  },

  /* ---------------- The Account Machine ---------------- */
  {
    id: 'm14',
    title: 'Account aggregation',
    subtitle: 'LMV, SMV, equity, excess — how position results roll into the one number the business runs on',
    component: M14,
    section: 'machine',
  },
  {
    id: 'm15',
    title: 'House overlay & overrides',
    subtitle: 'Baseline vs policy, the four raise-only modes, ops vs engineer authorship, and the bitemporal store — from zero',
    component: M15,
    section: 'machine',
  },
  {
    id: 'm25',
    title: 'Add-ons in practice',
    subtitle: 'The eight add-ons every serious desk runs — concentration, liquidity, HTB, event risk — with worked dollars and where the numbers come from',
    component: M25,
    section: 'machine',
  },
  {
    id: 'm16',
    title: 'The optimizer (B&B)',
    subtitle: 'Why grouping legs is worth real money, branch-and-bound from zero, and the search frontier',
    component: M16,
    section: 'machine',
  },

  /* ---------------- Account State & Lifecycle ---------------- */
  {
    id: 'm17',
    title: 'SMA & buying power',
    subtitle: 'The Reg-T ledger with the ratchet: a four-day worked example, and why 41.7% equity can be legal',
    component: M17,
    section: 'state',
  },
  {
    id: 'm21',
    title: 'Margin-call lifecycle',
    subtitle: 'Fed, maintenance, and day-trade calls: what triggers each, what cures each, and the state machine to liquidation',
    component: M21,
    section: 'state',
  },

  /* ---------------- Real-Time Margin ---------------- */
  {
    id: 'm18',
    title: 'Pre-trade check & what-if',
    subtitle: 'Simulate the fill, price the projection, compare the delta — the margin feature customers actually feel',
    component: M18,
    section: 'realtime',
  },
  {
    id: 'm19',
    title: 'Intraday streaming re-evaluation',
    subtitle: 'Closing the EOD blind spot: dirty-marking, warning bands, and why purity makes it feasible',
    component: M19,
    section: 'realtime',
  },

  /* ---------------- Risk-Based Margin ---------------- */
  {
    id: 'm20',
    title: 'Risk-based margin: the idea',
    subtitle: 'Strategy-based vs risk-based from first principles — who gets portfolio margin, why it is lower, and what assumption it buys that with',
    component: M20,
    section: 'risk',
  },
  {
    id: 'm24',
    title: 'Portfolio margin: the account',
    subtitle: 'Eligibility gates, the 6.6:1 leverage arithmetic, buying power without SMA, and the downgrade cliff',
    component: M24,
    section: 'risk',
  },
  {
    id: 'm22',
    title: 'TIMS: the scenario grid',
    subtitle: 'The full mechanics: grids, class groups, theoretical repricing, offsets, concentration — with two worked grids',
    component: M22,
    section: 'risk',
  },
  {
    id: 'm23',
    title: 'SPAN & futures margin',
    subtitle: 'Futures margin from zero, then SPAN: risk arrays, the 16 scenarios, charges and credits — and the buy-vs-build reality',
    component: M23,
    section: 'risk',
  },

  /* ---------------- Decision Framework ---------------- */
  {
    id: 'm8',
    title: 'Your decisions: the number',
    subtitle: 'Every margin-semantics decision you locked, retaught — fail-loud, coverage, gross/proceeds, baseline vs house',
    component: M8,
    section: 'decisions',
    frame: {
      teaches: 'The rule for future forks: a wrong number is worse than no number.',
      unlocks: [
        'safe refusal semantics for new rule families',
        'baseline-versus-policy classification for future product asks',
        'sound optimizer and coverage decisions when evidence contradicts old locks',
      ],
      planes: ['Plane 1 — Calculation kernel', 'Plane 2 — Verification', 'Plane 5 — Account state & lifecycle'],
    },
  },
  {
    id: 'm9',
    title: 'Your decisions: the system',
    subtitle: 'Purity, content addressing, bitemporality, the SDK boundary — and how your decisions superseded each other',
    component: M9,
    section: 'decisions',
    frame: {
      teaches: 'The rules that keep the proof reproducible after the number leaves the engine.',
      unlocks: [
        'SDK boundary calls for pre-trade, dashboards, and bridge services',
        'bitemporal and trace guarantees for future stateful systems',
        'how to supersede architecture decisions without erasing why they changed',
      ],
      planes: ['Plane 2 — Verification', 'Plane 5 — Account state & lifecycle', 'Plane 6 — Integration & ops'],
    },
  },
  {
    id: 'm13',
    title: 'Decision playbook',
    subtitle: 'How to classify the next margincalc decision: engine, optimizer, policy, data, state, workflow, or model',
    component: M13,
    section: 'decisions',
    frame: {
      teaches: 'A reusable method for turning a fuzzy future-system idea into a concrete architectural decision.',
      unlocks: [
        'faster classification of roadmapped work',
        'cleaner ADRs because the tradeoff language is already structured',
        'less reliance on unspoken instinct when the subsystem type changes',
      ],
      planes: ['Plane 1 — Calculation kernel', 'Plane 2 — Verification', 'Plane 5 — Account state & lifecycle', 'Plane 6 — Integration & ops'],
    },
  },

  /* ---------------- Practice ---------------- */
  {
    id: 'm7',
    title: 'Study plan & drills',
    subtitle: 'Your 60 hours, three drill sets with answers, and the proficiency proof',
    component: M7,
    section: 'practice',
    frame: {
      teaches: 'The repetition loop needed to turn static understanding into real debugging and rule-authoring skill.',
      unlocks: [
        'faster corpus triage when new findings appear',
        'better ADR writing because the formulas stay live in memory',
        'confident hand-checking before you trust bridge or vendor differences',
      ],
      planes: ['Plane 2 — Verification', 'Plane 6 — Integration & ops'],
    },
  },
  {
    id: 'm10',
    title: 'Corpus drills',
    subtitle: '435 real cases from the verification corpus — compute the number, name the verdict, score yourself against the oracle',
    component: M10,
    section: 'practice',
    frame: {
      teaches: 'The two real muscles: derive the number and classify the verdict.',
      unlocks: [
        'future corpus expansion for optimizer and TIMS work',
        'recon triage instincts when a vendor difference is a bug versus a coverage gap',
        'confidence to propose a rule fix before reading the existing ADR',
      ],
      planes: ['Plane 2 — Verification', 'Plane 4 — Real-time & pre-trade'],
    },
  },

  /* ---------------- Platform Map ---------------- */
  {
    id: 'm11',
    title: 'The whole map',
    subtitle: 'The complete 3-year margin platform, every subsystem colored by status — what you built, what’s left, and which kind of work each gray box is',
    component: M11,
    section: 'map',
    frame: {
      teaches: 'How to classify the next build step by discipline, ownership boundary, and risk.',
      unlocks: [
        'sequencing between amber work and the first worthwhile gray box',
        'honest scoping of host-owned workflow work versus engine work',
        'planning for the two new disciplines ahead: numerical models and stateful ledgers',
      ],
      planes: ['Plane 1 — Calculation kernel', 'Plane 2 — Verification', 'Plane 3 — Data plane', 'Plane 4 — Real-time & pre-trade', 'Plane 5 — Account state & lifecycle', 'Plane 6 — Integration & ops'],
    },
  },
  {
    id: 'm12',
    title: 'The missing systems',
    subtitle: 'TIMS, B&B, overlays, SPAN, aggregation, SMA, and call lifecycle — the side-by-side classification summary',
    component: M12,
    section: 'map',
    frame: {
      teaches: 'The gray and amber boxes that matter next, in plain terms: what problem each one solves, what discipline it belongs to, and what the current engine already buys you.',
      unlocks: [
        'clear separation between pure calculation work and host/stateful workflow work',
        'better sequencing between optimizer hardening, TIMS research, and post-calculation bookkeeping',
        'the ability to discuss future systems without collapsing them into one vague “roadmap” bucket',
      ],
      planes: ['Plane 1 — Calculation kernel', 'Plane 4 — Real-time & pre-trade', 'Plane 5 — Account state & lifecycle', 'Plane 6 — Integration & ops'],
    },
  },
]

export const MODULES_BY_SECTION: SectionWithModules[] = SECTIONS.map(section => ({
  ...section,
  modules: MODULES.filter(module => module.section === section.id),
}))
