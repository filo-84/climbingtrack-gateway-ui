import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import type { DayRanking, DisplayZoom, RankingEntry } from '../api'
import { tickerHeight, zoomStyle } from './board'
import { Crawl } from './Crawl'
import { formatScore } from './format'

type DayScreenProps = {
  title: string
  ranking: DayRanking
  seconds: number
  zoom: DisplayZoom
  stale: boolean
}

type LinePlan = {
  rowHeight: number
  visible: number
}

const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
const dayTickerKey = 'day-ranking-ticker-progress'

export function DayScreen({ title, ranking, seconds, zoom, stale }: DayScreenProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const stackRef = useRef<HTMLDivElement>(null)
  const placesRef = useRef<HTMLDivElement>(null)
  const places = ranking.rankings.slice(0, 3)
  const rest = ranking.rankings.slice(3)
  const [lines, setLines] = useState<LinePlan>({ rowHeight: 76, visible: rest.length })

  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame) {
      return
    }

    const measure = () => {
      const styles = getComputedStyle(frame)
      const gap = Number.parseFloat(styles.rowGap) || 0
      const paddingY =
        (Number.parseFloat(styles.paddingTop) || 0) + (Number.parseFloat(styles.paddingBottom) || 0)
      const header = headerRef.current?.offsetHeight ?? 0
      const placesHeight = placesRef.current?.offsetHeight ?? 0
      const stackStyles = stackRef.current ? getComputedStyle(stackRef.current) : null
      const stackGap = Number.parseFloat(stackStyles?.rowGap || '') || 0
      const afterHeader = frame.clientHeight - paddingY - header - (header > 0 ? gap : 0)
      const between = placesHeight > 0 && rest.length > 0 ? stackGap : 0
      const open = chooseLines(afterHeader - placesHeight - between, rest.length, zoom.mid)
      const next =
        open.visible >= rest.length
          ? open
          : chooseLines(
              afterHeader - placesHeight - between - tickerHeight * zoom.ticker - gap,
              rest.length,
              zoom.mid,
            )
      setLines((current) => (sameLines(current, next) ? current : next))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [places.length, rest.length, stale, title, zoom.mid, zoom.podium, zoom.ticker])

  const shown = rest.slice(0, lines.visible)
  const crawling = rest.slice(lines.visible)
  const lineStyle = { '--row': `${lines.rowHeight}px` } as CSSProperties

  return (
    <div className="day" ref={frameRef}>
      <header className="day-heading" ref={headerRef}>
        <div className="page-heading">
          <h1 className="page-title">{title}</h1>
          {stale ? <p className="stale">Die letzte Liste bleibt stehen.</p> : null}
        </div>
        <DateChip day={ranking.day} />
      </header>
      {places.length > 0 ? (
        <div className="day-stack" ref={stackRef}>
          <div className="day-places" ref={placesRef} style={zoomStyle(zoom.podium)}>
            {places.map((entry, index) => (
              <Place key={entry.user_id} entry={entry} place={(index + 1) as 1 | 2 | 3} />
            ))}
          </div>
          {shown.length > 0 ? (
            <ol className="day-lines" style={{ ...lineStyle, ...zoomStyle(zoom.mid) }}>
              {shown.map((entry) => (
                <Line key={entry.user_id} entry={entry} />
              ))}
            </ol>
          ) : null}
        </div>
      ) : (
        <p className="status">Noch nichts Öffentliches</p>
      )}
      {crawling.length > 0 ? (
        <Crawl entries={crawling} seconds={seconds} zoom={zoom.ticker} progressKey={dayTickerKey} />
      ) : null}
    </div>
  )
}

function Place({ entry, place }: { entry: RankingEntry; place: 1 | 2 | 3 }) {
  return (
    <article className={`day-place day-place-${place}`}>
      <span className="day-place-rank">{entry.rank}</span>
      <span className="day-place-name">{entry.name}</span>
      <span className="day-place-points">{formatScore(entry.score)}</span>
    </article>
  )
}

function Line({ entry }: { entry: RankingEntry }) {
  return (
    <li className="day-line">
      <span className="day-line-rank">{entry.rank}</span>
      <span className="day-line-name">{entry.name}</span>
      <span className="day-line-points">{formatScore(entry.score)}</span>
    </li>
  )
}

function DateChip({ day }: { day: string }) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day)
  if (!match) {
    return null
  }
  const month = months[Number(match[2]) - 1]
  if (!month) {
    return null
  }
  return (
    <div className="day-date">
      <span className="day-date-num">{Number(match[3])}</span>
      <span className="day-date-month">{month}</span>
    </div>
  )
}

function chooseLines(height: number, count: number, zoom: number): LinePlan {
  if (count <= 0 || height <= 0) {
    return { rowHeight: 0, visible: 0 }
  }
  const gap = 12
  const minRow = 70 * zoom
  const maxRow = 96 * zoom
  const rowsThatFit = Math.max(0, Math.floor((height + gap) / (minRow + gap)))
  if (count <= rowsThatFit) {
    const natural = (height - gap * Math.max(0, count - 1)) / count
    return { rowHeight: Math.round(Math.min(maxRow, natural)), visible: count }
  }
  return { rowHeight: Math.round(minRow), visible: rowsThatFit }
}

function sameLines(current: LinePlan, next: LinePlan): boolean {
  return current.rowHeight === next.rowHeight && current.visible === next.visible
}
