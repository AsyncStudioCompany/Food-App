import type { CSSProperties, ReactNode } from 'react'
import type { StepKind } from '../domain/steps'

// Palette of the illustrations (soir theme).
const PAN = '#050404'
const YOLK = 'oklch(0.82 0.16 80)'
const TOMATO = 'oklch(0.63 0.19 32)'
const LEAF = 'oklch(0.62 0.14 140)'
const ONION = 'oklch(0.86 0.05 85)'
const WOOD = 'oklch(0.72 0.08 65)'
const FLAME = 'oklch(0.76 0.17 60)'
const PLATE = '#fffaf0'
const ACCENT = 'var(--accent)'

/** Absolutely positioned shape. */
const A = ({ s, children }: { s: CSSProperties; children?: ReactNode }) => <div style={s}>{children}</div>

const steam = (x0: number, y0: number, big: boolean, color: string) =>
  [0, 1, 2].map((i) => (
    <A
      key={'st' + i}
      s={
        big
          ? { left: x0 + i * 13, top: y0, width: 5, height: 18, borderRadius: 3, background: color, opacity: 0, animation: `mj-steam 2.4s ease-in-out ${i * 0.55}s infinite` }
          : { left: x0 + i * 8, top: y0, width: 4, height: 12, borderRadius: 2, background: color, opacity: 0, animation: `mj-steam 2.2s ease-in-out ${i * 0.5}s infinite` }
      }
    />
  ))

const sparkles = (pts: [number, number, number][], size: number) =>
  pts.map(([x, y, d], i) => (
    <A key={'sp' + i} s={{ left: x, top: y, width: size, height: size, background: YOLK, animation: `mj-twinkle 1.6s ease-in-out ${d}s infinite` }} />
  ))

const flames = (x0: number, dx: number, top: number, w: number, h: number) =>
  [0, 1, 2].map((i) => (
    <A
      key={'fl' + i}
      s={{ left: x0 + i * dx, top, width: w, height: h, borderRadius: '50% 50% 45% 45% / 65% 65% 35% 35%', background: FLAME, transformOrigin: 'bottom', animation: `mj-flicker .8s ease-in-out ${i * 0.2}s infinite alternate` }}
    />
  ))

export type MoodKind = 'ready' | 'missing' | 'cooking' | 'done'

