import type { HallAction } from '../api'
import logo from '../assets/logo.svg'

export function ActionMark({ action }: { action: HallAction }) {
  if (action.kind === 'top') {
    return <img className="ascent-logo" src={logo} alt="" />
  }
  if (action.kind === 'zone') {
    return <span className="zone-mark">{action.zone ?? ''}</span>
  }
  if (action.kind === 'star') {
    return <StarIcon filled />
  }
  if (action.kind === 'comment') {
    return <CommentIcon />
  }
  return <span className="grade-mark" style={{ background: gradeColor(action.grade_color) }} />
}

export function ActionAside({ action }: { action: HallAction }) {
  if (action.kind === 'star') {
    return <StarRow stars={action.stars ?? 0} />
  }
  if (!action.grade_name) {
    return null
  }
  const color = gradeColor(action.grade_color)
  return (
    <span className="ascent-grade" style={{ background: color, color: inkOn(color) }}>
      {action.grade_name}
    </span>
  )
}

function StarRow({ stars }: { stars: number }) {
  return (
    <span className="star-row" aria-label={`${stars} von 5 Sternen`}>
      {Array.from({ length: 5 }, (_, index) => (
        <StarIcon key={index} filled={index < stars} />
      ))}
    </span>
  )
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill={filled ? '#FFD700' : '#E4DECF'}
        d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
      />
    </svg>
  )
}

function CommentIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5.5 4h13A2.5 2.5 0 0 1 21 6.5v8A2.5 2.5 0 0 1 18.5 17H10l-4.5 3.2V17H5.5A2.5 2.5 0 0 1 3 14.5v-8A2.5 2.5 0 0 1 5.5 4z"
        fill="none"
        stroke="#1b1522"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function gradeColor(value: string | null): string {
  if (value && /^#[0-9a-fA-F]{6}$/.test(value)) {
    return value
  }
  if (value && /^#[0-9a-fA-F]{3}$/.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
  }
  return '#cbd5e1'
}

function inkOn(color: string): string {
  const hex = color.slice(1)
  const red = Number.parseInt(hex.slice(0, 2), 16) / 255
  const green = Number.parseInt(hex.slice(2, 4), 16) / 255
  const blue = Number.parseInt(hex.slice(4, 6), 16) / 255
  const channel = (value: number) =>
    value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  const luminance = 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue)
  return luminance > 0.62 ? '#1b1522' : '#ffffff'
}
