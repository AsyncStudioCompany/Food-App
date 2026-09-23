import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'

const SCREEN = { width: 440, height: 956 } // iPhone 16 Pro Max, en points
const BEZEL = 12

function useFrameScale(): number | null {
  const compute = () => {
    if (window.innerWidth < 720) return null
    return Math.min(1, (window.innerHeight - 48) / (SCREEN.height + BEZEL * 2))
  }
  const [scale, setScale] = useState(compute)
  useEffect(() => {
    const onResize = () => setScale(compute())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return scale
}

/** Sur grand écran, affiche l'app dans un iPhone 16 Pro Max ; sur téléphone, l'app prend tout l'écran. */
export function DeviceFrame({ children }: { children: ReactNode }) {
  const scale = useFrameScale()
  if (scale === null) return <>{children}</>
  return (
    <div className="flex min-h-full items-center justify-center py-6">
      <div
        style={{ width: SCREEN.width + BEZEL * 2, height: SCREEN.height + BEZEL * 2, zoom: scale }}
        className="rounded-[70px] bg-stone-700 p-3 shadow-[0_40px_80px_rgba(0,0,0,0.6),inset_0_0_0_2px_rgba(255,255,255,0.15)]"
      >
        <div
          style={
            {
              width: SCREEN.width,
              height: SCREEN.height,
              transform: 'translateZ(0)',
              '--safe-top': '54px',
              '--safe-bottom': '20px',
            } as CSSProperties
          }
          className="relative overflow-hidden rounded-[58px] bg-stone-950"
        >
          <div className="h-full overflow-y-auto overscroll-contain no-scrollbar">{children}</div>
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-[60] flex h-[54px] items-center justify-between pr-8 pl-12 text-[17px] font-semibold text-stone-50">
            <span>9:41</span>
            <span className="absolute top-[11px] left-1/2 h-[37px] w-[126px] -translate-x-1/2 rounded-full bg-black" />
            <span className="flex items-center gap-1.5">
              <span className="flex items-end gap-[2px]">
                {[5, 7, 9, 11].map((h) => (
                  <span key={h} style={{ height: h }} className="w-[3px] rounded-sm bg-stone-50" />
                ))}
              </span>
              <span className="flex h-3 w-6 items-center rounded-[4px] border border-stone-50/70 p-[1.5px]">
                <span className="h-full w-4/5 rounded-[2px] bg-stone-50" />
              </span>
            </span>
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute bottom-2 left-1/2 z-[60] h-[5px] w-[140px] -translate-x-1/2 rounded-full bg-stone-50" />
        </div>
      </div>
    </div>
  )
}
