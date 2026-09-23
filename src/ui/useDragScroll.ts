import { useEffect, useRef } from 'react'

/**
 * Mouse drag for horizontal rows on desktop (touch scrolls natively): snaps to the nearest child
 * and swallows the click that ends a drag.
 */
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let drag: { x: number; left: number; snaps: boolean } | null = null
    let moved = false
    const down = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      drag = { x: e.clientX, left: el.scrollLeft, snaps: getComputedStyle(el).scrollSnapType !== 'none' }
      moved = false
    }
    const move = (e: PointerEvent) => {
      if (!drag) return
      const dx = e.clientX - drag.x
      if (!moved && Math.abs(dx) > 5) {
        moved = true
        el.style.scrollSnapType = 'none'
        el.style.cursor = 'grabbing'
      }
      if (moved) {
        el.scrollLeft = drag.left - dx
        e.preventDefault()
      }
    }
    const up = () => {
      if (!drag) return
      const d = drag
      drag = null
      el.style.cursor = ''
      if (!moved) return
      const first = el.firstElementChild as HTMLElement | null
      const kids = [...el.children].filter((c): c is HTMLElement => (c as HTMLElement).offsetWidth > 2)
      let best = 0
      for (const c of kids) {
        const x = c.offsetLeft - (first?.offsetLeft ?? 0)
        if (Math.abs(x - el.scrollLeft) < Math.abs(best - el.scrollLeft)) best = x
      }
      if (d.snaps) el.scrollTo({ left: Math.min(best, el.scrollWidth - el.clientWidth), behavior: 'smooth' })
      setTimeout(() => (el.style.scrollSnapType = ''), 400)
    }
    const click = (e: MouseEvent) => {
      if (moved) {
        e.stopPropagation()
        e.preventDefault()
        moved = false
      }
    }
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    el.addEventListener('click', click, true)
    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      el.removeEventListener('click', click, true)
    }
  }, [])
  return ref
}
