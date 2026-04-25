import { ShoppingCart, Tag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Product } from '@/types/product'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CATEGORY_DISCOUNT_HINTS } from '@/lib/discountHints'
import { getCategoryColor } from '@/lib/categoryColors'

interface Props {
  product: Product
  onAddToCart: (id: number) => void
}

export function ProductCard({ product, onAddToCart }: Props) {
  const isOutOfStock = product.stock === 0
  const discountHint = CATEGORY_DISCOUNT_HINTS[product.category.id]
  const discountPct = product.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : null

  return (
    <div className="group overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md">
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Badge variant="destructive">缺貨</Badge>
            </div>
          )}
          {discountPct && !isOutOfStock && (
            <div className="absolute left-2 top-2">
              <Badge variant="destructive">-{discountPct}%</Badge>
            </div>
          )}
        </div>
      </Link>
      <div className="p-4 flex flex-col">
        <Badge className={`mb-2 text-xs self-start ${getCategoryColor(product.category.id)}`}>{product.category.name}</Badge>
        <Link to={`/products/${product.id}`}>
          <h3 className="mb-1 font-semibold leading-tight line-clamp-1 hover:underline">
            {product.name}
          </h3>
        </Link>
        <p className="mb-2 text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">{product.description}</p>
        <p className="mb-2 flex items-center gap-1 text-xs text-green-600 min-h-[20px]">
          {discountHint && <><Tag className="h-3 w-3" />{discountHint.split('，')[0]}</>}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2">
          <div>
            <div className="text-base font-bold leading-tight">NT${product.price.toLocaleString()}</div>
            <div className="min-h-[1rem]">
              {product.compareAtPrice && (
                <span className="text-xs text-muted-foreground line-through">
                  NT${product.compareAtPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <Button
            size="sm"
            className="shrink-0"
            disabled={isOutOfStock}
            onClick={(e) => { e.preventDefault(); onAddToCart(product.id) }}
          >
            <ShoppingCart className="mr-1 h-4 w-4" />
            加入
          </Button>
        </div>
      </div>
    </div>
  )
}
