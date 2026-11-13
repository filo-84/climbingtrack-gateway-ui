import { useLayoutEffect, useRef, useState } from 'react'
import type { DisplayCounts, DisplayZoom, Ranking, RankingEntry } from '../api'
import { bandStyle, chooseBoard, samePlan, tickerHeight, zoomStyle, type BoardPlan } from './board'
import { Crawl } from './Crawl'
import { formatScore } from './format'

type RankingScreenProps = {
  title: string
  ranking: Ranking
  seconds: number
  zoom: DisplayZoom
  counts: DisplayCounts
  stale: boolean
  tone?: 'board' | 'day'
  progressKey?: string
}

const bestClimberTickerKey = 'best-climber-ticker-progress'

export function RankingScreen({
  title,
  ranking,
  seconds,
  zoom,
  counts,
  stale,
  tone = 'board',
  progressKey = bestClimberTickerKey,
}: RankingScreenProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const podiumRef = useRef<HTMLDivElement>(null)
  const [plan, setPlan] = useState<BoardPlan>({
    highColumns: 3,
    midColumns: 4,
    tailColumns: 5,
    highCount: 0,
    midCount: 0,
    tailCount: 0,
  })

  const podium = ranking.rankings.slice(0, 3)
  const rest = ranking.rankings.slice(3)
  const high = rest.slice(0, counts.high)
  const mid = rest.slice(counts.high, counts.high + counts.mid)
  const tailStart = counts.high + counts.mid
  const tail = rest.slice(tailStart, tailStart + counts.tail)
  const beyond = rest.slice(tailStart + counts.tail)

  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame) {
      return
    }

    const measure = () => {
      const styles = getComputedStyle(frame)
      const gap = Number.parseFloat(styles.rowGap) || 0
      const padding = (Number.parseFloat(styles.paddingTop) || 0) + (Number.parseFloat(styles.paddingBottom) || 0)
      const headerHeight = headerRef.current?.offsetHeight ?? 0
      const podiumHeight = podiumRef.current?.offsetHeight ?? 0
      const blocksAbove = (headerHeight > 0 ? 1 : 0) + (podiumHeight > 0 ? 1 : 0)
      const fixed = headerHeight + podiumHeight
      const free = frame.clientHeight - padding - fixed - gap * blocksAbove
      const width = frame.clientWidth - (Number.parseFloat(styles.paddingLeft) || 0) - (Number.parseFloat(styles.paddingRight) || 0)
      const next = chooseBoard(
        width,
        free,
        gap,
        high.length,
        mid.length,
        tail.length,
        tickerHeight * zoom.ticker + gap,
        zoom,
      )
      setPlan((current) => (samePlan(current, next) ? current : next))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [
    high.length,
    mid.length,
    tail.length,
    stale,
    zoom.podium,
    zoom.high,
    zoom.mid,
    zoom.tail,
    zoom.ticker,
    title,
  ])

  const visibleHigh = high.slice(0, plan.highCount)
  const visibleMid = mid.slice(0, plan.midCount)
  const visibleTail = tail.slice(0, plan.tailCount)
  const crawling = [
    ...high.slice(plan.highCount),
    ...mid.slice(plan.midCount),
    ...tail.slice(plan.tailCount),
    ...beyond,
  ]
  const showCrawl = crawling.length > 0
  const className = [
    'ranking',
    tone === 'day' ? 'ranking-day' : '',
    visibleHigh.length + visibleMid.length + visibleTail.length === 0 && !showCrawl ? 'is-sparse' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={className} ref={frameRef}>
      <div className="page-heading" ref={headerRef}>
        <h1 className="page-title">{title}</h1>
        {stale ? <p className="stale">Die letzte Liste bleibt stehen.</p> : null}
      </div>
      {ranking.rankings.length === 0 ? (
        <p className="status">Noch nichts Öffentliches</p>
      ) : (
        <div
          className={ranking.rankings.length === 1 ? 'podium podium-solo' : 'podium'}
          ref={podiumRef}
          style={zoomStyle(zoom.podium)}
        >
          {ranking.rankings.length === 1 ? (
            <PodiumStep entry={podium[0]} place={1} />
          ) : (
            <>
              <PodiumStep entry={podium[1]} place={2} />
              <PodiumStep entry={podium[0]} place={1} />
              <PodiumStep entry={podium[2]} place={3} />
            </>
          )}
        </div>
      )}
      {visibleHigh.length > 0 ? (
        <ol className="band band-high" style={bandStyle(plan.highColumns, zoom.high)}>
          {visibleHigh.map((entry) => (
            <RankingCard key={entry.user_id} entry={entry} />
          ))}
        </ol>
      ) : null}
      {visibleMid.length > 0 ? (
        <ol className="band band-mid" style={bandStyle(plan.midColumns, zoom.mid)}>
          {visibleMid.map((entry) => (
            <RankingCard key={entry.user_id} entry={entry} />
          ))}
        </ol>
      ) : null}
      {visibleTail.length > 0 ? (
        <ol className="band band-tail" style={bandStyle(plan.tailColumns, zoom.tail)}>
          {visibleTail.map((entry) => (
            <RankingCard key={entry.user_id} entry={entry} />
          ))}
        </ol>
      ) : null}
      {showCrawl ? (
        <Crawl entries={crawling} seconds={seconds} zoom={zoom.ticker} progressKey={progressKey} />
      ) : null}
    </div>
  )
}

function PodiumStep({ entry, place }: { entry: RankingEntry | undefined; place: 1 | 2 | 3 }) {
  if (!entry) {
    return <div className={`step step-${place} step-empty`} />
  }
  return (
    <article className={`step step-${place}`}>
      <span className="step-rank">{entry.rank}</span>
      <span className="step-name">{entry.name}</span>
      <span className="step-points">{formatScore(entry.score)}</span>
    </article>
  )
}

function RankingCard({ entry }: { entry: RankingEntry }) {
  return (
    <li className="card">
      <span className="card-rank">{entry.rank}</span>
      <span className="card-name">{entry.name}</span>
      <span className="card-points">{formatScore(entry.score)}</span>
    </li>
  )
}
