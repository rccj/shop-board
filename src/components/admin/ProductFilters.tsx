import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { useDebounce } from 'use-debounce'
import { useImeInput } from '@/hooks/useImeInput'
import { Category, ProductQueryParams } from '@/types/product'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface Props {
  search: string
  categories: Category[]
  categoryId: number | undefined
  priceMin: number | undefined
  priceMax: number | undefined
  stockStatus: ProductQueryParams['stockStatus']
  status: ProductQueryParams['status']
  onSearchChange: (v: string) => void
  onCategoryChange: (id: number | undefined) => void
  onPriceMinChange: (v: number | undefined) => void
  onPriceMaxChange: (v: number | undefined) => void
  onStockStatusChange: (v: ProductQueryParams['stockStatus']) => void
  onStatusChange: (v: ProductQueryParams['status']) => void
  onReset: () => void
}

export function ProductFilters({
  search,
  categories,
  categoryId,
  priceMin,
  priceMax,
  stockStatus,
  status,
  onSearchChange,
  onCategoryChange,
  onPriceMinChange,
  onPriceMaxChange,
  onStockStatusChange,
  onStatusChange,
  onReset,
}: Props) {
  // local price state for debounce — sync from parent on reset
  const [localPriceMin, setLocalPriceMin] = useState(priceMin !== undefined ? String(priceMin) : '')
  const [localPriceMax, setLocalPriceMax] = useState(priceMax !== undefined ? String(priceMax) : '')
  const [debouncedPriceMin] = useDebounce(localPriceMin, 500)
  const [debouncedPriceMax] = useDebounce(localPriceMax, 500)

  const imeSearch = useImeInput(onSearchChange)

  // sync search when parent resets
  useEffect(() => { imeSearch.setValue(search) }, [search, imeSearch.setValue])

  // sync price inputs when parent resets
  useEffect(() => {
    setLocalPriceMin(priceMin !== undefined ? String(priceMin) : '')
  }, [priceMin])
  useEffect(() => {
    setLocalPriceMax(priceMax !== undefined ? String(priceMax) : '')
  }, [priceMax])

  // notify parent after debounce
  useEffect(() => {
    const v = Number(debouncedPriceMin)
    onPriceMinChange(debouncedPriceMin !== '' && v >= 0 ? v : undefined)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedPriceMin])
  useEffect(() => {
    const v = Number(debouncedPriceMax)
    onPriceMaxChange(debouncedPriceMax !== '' && v >= 0 ? v : undefined)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedPriceMax])

  const activeCount = [search || undefined, categoryId, priceMin, priceMax, stockStatus, status]
    .filter(v => v !== undefined).length

  return (
    <div className="rounded-lg border p-4 space-y-3">
      {/* 搜尋 */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="搜尋商品名稱…"
          className="pl-9"
          value={imeSearch.value}
          onChange={imeSearch.onChange}
          onCompositionEnd={imeSearch.onCompositionEnd}
        />
      </div>

      {/* 篩選器 */}
      <div className="flex flex-wrap gap-3 overflow-x-auto pb-1">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">分類</Label>
          <Select
            value={categoryId?.toString() ?? 'all'}
            onValueChange={v => onCategoryChange(v === 'all' ? undefined : Number(v))}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="全部分類" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分類</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id.toString()}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">庫存狀態</Label>
          <Select
            value={stockStatus ?? 'all'}
            onValueChange={v =>
              onStockStatusChange(
                v === 'all' ? undefined : (v as ProductQueryParams['stockStatus'])
              )
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="全部" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="in_stock">有庫存</SelectItem>
              <SelectItem value="out_of_stock">無庫存</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">上架狀態</Label>
          <Select
            value={status ?? 'all'}
            onValueChange={v =>
              onStatusChange(v === 'all' ? undefined : (v as ProductQueryParams['status']))
            }
          >
            <SelectTrigger className="w-28">
              <SelectValue placeholder="全部" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="active">上架中</SelectItem>
              <SelectItem value="inactive">已下架</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">最低價格</Label>
          <Input
            type="number"
            placeholder="0"
            className="w-28"
            min={0}
            value={localPriceMin}
            onChange={e => setLocalPriceMin(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">最高價格</Label>
          <Input
            type="number"
            placeholder="不限"
            className="w-28"
            min={0}
            value={localPriceMax}
            onChange={e => setLocalPriceMax(e.target.value)}
          />
        </div>

        <div className="flex items-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={activeCount === 0}
            className="gap-1.5"
          >
            重置篩選
            {activeCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                {activeCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
