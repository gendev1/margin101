import { useId } from 'react'
import { positionPayoffAt } from '../lib/payoff.js'

// Interactive-friendly SVG payoff-at-expiry chart.
// props: legs, lo, hi, title, height, annotations [{u,label}], showTail
export default function PayoffChart({ legs, lo, hi, title, height = 250, annotations = [], showTail = false }) {
  const cid = useId().replace(/:/g, '')
  const W = 640, H = height
  const padL = 64, padR = 20, padT = 26, padB = 34
  const iw = W - padL - padR, ih = H - padT - padB

  const N = 320
  const us = Array.from({ length: N + 1 }, (_, i) => lo + (hi - lo) * i / N)
  const ys = us.map(u => positionPayoffAt(legs, u))
  let ymin = Math.min(0, ...ys), ymax = Math.max(0, ...ys)
  if (ymax === ymin) { ymax += 1; ymin -= 1 }
  const span = ymax - ymin
  ymax += span * 0.12; ymin -= span * 0.12

  const X = u => padL + (u - lo) / (hi - lo) * iw
  const Y = v => padT + (ymax - v) / (ymax - ymin) * ih
  const y0 = Y(0)

  const linePts = us.map((u, i) => `${X(u).toFixed(1)},${Y(ys[i]).toFixed(1)}`).join(' ')
  const areaPts = `${linePts} ${X(hi).toFixed(1)},${y0.toFixed(1)} ${X(lo).toFixed(1)},${y0.toFixed(1)}`

  // breakevens: sign changes with linear interpolation
  const bes = []
  for (let i = 1; i <= N; i++) {
    if ((ys[i - 1] < 0 && ys[i] >= 0) || (ys[i - 1] > 0 && ys[i] <= 0)) {
      const t = ys[i - 1] / (ys[i - 1] - ys[i])
      bes.push(us[i - 1] + t * (us[i] - us[i - 1]))
    }
  }

  const strikes = [...new Set(legs.filter(l => l.kind !== 'stock').map(l => l.K))]
    .filter(k => k >= lo && k <= hi)

  const tailFalling = ys[N] < 0 && ys[N] < ys[N - 8]
  const tailRising = ys[N] > 0 && ys[N] > ys[N - 8]

  const yticks = [ymin + (ymax - ymin) * 0.12, 0, ymax - (ymax - ymin) * 0.12]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }} role="img" aria-label={title}>
      <defs>
        <clipPath id={`above-${cid}`}><rect x={padL} y={padT - 4} width={iw} height={Math.max(0, y0 - padT + 4)} /></clipPath>
        <clipPath id={`below-${cid}`}><rect x={padL} y={y0} width={iw} height={Math.max(0, padT + ih - y0 + 4)} /></clipPath>
      </defs>

      <rect x="0" y="0" width={W} height={H} fill="#0d1526" rx="10" />
      {title && <text x={padL} y={17} fill="#8fa3c4" fontSize="12">{title}</text>}

      {/* profit / loss shading */}
      <polygon points={areaPts} fill="#51d88a" opacity="0.13" clipPath={`url(#above-${cid})`} />
      <polygon points={areaPts} fill="#ff7b7b" opacity="0.15" clipPath={`url(#below-${cid})`} />

      {/* zero line */}
      <line x1={padL} y1={y0} x2={W - padR} y2={y0} stroke="#3b4d77" strokeWidth="1" />
      <text x={padL - 8} y={y0 + 4} fill="#8fa3c4" fontSize="11" textAnchor="end">$0</text>

      {/* y ticks */}
      {yticks.filter(v => Math.abs(v) > 1e-9).map((v, i) => (
        <g key={i}>
          <line x1={padL} y1={Y(v)} x2={W - padR} y2={Y(v)} stroke="#1d2a47" strokeWidth="1" />
          <text x={padL - 8} y={Y(v) + 4} fill="#5f7398" fontSize="10.5" textAnchor="end">
            {v >= 0 ? '+' : '−'}${Math.abs(Math.round(v)).toLocaleString()}
          </text>
        </g>
      ))}

      {/* strikes */}
      {strikes.map(k => (
        <g key={k}>
          <line x1={X(k)} y1={padT} x2={X(k)} y2={padT + ih} stroke="#3b4d77" strokeWidth="1" strokeDasharray="3 4" />
          <text x={X(k)} y={H - 8} fill="#ffc94d" fontSize="11" textAnchor="middle">K={k}</text>
        </g>
      ))}

      {/* payoff line */}
      <polyline points={linePts} fill="none" stroke="#4cc3ff" strokeWidth="2.4" strokeLinejoin="round" />

      {/* breakevens */}
      {bes.map((b, i) => (
        <g key={i}>
          <circle cx={X(b)} cy={y0} r="4.5" fill="#0d1526" stroke="#51d88a" strokeWidth="2" />
          <text x={X(b)} y={y0 - 10} fill="#51d88a" fontSize="11" textAnchor="middle">{b.toFixed(b < 10 ? 2 : 1)}</text>
        </g>
      ))}

      {/* annotations */}
      {annotations.map((a, i) => (
        <g key={i}>
          <line x1={X(a.u)} y1={padT} x2={X(a.u)} y2={padT + ih} stroke="#ffc94d" strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />
          <text x={X(a.u)} y={padT + 12 + i * 13} fill="#ffc94d" fontSize="11" textAnchor="middle">{a.label}</text>
        </g>
      ))}

      {/* tail warnings */}
      {showTail && tailFalling && (
        <text x={W - padR - 4} y={Y(ys[N]) - 10} fill="#ff7b7b" fontSize="12" textAnchor="end" fontWeight="bold">
          loss keeps growing →
        </text>
      )}
      {showTail && tailRising && (
        <text x={W - padR - 4} y={Y(ys[N]) + 16} fill="#51d88a" fontSize="12" textAnchor="end">
          gain keeps growing →
        </text>
      )}

      {/* x extremes */}
      <text x={padL} y={H - 8} fill="#5f7398" fontSize="11" textAnchor="start">U={lo}</text>
      <text x={W - padR} y={H - 8} fill="#5f7398" fontSize="11" textAnchor="end">U={hi}</text>
    </svg>
  )
}
