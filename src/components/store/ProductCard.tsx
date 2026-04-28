import { useLayoutEffect, useRef, useState } from 'react'
import { ShoppingCart, Tag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Product } from '@/types/product'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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

  const priceRef = useRef<HTMLDivElement>(null)
  const [priceTruncated, setPriceTruncated] = useState(false)
  const comparePriceRef = useRef<HTMLDivElement>(null)
  const [comparePriceTruncated, setComparePriceTruncated] = useState(false)

  useLayoutEffect(() => {
    const el = priceRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      setPriceTruncated(el.scrollWidth > el.offsetWidth)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [product.price])

  useLayoutEffect(() => {
    const el = comparePriceRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      setComparePriceTruncated(el.scrollWidth > el.offsetWidth)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [product.compareAtPrice])

  return (
    <Link
      to={`/products/${product.id}`}
      className="group block overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md"
    >
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
      <div className="p-4 flex flex-col">
        <Badge className={`mb-2 text-xs self-start ${getCategoryColor(product.category.id)}`}>{product.category.name}</Badge>
        <h3 className="mb-1 font-semibold leading-tight line-clamp-1">{product.name}</h3>
        <p className="mb-2 text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">{product.description}</p>
        <p className="mb-2 flex items-center gap-1 text-xs text-green-600 min-h-[20px]">
          {discountHint && <><Tag className="h-3 w-3" />{discountHint.split('，')[0]}</>}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="min-w-0">
            <Tooltip open={priceTruncated ? undefined : false}>
              <TooltipTrigger asChild>
                <div ref={priceRef} className="truncate text-base font-bold leading-tight">NT${product.price.toLocaleString()}</div>
              </TooltipTrigger>
              <TooltipContent>NT${product.price.toLocaleString()}</TooltipContent>
            </Tooltip>
            <div className="min-h-[1rem]">
              {product.compareAtPrice && (
                <Tooltip open={comparePriceTruncated ? undefined : false}>
                  <TooltipTrigger asChild>
                    <div ref={comparePriceRef} className="truncate text-xs text-muted-foreground line-through">
                      NT${product.compareAtPrice.toLocaleString()}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>NT${product.compareAtPrice.toLocaleString()}</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
          <Button
            size="icon"
            className="shrink-0"
            disabled={isOutOfStock}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddToCart(product.id) }}
            aria-label="加入購物車"
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Link>
  )
}
