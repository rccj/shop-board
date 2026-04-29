import { useState } from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { cn } from '@/lib/utils'
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
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      {/* No Portal — renders inside Drawer DOM tree to avoid DismissableLayer conflict */}
      <PopoverPrimitive.Content
        side={side}
        align="center"
        sideOffset={4}
        className={cn(
          'z-50 w-auto rounded-md border bg-popover p-3 text-popover-foreground shadow-md outline-none',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        )}
      >
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
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  )
}
