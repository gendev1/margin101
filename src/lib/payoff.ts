// Payoff-at-expiry math, mirroring how limen's CEL env sees a leg:
//   side: +1 long / -1 short
//   kind: 'call' | 'put' | 'stock'
//   K: strike, P: premium per share, qty: contracts, mult: shares per contract
//   stock legs use { basis, shares } instead of K/P/qty/mult

export interface OptionLeg {
  kind: 'call' | 'put'
  side: 1 | -1
  K: number
  P: number
  qty?: number
  mult?: number
}

export interface StockLeg {
  kind: 'stock'
  side: 1 | -1
  basis: number
  shares?: number
}

export type Leg = OptionLeg | StockLeg

export function intrinsicCall(K: number, u: number) { return Math.max(0, u - K) }
export function intrinsicPut(K: number, u: number) { return Math.max(0, K - u) }

export function legPayoffAt(leg: Leg, u: number): number {
  if (leg.kind === 'stock') {
    return leg.side * (u - leg.basis) * (leg.shares ?? 100)
  }
  const qty = leg.qty ?? 1
  const mult = leg.mult ?? 100
  const intrinsic = leg.kind === 'call' ? intrinsicCall(leg.K, u) : intrinsicPut(leg.K, u)
  return leg.side * (intrinsic - leg.P) * qty * mult
}

export function positionPayoffAt(legs: Leg[], u: number): number {
  return legs.reduce((s, l) => s + legPayoffAt(l, u), 0)
}

export interface ShortReqInput {
  U: number
  K: number
  P: number
  qty?: number
  mult?: number
  base?: number
  min?: number
  lev?: number
}

export interface ShortReqResult {
  basic: number
  minimum: number
  premium: number
  otm: number
  total: number
  binds: 'basic' | 'minimum'
}

// ---- the two naked-short requirement formulas from cboe_baseline.yaml ----
// short_call_req: qty*mult*(P + max(base*lev*U - OTM_call, min*lev*U))
export function shortCallReq({ U, K, P, qty = 1, mult = 100, base = 0.20, min = 0.10, lev = 1.0 }: ShortReqInput): ShortReqResult {
  const otm = Math.max(0, K - U)
  const basic = base * lev * U - otm
  const minimum = min * lev * U
  return {
    basic: qty * mult * basic,
    minimum: qty * mult * minimum,
    premium: qty * mult * P,
    otm: qty * mult * otm,
    total: qty * mult * (P + Math.max(basic, minimum)),
    binds: basic >= minimum ? 'basic' : 'minimum',
  }
}

// short_put_req: qty*mult*(P + max(base*lev*U - OTM_put, min*lev*K))
export function shortPutReq({ U, K, P, qty = 1, mult = 100, base = 0.20, min = 0.10, lev = 1.0 }: ShortReqInput): ShortReqResult {
  const otm = Math.max(0, U - K)
  const basic = base * lev * U - otm
  const minimum = min * lev * K
  return {
    basic: qty * mult * basic,
    minimum: qty * mult * minimum,
    premium: qty * mult * P,
    otm: qty * mult * otm,
    total: qty * mult * (P + Math.max(basic, minimum)),
    binds: basic >= minimum ? 'basic' : 'minimum',
  }
}

// Max potential loss across option legs, intrinsic-only (like mpl(legs)):
// evaluate at 0, every strike, and a far-right point; only meaningful if
// the position is limited-risk (bounded at both tails).
export function mplIntrinsic(legs: Leg[]): number {
  const strikes = legs.filter((l): l is OptionLeg => l.kind !== 'stock').map(l => l.K)
  const far = Math.max(...strikes) * 10
  const points = [0, ...strikes, far]
  let worst = 0
  for (const u of points) {
    const v = legs.reduce((s, l) => {
      if (l.kind === 'stock') return s
      const intr = l.kind === 'call' ? intrinsicCall(l.K, u) : intrinsicPut(l.K, u)
      return s + l.side * intr * (l.qty ?? 1) * (l.mult ?? 100)
    }, 0)
    if (v < worst) worst = v
  }
  return -worst
}

export const fmt = (n: number, dp = 2) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp })

export const fmt0 = (n: number) => fmt(n, n % 1 === 0 ? 0 : 2)
