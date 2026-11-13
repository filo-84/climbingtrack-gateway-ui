export type DisplayView = 'ranking' | 'day' | 'actions' | 'install'

export type DisplayZoom = {
  podium: number
  high: number
  mid: number
  tail: number
  ticker: number
}

export type DisplayCounts = {
  high: number
  mid: number
  tail: number
}

export type DisplayNext =
  | { view: 'ranking'; seconds: number; zoom: DisplayZoom; counts: DisplayCounts }
  | { view: 'day'; seconds: number; zoom: DisplayZoom; counts: DisplayCounts }
  | { view: 'actions'; seconds: number; columns: number }
  | { view: 'install'; seconds: number }
  | { view: 'unknown'; seconds: number }

export type HallAction = {
  user_name: string
  tour_name: string
  grade_name: string | null
  grade_color: string | null
  kind: 'top' | 'zone' | 'star' | 'comment' | 'grade'
  zone: number | null
  stars: number | null
  text: string | null
  at: number
}

export type ActionsFeed = {
  actions: HallAction[]
}

export type RankingEntry = {
  rank: number
  user_id: string
  name: string
  score: number
  climbed_tours: number
}

export type Ranking = {
  hall_id: string
  tour_limit: number
  rankings: RankingEntry[]
}

export type DayRanking = Ranking & {
  day: string
  is_today: boolean
}

const apiBase = import.meta.env.VITE_API_BASE ?? ''
const defaultCounts: DisplayCounts = { high: 7, mid: 15, tail: 40 }

type DisplayPayload = {
  view?: string
  seconds?: number
  zoom?: Partial<DisplayZoom>
  counts?: Partial<DisplayCounts>
  columns?: number
}

async function getJson<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, { signal })
  if (!response.ok) {
    throw new Error(`${path} answered ${response.status}`)
  }
  return (await response.json()) as T
}

export function fetchNextDisplay(
  signal: AbortSignal,
  after?: DisplayView | null,
): Promise<DisplayNext> {
  const query = after ? `?after=${encodeURIComponent(after)}` : ''
  return getJson<DisplayPayload>(`/display/next${query}`, signal).then((next) => {
    const view = next.view
    if (view === 'ranking' || view === 'day') {
      return {
        view,
        seconds: displaySeconds(view, next.seconds ?? 0),
        zoom: displayZoom(next.zoom),
        counts: displayCounts(next.counts),
      }
    }
    if (view === 'actions') {
      return {
        view,
        seconds: displaySeconds(view, next.seconds ?? 0),
        columns: actionColumns(next.columns),
      }
    }
    if (view === 'install') {
      return { view, seconds: displaySeconds(view, next.seconds ?? 0) }
    }
    return { view: 'unknown', seconds: 10 }
  })
}

export function displayZoom(value: Partial<DisplayZoom> | undefined): DisplayZoom {
  return {
    podium: levelZoom(value?.podium),
    high: levelZoom(value?.high),
    mid: levelZoom(value?.mid),
    tail: levelZoom(value?.tail),
    ticker: levelZoom(value?.ticker),
  }
}

export function displayCounts(value: Partial<DisplayCounts> | undefined): DisplayCounts {
  return {
    high: levelCount(value?.high, defaultCounts.high),
    mid: levelCount(value?.mid, defaultCounts.mid),
    tail: levelCount(value?.tail, defaultCounts.tail),
  }
}

function actionColumns(value: number | undefined): number {
  if (value === undefined || !Number.isInteger(value) || value < 1 || value > 6) {
    return 3
  }
  return value
}

function levelZoom(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    return 1
  }
  return value
}

function levelCount(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isInteger(value) || value < 0) {
    return fallback
  }
  return value
}

export function displaySeconds(view: DisplayView, value: number): number {
  if (!Number.isFinite(value) || value < 1) {
    return view === 'actions' || view === 'install' ? 10 : 20
  }
  return value
}

export function dayListTitle(day: string, isToday: boolean): string {
  if (isToday) {
    return 'Tagesliste'
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day)
  if (!match) {
    return 'Tagesliste'
  }
  return `Tagesliste · ${Number(match[3])}.${Number(match[2])}.`
}

export function fetchActions(signal: AbortSignal): Promise<ActionsFeed> {
  return getJson<ActionsFeed>('/actions', signal)
}

export function fetchRanking(signal: AbortSignal): Promise<Ranking> {
  return getJson<Ranking>('/ranking', signal)
}

export function fetchDayRanking(signal: AbortSignal): Promise<DayRanking> {
  return getJson<DayRanking>('/ranking/day', signal)
}