/** 104 × 92 illustration of the mood card (and ×2 on the "Bon appétit !" screen). */
export function MoodIllustration({ kind, count = 0, scale }: { kind: MoodKind; count?: number; scale?: number }) {
  const steamCol = 'rgba(255,255,255,.45)'
  let kids: ReactNode = null
  if (kind === 'ready')
    kids = (
      <>
        {steam(32, 2, true, steamCol)}
        <A s={{ left: 12, top: 26, width: 64, height: 64, borderRadius: '50%', background: PAN, boxShadow: 'inset 0 0 0 5px rgba(255,255,255,.07)' }} />
        <A s={{ left: 70, top: 52, width: 32, height: 11, borderRadius: 6, background: PAN }} />
        <A s={{ left: 25, top: 39, width: 38, height: 36, borderRadius: '48% 52% 44% 56%', background: PLATE, animation: 'mj-bob 2.6s ease-in-out infinite' }}>
          <A s={{ left: 12, top: 10, width: 15, height: 15, borderRadius: '50%', background: YOLK }} />
        </A>
      </>
    )
  if (kind === 'missing')
    kids = (
      <>
        <A s={{ left: 30, top: 10, width: 16, height: 32, borderRadius: '50%', background: LEAF, transform: 'rotate(-18deg)' }} />
        <A s={{ left: 47, top: 14, width: 24, height: 24, borderRadius: '50%', background: TOMATO }} />
        <A s={{ left: 20, top: 28, width: 60, height: 62, borderRadius: '6px 6px 14px 14px', background: 'oklch(0.76 0.07 70)' }}>
          <A s={{ left: 0, top: 0, right: 0, height: 10, borderRadius: '6px 6px 0 0', background: 'oklch(0.67 0.07 65)' }} />
        </A>
        <A s={{ left: 70, top: 16, width: 28, height: 28, borderRadius: '50%', background: 'var(--miss)', color: '#fff', font: '700 14px var(--font)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'mj-pop 1.8s ease-in-out infinite' }}>
          {String(count)}
        </A>
      </>
    )
  if (kind === 'cooking')
    kids = (
      <>
        {steam(34, 0, true, steamCol)}
        {[0, 1, 2].map((i) => (
          <A key={'bb' + i} s={{ left: 30 + i * 14, top: 14, width: 8, height: 8, borderRadius: '50%', border: '2px solid ' + steamCol, opacity: 0, animation: `mj-bubble 1.6s ease-out ${i * 0.4}s infinite` }} />
        ))}
        <A s={{ left: 18, top: 34, width: 68, height: 44, borderRadius: '6px 6px 22px 22px', background: ACCENT }} />
        <A s={{ left: 10, top: 30, width: 84, height: 9, borderRadius: 5, background: PAN }} />
        {flames(32, 15, 80, 10, 12)}
      </>
    )
  if (kind === 'done')
    kids = (
      <>
        <A s={{ left: 12, top: 10, width: 80, height: 80, borderRadius: '50%', background: PLATE, boxShadow: 'inset 0 0 0 7px rgba(0,0,0,.06), 0 6px 14px rgba(0,0,0,.12)' }} />
        <A s={{ left: 30, top: 34, width: 32, height: 32, borderRadius: '50%', background: TOMATO }} />
        <A s={{ left: 50, top: 42, width: 22, height: 22, borderRadius: '50%', background: YOLK }} />
        <A s={{ left: 36, top: 26, width: 10, height: 20, borderRadius: '50%', background: LEAF, transform: 'rotate(32deg)' }} />
        {sparkles([[4, 8, 0], [92, 20, 0.5], [86, 76, 1]], 10)}
      </>
    )
  return (
    <div className="illu" aria-hidden="true" style={{ width: 104, height: 92, transform: scale ? `scale(${scale})` : undefined, transformOrigin: 'top left' }}>
      {kids}
    </div>
  )
}

/** 68 × 60 illustration of a step card. */
export function StepIllustration({ kind }: { kind: StepKind }) {
  const sc = 'rgba(255,255,255,.4)'
  let k: ReactNode = null
  if (kind === 'cut')
    k = (
      <>
        <A s={{ left: 6, top: 38, width: 54, height: 13, borderRadius: 4, background: WOOD }} />
        {([[10, ONION], [20, TOMATO], [30, LEAF]] as const).map(([x, c], i) => (
          <A key={'v' + i} s={{ left: x, top: 31, width: 9, height: 9, borderRadius: '50%', background: c }} />
        ))}
        <A s={{ left: 42, top: 6, width: 10, height: 32, transformOrigin: 'bottom center', animation: 'mj-chop .9s ease-in-out infinite' }}>
          <A s={{ left: 0, top: 11, width: 10, height: 20, borderRadius: '1px 1px 8px 1px', background: '#e4e1db' }} />
          <A s={{ left: 2, top: 0, width: 6, height: 12, borderRadius: 2, background: PAN }} />
        </A>
      </>
    )
  if (kind === 'pan')
    k = (
      <>
        {steam(16, 2, false, sc)}
        <A s={{ left: 6, top: 20, width: 36, height: 36, borderRadius: '50%', background: PAN }} />
        <A s={{ left: 38, top: 34, width: 24, height: 8, borderRadius: 4, background: PAN }} />
        {([[14, 30, 'oklch(0.72 0.05 60)'], [24, 36, ONION], [18, 42, LEAF]] as const).map(([x, y, c], i) => (
          <A key={'b' + i} s={{ left: x, top: y, width: 8, height: 8, borderRadius: '50%', background: c, animation: `mj-bob 1.2s ease-in-out ${i * 0.3}s infinite` }} />
        ))}
      </>
    )
  if (kind === 'pot')
    k = (
      <>
        {steam(22, 0, false, sc)}
        {[0, 1].map((i) => (
          <A key={'bb' + i} s={{ left: 26 + i * 10, top: 12, width: 6, height: 6, borderRadius: '50%', border: '1.5px solid ' + sc, opacity: 0, animation: `mj-bubble 1.5s ease-out ${i * 0.5}s infinite` }} />
        ))}
        <A s={{ left: 14, top: 26, width: 40, height: 24, borderRadius: '4px 4px 14px 14px', background: ACCENT }} />
        <A s={{ left: 10, top: 23, width: 48, height: 6, borderRadius: 3, background: PAN }} />
        {flames(23, 9, 51, 6, 7)}
      </>
    )
  if (kind === 'oven')
    k = (
      <A s={{ left: 12, top: 8, width: 44, height: 44, borderRadius: 8, background: PAN }}>
        <A s={{ left: 7, top: 5, width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,.35)' }} />
        <A s={{ left: 16, top: 5, width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,.35)' }} />
        <A s={{ left: 6, top: 15, width: 32, height: 22, borderRadius: 4, background: 'oklch(0.72 0.17 55)', animation: 'mj-glow 1.6s ease-in-out infinite alternate' }} />
      </A>
    )
  if (kind === 'mix')
    k = (
      <>
        <A s={{ left: 34, top: 4, width: 5, height: 34, borderRadius: 3, background: WOOD, transformOrigin: 'bottom center', animation: 'mj-stir 1.3s ease-in-out infinite alternate' }} />
        <A s={{ left: 12, top: 29, width: 44, height: 22, borderRadius: '0 0 22px 22px', background: ACCENT }} />
        <A s={{ left: 9, top: 26, width: 50, height: 5, borderRadius: 3, background: PAN }} />
      </>
    )
  if (kind === 'rest')
    k = (
      <>
        {/* Stopwatch centred in the 68 × 60 tile: 36 px dial with a 3 px border, so its inner centre is (15, 15). */}
        <A s={{ left: 30, top: 5, width: 8, height: 6, borderRadius: 2, background: PAN }} />
        <A s={{ left: 45, top: 10, width: 5, height: 7, borderRadius: 2, background: PAN, transform: 'rotate(40deg)' }} />
        <A s={{ left: 16, top: 11, width: 36, height: 36, borderRadius: '50%', border: '3px solid ' + PAN, background: PLATE }}>
          {([[14, 2, 2, 4], [14, 24, 2, 4], [2, 14, 4, 2], [24, 14, 4, 2]] as const).map(([x, y, w, h], i) => (
            <A key={'t' + i} s={{ left: x, top: y, width: w, height: h, borderRadius: 1, background: 'rgba(0,0,0,.28)' }} />
          ))}
          <A s={{ left: 13.5, top: 4, width: 3, height: 11, borderRadius: 2, background: ACCENT, transformOrigin: '50% 100%', animation: 'mj-spin 3s linear infinite' }} />
          <A s={{ left: 12, top: 12, width: 6, height: 6, borderRadius: '50%', background: PAN }} />
        </A>
      </>
    )
  if (kind === 'plate')
    k = (
      <>
        <A s={{ left: 13, top: 9, width: 42, height: 42, borderRadius: '50%', background: PLATE, boxShadow: 'inset 0 0 0 4px rgba(0,0,0,.06)' }} />
        <A s={{ left: 24, top: 20, width: 16, height: 16, borderRadius: '50%', background: TOMATO }} />
        <A s={{ left: 34, top: 25, width: 11, height: 11, borderRadius: '50%', background: YOLK }} />
        {sparkles([[6, 8, 0], [56, 14, 0.6], [52, 46, 1.1]], 6)}
      </>
    )
  if (kind === 'whisk')
    k = (
      <>
        {[0, 1, 2].map((i) => (
          <A key={'f' + i} s={{ left: 18 + i * 11, top: 22, width: 7, height: 7, borderRadius: '50%', background: PLATE, animation: `mj-bob 1s ease-in-out ${i * 0.25}s infinite` }} />
        ))}
        <A s={{ left: 30, top: 0, width: 12, height: 34, transformOrigin: 'bottom center', animation: 'mj-stir .7s ease-in-out infinite alternate' }}>
          <A s={{ left: 4, top: 0, width: 4, height: 12, borderRadius: 2, background: PAN }} />
          <A s={{ left: 0, top: 11, width: 12, height: 22, borderRadius: '50% 50% 45% 45%', border: '2px solid #e4e1db' }} />
          <A s={{ left: 3, top: 11, width: 6, height: 22, borderRadius: '50%', border: '2px solid #e4e1db' }} />
        </A>
        <A s={{ left: 12, top: 29, width: 44, height: 22, borderRadius: '0 0 22px 22px', background: ACCENT }} />
        <A s={{ left: 9, top: 26, width: 50, height: 5, borderRadius: 3, background: PAN }} />
      </>
    )
  if (kind === 'blend')
    k = (
      <>
        <A s={{ left: 20, top: 4, width: 28, height: 38, borderRadius: '4px 4px 8px 8px', background: 'rgba(255,255,255,.18)', border: '2px solid rgba(255,255,255,.45)', overflow: 'hidden' }}>
          <A s={{ left: -2, top: 14, width: 28, height: 24, background: ACCENT }} />
          <A s={{ left: 6, top: 22, width: 12, height: 3, borderRadius: 2, background: PAN, animation: 'mj-spin .5s linear infinite' }} />
        </A>
        <A s={{ left: 16, top: 42, width: 36, height: 14, borderRadius: 4, background: PAN }} />
        <A s={{ left: 31, top: 46, width: 6, height: 6, borderRadius: '50%', background: FLAME, animation: 'mj-glow 1s ease-in-out infinite alternate' }} />
      </>
    )
  if (kind === 'fry')
    k = (
      <>
        {[0, 1, 2].map((i) => (
          <A key={'o' + i} s={{ left: 20 + i * 10, top: 16, width: 5, height: 5, borderRadius: '50%', border: '1.5px solid ' + YOLK, opacity: 0, animation: `mj-bubble 1.1s ease-out ${i * 0.35}s infinite` }} />
        ))}
        <A s={{ left: 12, top: 24, width: 44, height: 26, borderRadius: '4px 4px 16px 16px', background: PAN, overflow: 'hidden' }}>
          <A s={{ left: 0, top: 0, width: 44, height: 9, background: YOLK, opacity: 0.85 }} />
          <A s={{ left: 12, top: -2, width: 14, height: 9, borderRadius: 5, background: 'oklch(0.7 0.13 65)', animation: 'mj-bob 1s ease-in-out infinite' }} />
        </A>
        {flames(23, 9, 51, 6, 7)}
      </>
    )
  if (kind === 'grill')
    k = (
      <>
        {steam(20, 0, false, sc)}
        <A s={{ left: 16, top: 22, width: 34, height: 12, borderRadius: 6, background: TOMATO, animation: 'mj-bob 1.4s ease-in-out infinite' }}>
          {[8, 16, 24].map((x) => (
            <A key={'m' + x} s={{ left: x, top: 2, width: 2, height: 8, borderRadius: 1, background: PAN, transform: 'rotate(20deg)' }} />
          ))}
        </A>
        {[0, 1, 2].map((i) => (
          <A key={'g' + i} s={{ left: 8, top: 36 + i * 5, width: 52, height: 2, borderRadius: 1, background: PAN }} />
        ))}
        {flames(18, 12, 50, 8, 8)}
      </>
    )
  if (kind === 'chill')
    k = (
      <>
        <A s={{ left: 18, top: 4, width: 32, height: 52, borderRadius: 7, background: PLATE }}>
          <A s={{ left: 0, top: 17, width: 32, height: 2, background: 'rgba(0,0,0,.15)' }} />
          <A s={{ left: 25, top: 6, width: 3, height: 8, borderRadius: 2, background: PAN }} />
          <A s={{ left: 25, top: 24, width: 3, height: 12, borderRadius: 2, background: PAN }} />
        </A>
        {([[6, 10, 0], [54, 20, 0.5], [8, 40, 1]] as const).map(([x, y, d], i) => (
          <A key={'sn' + i} s={{ left: x, top: y, width: 6, height: 6, background: 'oklch(0.85 0.06 230)', animation: `mj-twinkle 1.8s ease-in-out ${d}s infinite` }} />
        ))}
      </>
    )
  if (kind === 'dough')
    k = (
      <>
        <A s={{ left: 4, top: 40, width: 60, height: 12, borderRadius: 4, background: WOOD }} />
        <A s={{ left: 14, top: 33, width: 40, height: 9, borderRadius: '50%', background: ONION }} />
        <A s={{ left: 8, top: 22, width: 52, height: 10, animation: 'mj-roll 1.4s ease-in-out infinite alternate' }}>
          <A s={{ left: 0, top: 3, width: 8, height: 4, borderRadius: 2, background: PAN }} />
          <A s={{ left: 8, top: 0, width: 36, height: 10, borderRadius: 5, background: 'oklch(0.8 0.07 70)' }} />
          <A s={{ left: 44, top: 3, width: 8, height: 4, borderRadius: 2, background: PAN }} />
        </A>
      </>
    )
  if (kind === 'season')
    k = (
      <>
        <A s={{ left: 26, top: 2, width: 16, height: 28, transformOrigin: 'bottom center', animation: 'mj-stir .9s ease-in-out infinite alternate' }}>
          <A s={{ left: 0, top: 0, width: 16, height: 8, borderRadius: '8px 8px 2px 2px', background: PAN }} />
          <A s={{ left: 1, top: 8, width: 14, height: 20, borderRadius: 3, background: PLATE }} />
        </A>
        {[0, 1, 2].map((i) => (
          <A key={'gr' + i} s={{ left: 28 + i * 5, top: 32, width: 3, height: 3, borderRadius: 1, background: PLATE, animation: `mj-fall 1s ease-in ${i * 0.3}s infinite` }} />
        ))}
        <A s={{ left: 12, top: 46, width: 44, height: 8, borderRadius: '50%', background: ACCENT }} />
      </>
    )
  if (kind === 'drain')
    k = (
      <>
        <A s={{ left: 12, top: 12, width: 44, height: 24, borderRadius: '0 0 22px 22px', background: ACCENT }}>
          {[8, 16, 24, 32].map((x) => (
            <A key={'h' + x} s={{ left: x, top: 12, width: 3, height: 3, borderRadius: '50%', background: PAN }} />
          ))}
        </A>
        <A s={{ left: 8, top: 9, width: 52, height: 5, borderRadius: 3, background: PAN }} />
        {[0, 1, 2].map((i) => (
          <A key={'d' + i} s={{ left: 22 + i * 10, top: 38, width: 4, height: 6, borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', background: 'oklch(0.75 0.1 230)', animation: `mj-fall 1.1s ease-in ${i * 0.35}s infinite` }} />
        ))}
      </>
    )
  return (
    <div className="illu" aria-hidden="true" style={{ position: 'absolute', inset: 0 }}>
      {k}
    </div>
  )
}
