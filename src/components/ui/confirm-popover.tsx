import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

interface Props {
  trigger: React.ReactNode
  message: string
  onConfirm: () => void
  side?: 'top' | 'bottom' | 'left' | 'right'
  confirmVariant?: 'destructive' | 'default' | 'outline'
  confirmLabel?: string
}

export function ConfirmPopover({
  trigger,
  message,
  onConfirm,
  side = 'left',
  confirmVariant = 'destructive',
  confirmLabel = '確定',
}: Props) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-auto p-3" side={side} align="center">
        <p className="mb-3 text-sm font-medium">{message}</p>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" className="h-7 px-3 text-xs" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button
            size="sm"
            variant={confirmVariant}
            className="h-7 px-3 text-xs"
            onClick={() => { onConfirm(); setOpen(false) }}
          >
            {confirmLabel}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
