import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import type { HallAction } from '../api'
import { ActionAside, ActionMark } from './marks'

const cardHeight = 108
const cardGap = 12

type ActionsScreenProps = {
  actions: HallAction[]
  columns: number
  stale: boolean
}

export function ActionsScreen({ actions, columns, stale }: ActionsScreenProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const [rows, setRows] = useState(0)
  const columnCount = Math.min(6, Math.max(1, columns || 3))

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
      const free = frame.clientHeight - paddingY - header - gap
      const next = rowsThatFit(free)
      setRows((current) => (current === next ? current : next))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [actions.length, stale, columnCount])

  const visible = actions.slice(0, rows * columnCount)

  return (
    <div className="actions" ref={frameRef}>
      <header className="page-heading" ref={headerRef}>
        <h1 className="page-title">Zuletzt</h1>
        {stale ? <p className="stale">Die letzte Liste bleibt stehen.</p> : null}
      </header>
      {actions.length === 0 ? (
        <p className="status">Noch nichts Neues</p>
      ) : (
        <ol className="action-list" style={{ '--columns': columnCount } as CSSProperties}>
          {visible.map((action, index) => (
            <Ascent key={`${action.kind}-${action.at}-${action.user_name}-${index}`} action={action} />
          ))}
        </ol>
      )}
    </div>
  )
}

function Ascent({ action }: { action: HallAction }) {
  return (
    <li className="ascent">
      <span className="ascent-mark">
        <ActionMark action={action} />
      </span>
      <span className="ascent-body">
        <span className="ascent-name">{action.user_name}</span>
        <p className="ascent-meta">
          <span className="ascent-tour">{action.tour_name}</span>
          <span className="ascent-dot" />
          <span className="ascent-when">{ago(action.at)}</span>
          {action.kind === 'comment' && action.text ? (
            <>
              <span className="ascent-dot" />
              <span className="ascent-text">{action.text.replace(/\s+/g, ' ')}</span>
            </>
          ) : null}
        </p>
      </span>
      <ActionAside action={action} />
    </li>
  )
}

function rowsThatFit(height: number): number {
  if (height < cardHeight) {
    return 1
  }
  return Math.floor((height + cardGap) / (cardHeight + cardGap))
}

function ago(at: number, now = Date.now()): string {
  const minutes = Math.max(0, Math.floor((now - at) / 60_000))
  if (minutes < 1) {
    return 'gerade'
  }
  if (minutes < 60) {
    return `vor ${minutes} Min`
  }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return hours === 1 ? 'vor 1 Std' : `vor ${hours} Std`
  }
  const days = Math.floor(hours / 24)
  return days === 1 ? 'vor 1 Tag' : `vor ${days} Tagen`
}
