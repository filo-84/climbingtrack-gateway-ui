import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { RankingEntry } from '../api'
import { zoomStyle } from './board'
import { formatScore } from './format'

const minScrollPixelsPerSecond = 20
const maxScrollPixelsPerSecond = 100

const tickerProgress = new Map<string, number>()

export function Crawl({
  entries,
  seconds,
  zoom,
  progressKey,
}: {
  entries: RankingEntry[]
  seconds: number
  zoom: number
  progressKey: string
}) {
  const groupRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef(readTickerProgress(progressKey))
  const [repeat, setRepeat] = useState(1)
  const [duration, setDuration] = useState(seconds)
  const signature = entries.map((entry) => `${entry.user_id}:${entry.rank}`).join(',')

  useLayoutEffect(() => {
    const group = groupRef.current
    const viewport = group?.parentElement?.parentElement?.clientWidth ?? 0
    if (!group || viewport <= 0) {
      return
    }
    const onePass = group.scrollWidth / repeat
    if (onePass <= 0) {
      return
    }
    const needed = Math.min(30, Math.max(1, Math.ceil(viewport / onePass)))
    if (needed !== repeat) {
      setRepeat(needed)
      return
    }
    const nextDuration = scrollDurationSeconds(group.scrollWidth, seconds)
    setDuration((current) => (Math.abs(current - nextDuration) < 0.05 ? current : nextDuration))
  }, [signature, repeat, seconds, zoom])

  useLayoutEffect(() => {
    const track = trackRef.current
    const group = groupRef.current
    if (!track || !group || duration <= 0) {
      return
    }
    let frame = 0
    let last = performance.now()
    const place = () => {
      const distance = group.scrollWidth
      if (distance <= 0) {
        return
      }
      track.style.transform = `translateX(${-progressRef.current * distance}px)`
    }
    place()
    const step = (now: number) => {
      const delta = Math.min(0.05, (now - last) / 1000)
      last = now
      progressRef.current = (progressRef.current + delta / duration) % 1
      place()
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(frame)
      tickerProgress.set(progressKey, progressRef.current)
    }
  }, [duration, repeat, signature, progressKey])

  return (
    <div className="ticker" style={zoomStyle(zoom)}>
      <div className="ticker-track" ref={trackRef}>
        <div className="ticker-group" ref={groupRef}>
          {tickerItems(entries, repeat, 'a')}
        </div>
        <div className="ticker-group" aria-hidden="true">
          {tickerItems(entries, repeat, 'b')}
        </div>
      </div>
    </div>
  )
}

function tickerItems(entries: RankingEntry[], repeat: number, suffix: string) {
  const items: ReactNode[] = []
  for (let copy = 0; copy < repeat; copy += 1) {
    entries.forEach((entry, index) => {
      items.push(
        <CrawlItem
          key={`${suffix}-${copy}-${entry.user_id}-${index}`}
          entry={entry}
          seam={index === entries.length - 1}
        />,
      )
    })
  }
  return items
}

function CrawlItem({ entry, seam }: { entry: RankingEntry; seam: boolean }) {
  return (
    <span className={seam ? 'ticker-item ticker-seam' : 'ticker-item'}>
      <span className="ticker-rank">{entry.rank}</span>
      <span className="ticker-name">{entry.name}</span>
      <span className="ticker-points">{formatScore(entry.score)}</span>
    </span>
  )
}

function readTickerProgress(progressKey: string): number {
  const value = tickerProgress.get(progressKey) ?? 0
  if (!Number.isFinite(value)) {
    return 0
  }
  return ((value % 1) + 1) % 1
}

function scrollDurationSeconds(distancePx: number, displaySeconds: number): number {
  const ideal = distancePx / displaySeconds
  const speed = Math.min(maxScrollPixelsPerSecond, Math.max(minScrollPixelsPerSecond, ideal))
  return distancePx / speed
}
