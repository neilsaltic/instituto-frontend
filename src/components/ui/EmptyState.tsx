import { SearchX } from 'lucide-react'

export function EmptyState({ message }: { message: string }) {
  return <div className="empty-state"><SearchX size={22} /><span>{message}</span></div>
}
