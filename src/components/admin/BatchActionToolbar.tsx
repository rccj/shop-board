import { Trash2, Eye, EyeOff, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  count: number
  onActivate: () => void
  onDeactivate: () => void
  onDelete: () => void
  onClear: () => void
}

export function BatchActionToolbar({ count, onActivate, onDeactivate, onDelete, onClear }: Props) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-200 ${
        count > 0
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-4 opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex items-center gap-3 rounded-full border bg-background px-5 py-2.5 shadow-lg">
        <span className="text-sm font-medium tabular-nums whitespace-nowrap">
          已選 <span className="text-primary">{count}</span> 筆
        </span>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="rounded-full" data-testid="batch-activate" onClick={onActivate}>
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            上架
          </Button>
          <Button size="sm" variant="ghost" className="rounded-full" data-testid="batch-deactivate" onClick={onDeactivate}>
            <EyeOff className="mr-1.5 h-3.5 w-3.5" />
            下架
          </Button>
          <Button size="sm" variant="ghost" className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onDelete}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            刪除
          </Button>
        </div>
        <div className="h-4 w-px bg-border" />
        <button
          onClick={onClear}
          className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
