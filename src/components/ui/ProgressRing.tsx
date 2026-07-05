import { type ReactNode } from 'react'

interface Props {
  /** 0-100 */
  value: number
  size?: number
  strokeWidth?: number
  trackClassName?: string
  progressClassName?: string
  children?: ReactNode
}

export default function ProgressRing({
  value,
  size = 160,
  strokeWidth = 14,
  trackClassName = 'text-surface-muted',
  progressClassName = 'text-primary',
  children,
}: Props) {
  const clamped = Math.min(100, Math.max(0, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped / 100)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} fill="none" className={trackClassName} stroke="currentColor" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${progressClassName} transition-[stroke-dashoffset] duration-500 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}
