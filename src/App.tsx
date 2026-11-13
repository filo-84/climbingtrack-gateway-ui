import { useEffect, useState } from 'react'
import {
  dayListTitle,
  fetchActions,
  fetchDayRanking,
  fetchNextDisplay,
  fetchRanking,
  type ActionsFeed,
  type DayRanking,
  type DisplayCounts,
  type DisplayView,
  type DisplayZoom,
  type Ranking,
} from './api'
import { ActionsScreen } from './actions/ActionsScreen'
import { InstallScreen } from './install/InstallScreen'
import { RankingScreen } from './ranking/RankingScreen'

const RETRY_SECONDS = 10
const FADE_MS = 500

type Screen =
  | { kind: 'loading' }
  | {
      kind: 'ranking'
      ranking: Ranking
      seconds: number
      zoom: DisplayZoom
      counts: DisplayCounts
      stale: boolean
    }
  | {
      kind: 'day'
      ranking: DayRanking
      seconds: number
      zoom: DisplayZoom
      counts: DisplayCounts
      stale: boolean
    }
  | { kind: 'actions'; actions: ActionsFeed; seconds: number; columns: number; stale: boolean }
  | { kind: 'install'; seconds: number; stale: boolean }
  | { kind: 'unknown' }
  | { kind: 'error' }

export function App() {
  const [screen, setScreen] = useState<Screen>({ kind: 'loading' })
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    let timer = 0
    let fadeTimer = 0
    let stopped = false
    let shown: DisplayView | null = null
    let shownKind: Screen['kind'] = 'loading'

    const schedule = (seconds: number) => {
      if (stopped) {
        return
      }
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        void refresh()
      }, seconds * 1000)
    }

    const show = (next: Screen) => {
      window.clearTimeout(fadeTimer)
      const apply = () => {
        if (stopped) {
          return
        }
        shownKind = next.kind
        setScreen(next)
        setLeaving(false)
        if (
          next.kind === 'ranking' ||
          next.kind === 'day' ||
          next.kind === 'actions' ||
          next.kind === 'install'
        ) {
          schedule(next.seconds)
        }
      }
      if (shownKind === 'loading' || shownKind === next.kind) {
        apply()
        return
      }
      setLeaving(true)
      fadeTimer = window.setTimeout(apply, FADE_MS)
    }

    const refresh = async () => {
      try {
        const next = await fetchNextDisplay(controller.signal, shown)
        if (next.view === 'ranking') {
          const ranking = await fetchRanking(controller.signal)
          shown = 'ranking'
          show({
            kind: 'ranking',
            ranking,
            seconds: next.seconds,
            zoom: next.zoom,
            counts: next.counts,
            stale: false,
          })
        } else if (next.view === 'day') {
          const ranking = await fetchDayRanking(controller.signal)
          shown = 'day'
          show({
            kind: 'day',
            ranking,
            seconds: next.seconds,
            zoom: next.zoom,
            counts: next.counts,
            stale: false,
          })
        } else if (next.view === 'actions') {
          const actions = await fetchActions(controller.signal)
          shown = 'actions'
          show({
            kind: 'actions',
            actions,
            seconds: next.seconds,
            columns: next.columns,
            stale: false,
          })
        } else if (next.view === 'install') {
          shown = 'install'
          show({ kind: 'install', seconds: next.seconds, stale: false })
        } else {
          shownKind = 'unknown'
          show({ kind: 'unknown' })
          schedule(RETRY_SECONDS)
        }
      } catch (error) {
        if (controller.signal.aborted || stopped) {
          return
        }
        setScreen((current) => {
          if (
            current.kind === 'ranking' ||
            current.kind === 'day' ||
            current.kind === 'actions' ||
            current.kind === 'install'
          ) {
            return { ...current, stale: true }
          }
          shownKind = 'error'
          return { kind: 'error' }
        })
        console.error(error)
        schedule(RETRY_SECONDS)
      }
    }

    void refresh()
    return () => {
      stopped = true
      controller.abort()
      window.clearTimeout(timer)
      window.clearTimeout(fadeTimer)
    }
  }, [])

  return (
    <main className="screen">
      <div className={leaving ? 'stage is-out' : 'stage'}>
        {screen.kind === 'loading' ? <p className="status">Lade die Anzeige…</p> : null}
        {screen.kind === 'error' ? (
          <p className="status">Die Halle ist gerade nicht erreichbar.</p>
        ) : null}
        {screen.kind === 'unknown' ? (
          <p className="status">Diese Ansicht ist noch nicht eingebaut.</p>
        ) : null}
        {screen.kind === 'ranking' ? (
          <RankingScreen
            title="Bestenliste"
            ranking={screen.ranking}
            seconds={screen.seconds}
            zoom={screen.zoom}
            counts={screen.counts}
            stale={screen.stale}
          />
        ) : null}
        {screen.kind === 'day' ? (
          <RankingScreen
            title={dayListTitle(screen.ranking.day, screen.ranking.is_today)}
            ranking={screen.ranking}
            seconds={screen.seconds}
            zoom={screen.zoom}
            counts={screen.counts}
            stale={screen.stale}
            progressKey="day-ranking-ticker-progress"
            tone="day"
          />
        ) : null}
        {screen.kind === 'actions' ? (
          <ActionsScreen actions={screen.actions.actions} columns={screen.columns} stale={screen.stale} />
        ) : null}
        {screen.kind === 'install' ? <InstallScreen stale={screen.stale} /> : null}
      </div>
    </main>
  )
}
