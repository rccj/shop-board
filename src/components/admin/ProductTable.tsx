import { ArrowUp, ArrowDown, ArrowUpDown, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { Product, ProductQueryParams } from '@/types/product'
import { getCategoryColor } from '@/lib/categoryColors'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'

interface Props {
  products: Product[]
  isLoading: boolean
  selectedIds: number[]
  sortBy: ProductQueryParams['sortBy']
  sortOrder: ProductQueryParams['sortOrder']
  onSort: (field: NonNullable<ProductQueryParams['sortBy']>) => void
  onSelectOne: (id: number, checked: boolean) => void
  onSelectAll: (checked: boolean) => void
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  onToggleStatus: (product: Product) => void
  onReset?: () => void
}

function SortIcon({
  field,
  current,
  order,
}: {
  field: string
  current: string | undefined
  order: string | undefined
}) {
  if (current !== field) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
  return order === 'asc'
    ? <ArrowUp className="ml-1 h-3 w-3" />
    : <ArrowDown className="ml-1 h-3 w-3" />
}

export function ProductTable({
  products,
  isLoading,
  selectedIds,
  sortBy,
  sortOrder,
  onSort,
  onSelectOne,
  onSelectAll,
  onEdit,
  onDelete,
  onToggleStatus,
  onReset,
}: Props) {
  const allSelected = products.length > 0 && selectedIds.length === products.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < products.length

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">沒有符合條件的商品</p>
        {onReset && (
          <Button variant="outline" size="sm" onClick={onReset}>
            清除篩選
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <Checkbox
              checked={allSelected || (someSelected ? 'indeterminate' : false)}
              onCheckedChange={checked => onSelectAll(!!checked)}
            />
          </TableHead>
          <TableHead className="w-16">圖片</TableHead>
          <TableHead>名稱</TableHead>
          <TableHead>分類</TableHead>
          <TableHead>
            <button
              className="flex items-center font-medium hover:text-foreground"
              onClick={() => onSort('price')}
            >
              價格
              <SortIcon field="price" current={sortBy} order={sortOrder} />
            </button>
          </TableHead>
          <TableHead>
            <button
              className="flex items-center font-medium hover:text-foreground"
              onClick={() => onSort('stock')}
            >
              庫存
              <SortIcon field="stock" current={sortBy} order={sortOrder} />
            </button>
          </TableHead>
          <TableHead>
            <button
              className="flex items-center font-medium hover:text-foreground"
              onClick={() => onSort('sales')}
            >
              銷量
              <SortIcon field="sales" current={sortBy} order={sortOrder} />
            </button>
          </TableHead>
          <TableHead>狀態</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map(product => {
          const isLowStock = product.stock > 0 && product.stock <= product.lowStockThreshold
          return (
            <TableRow key={product.id} data-state={selectedIds.includes(product.id) ? 'selected' : undefined}>
              <TableCell>
                <Checkbox
                  checked={selectedIds.includes(product.id)}
                  onCheckedChange={checked => onSelectOne(product.id, !!checked)}
                />
              </TableCell>
              <TableCell>
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="h-10 w-10 rounded object-cover"
                  loading="lazy"
                />
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getCategoryColor(product.category.id)}>{product.category.name}</Badge>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">NT${product.price.toLocaleString()}</p>
                  {product.compareAtPrice && (
                    <p className="text-xs text-muted-foreground line-through">
                      NT${product.compareAtPrice.toLocaleString()}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {product.stock === 0 ? (
                    <Badge variant="destructive">缺貨</Badge>
                  ) : isLowStock ? (
                    <span className="group relative flex items-center gap-1 text-yellow-600 cursor-default">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="text-sm">{product.stock}</span>
                      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs text-background shadow">
                        低庫存（門檻 {product.lowStockThreshold}）
                      </span>
                    </span>
                  ) : (
                    <span className="text-sm">{product.stock}</span>
                  )}
                </div>
              </TableCell>
              <TableCell>{product.sales.toLocaleString()}</TableCell>
              <TableCell>
                <button
                  onClick={() => onToggleStatus(product)}
                  className="group"
                  title={product.status === 'active' ? '點擊下架' : '點擊上架'}
                >
                  <Badge
                    variant={product.status === 'active' ? 'success' : 'secondary'}
                    className="cursor-pointer transition-opacity group-hover:opacity-70"
                  >
                    {product.status === 'active' ? '上架' : '下架'}
                  </Badge>
                </button>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button size="icon" variant="ghost" data-testid="edit-btn" onClick={() => onEdit(product)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    data-testid="delete-btn"
                    onClick={() => onDelete(product)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
    </div>
  )
}
