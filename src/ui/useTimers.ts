import { useEffect, useRef, useState } from 'react'
import { flash } from '../state/store'

/** Step timers of a recipe page: end time by step index. A finished timer rings once and stays "Terminé !" until tapped. */
export function useTimers() {
  const [ends, setEnds] = useState<Record<number, number>>({})
  const [now, setNow] = useState(() => Date.now())
  const rung = useRef(new Set<number>())
  const running = Object.values(ends).some((end) => end > now)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [running])

  useEffect(() => {
    for (const [k, end] of Object.entries(ends)) {
      const step = Number(k)
      if (end <= now && !rung.current.has(step)) {
        rung.current.add(step)
        flash(`Minuteur terminé : étape ${step + 1}`)
        navigator.vibrate?.([200, 100, 200])
      }
    }
  }, [ends, now])

  const start = (step: number, minutes: number) => {
    rung.current.delete(step)
    const t = Date.now()
    setNow(t)
    setEnds((e) => ({ ...e, [step]: t + minutes * 60_000 }))
  }
  const stop = (step: number) =>
    setEnds((e) => {
      const next = { ...e }
      delete next[step]
      return next
    })
  /** Seconds left, 0 when finished, null when not started. */
  const left = (step: number) => (ends[step] == null ? null : Math.max(0, Math.ceil((ends[step] - now) / 1000)))
  return { start, stop, left }
}

export const clock = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = String(seconds % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}

export const durationLabel = (minutes: number) =>
  minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h${minutes % 60 ? ' ' + String(minutes % 60).padStart(2, '0') : ''}`
