import type { CSSProperties } from 'react'
import type { DisplayZoom } from '../api'

export const tickerHeight = 56

const highRowHeight = 86
const midRowHeight = 58
const tailRowHeight = 46
const highGap = 12
const midGap = 10
const tailGap = 8

export type BoardPlan = {
  highColumns: number
  midColumns: number
  tailColumns: number
  highCount: number
  midCount: number
  tailCount: number
}

export function zoomStyle(zoom: number): CSSProperties {
  return { '--zoom': zoom } as CSSProperties
}

export function bandStyle(columns: number, zoom: number): CSSProperties {
  return { '--columns': columns, '--zoom': zoom } as CSSProperties
}

export function samePlan(current: BoardPlan, next: BoardPlan): boolean {
  return (
    current.highColumns === next.highColumns &&
    current.midColumns === next.midColumns &&
    current.tailColumns === next.tailColumns &&
    current.highCount === next.highCount &&
    current.midCount === next.midCount &&
    current.tailCount === next.tailCount
  )
}

export function chooseBoard(
  width: number,
  freeHeight: number,
  sectionGap: number,
  highAvailable: number,
  midAvailable: number,
  tailAvailable: number,
  reservedForCrawl: number,
  zoom: DisplayZoom,
): BoardPlan {
  const columns = {
    highColumns: columnsFor(width, 3),
    midColumns: columnsFor(width, 4),
    tailColumns: columnsFor(width, 5),
  }
  const packed = packBands(freeHeight, sectionGap, columns, highAvailable, midAvailable, tailAvailable, zoom)
  if (packed.highCount === highAvailable && packed.midCount === midAvailable && packed.tailCount === tailAvailable) {
    return { ...columns, ...packed }
  }
  return {
    ...columns,
    ...packBands(
      freeHeight - reservedForCrawl,
      sectionGap,
      columns,
      highAvailable,
      midAvailable,
      tailAvailable,
      zoom,
    ),
  }
}

function columnsFor(width: number, base: number): number {
  if (width >= 1700) return base + 1
  if (width >= 1100) return base
  if (width >= 760) return Math.max(2, base - 1)
  return Math.max(1, base - 2)
}

function packBands(
  height: number,
  sectionGap: number,
  columns: { highColumns: number; midColumns: number; tailColumns: number },
  highAvailable: number,
  midAvailable: number,
  tailAvailable: number,
  zoom: DisplayZoom,
): { highCount: number; midCount: number; tailCount: number } {
  const highRow = highRowHeight * zoom.high
  const midRow = midRowHeight * zoom.mid
  const tailRow = tailRowHeight * zoom.tail
  let left = height
  const highCount = fitCount(left, highAvailable, columns.highColumns, highRow, highGap * zoom.high)
  left -= bandHeight(highCount, columns.highColumns, highRow, highGap * zoom.high)
  if (highCount > 0 && (midAvailable > 0 || tailAvailable > 0)) {
    left -= sectionGap
  }
  const midCount = highCount === highAvailable ? fitCount(left, midAvailable, columns.midColumns, midRow, midGap * zoom.mid) : 0
  left -= bandHeight(midCount, columns.midColumns, midRow, midGap * zoom.mid)
  if (midCount > 0 && tailAvailable > 0) {
    left -= sectionGap
  }
  const tailCount =
    highCount === highAvailable && midCount === midAvailable
      ? fitCount(left, tailAvailable, columns.tailColumns, tailRow, tailGap * zoom.tail)
      : 0
  return { highCount, midCount, tailCount }
}

function fitCount(height: number, available: number, columns: number, rowHeight: number, gap: number): number {
  if (available <= 0 || columns <= 0 || height < rowHeight) {
    return 0
  }
  const rows = Math.floor((height + gap) / (rowHeight + gap))
  return Math.min(available, rows * columns)
}

function bandHeight(count: number, columns: number, rowHeight: number, gap: number): number {
  if (count <= 0 || columns <= 0) {
    return 0
  }
  const rows = Math.ceil(count / columns)
  return rows * rowHeight + (rows - 1) * gap
}
