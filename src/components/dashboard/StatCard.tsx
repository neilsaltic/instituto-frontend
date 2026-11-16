import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

type StatCardProps = {
  label: string
  value: string
  change: string
  detail: string
  icon: LucideIcon
  tone: string
  positive?: boolean
}

export function StatCard({ label, value, change, detail, icon: Icon, tone, positive = true }: StatCardProps) {
  return (
    <article className="stat-card">
      <div className={`stat-icon stat-${tone}`}><Icon size={19} strokeWidth={1.8} /></div>
      <span className="stat-label">{label}</span>
      <div className="stat-value">{value}</div>
      <div className="stat-footer">
        <span className={`stat-change ${positive ? 'change-positive' : 'change-negative'}`}>
          {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{change}
        </span>
        <span>{detail}</span>
      </div>
    </article>
  )
}
