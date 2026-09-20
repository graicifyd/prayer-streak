import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 backdrop-blur ${className}`}
    >
      {children}
    </div>
  )
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
}) {
  return (
    <Card>
      <div className="text-xs uppercase tracking-wider text-white/50">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
      {hint ? <div className="mt-1 text-xs text-white/60">{hint}</div> : null}
    </Card>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-2 text-sm font-medium uppercase tracking-wider text-white/60">{children}</h2>
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  className = '',
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'danger'
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
}) {
  const styles = {
    primary: 'bg-gold text-ink hover:bg-gold-soft',
    ghost: 'bg-white/10 text-white hover:bg-white/20',
    danger: 'bg-red-500/20 text-red-200 hover:bg-red-500/30',
  }[variant]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
    >
      {children}
    </button>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span>
        <span className="block text-sm font-medium text-white">{label}</span>
        {description ? <span className="block text-xs text-white/50">{description}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-gold' : 'bg-white/20'}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${checked ? 'left-6' : 'left-1'}`}
        />
      </button>
    </label>
  )
}

export function BarChart<K extends string>({
  data,
  format,
}: {
  data: { key: K; count: number; totalSec: number }[]
  format?: (v: number) => string
}) {
  const max = Math.max(1, ...data.map((d) => d.count))
  return (
    <div className="flex h-32 items-end gap-2">
      {data.map((d) => (
        <div key={d.key} className="flex flex-1 flex-col items-center gap-1">
          <div className="text-[10px] text-white/60">{format ? format(d.count) : d.count}</div>
          <div className="flex h-20 w-full items-end">
            <div
              className={`w-full rounded-t-md ${d.count === max && d.count > 0 ? 'bg-gold' : 'bg-white/25'}`}
              style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? 4 : 0 }}
            />
          </div>
          <div className="text-xs text-white/70">{d.key}</div>
        </div>
      ))}
    </div>
  )
}
