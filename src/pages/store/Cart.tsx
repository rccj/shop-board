import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Minus, Plus, Trash2, Tag } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { getCartProducts } from '@/api/cart'
import { Product } from '@/types/product'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { FULL_AMOUNT_HINT } from '@/lib/discountHints'

export default function Cart() {
  const { items, result, isLoading, addItem, removeItem, updateQuantity, clearCart, calculate } = useCart()
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    if (items.length > 0) {
      setProducts(getCartProducts(items.map(i => i.productId)))
    } else {
      setProducts([])
    }
  }, [items])

  useEffect(() => {
    void calculate()
  }, [calculate])

  const cartWithDetails = items.flatMap(item => {
    const product = products.find(p => p.id === item.productId)
    if (!product) return []
    const detail = result?.discounts.find(d => d.productId === item.productId)
    return [{ item, product, detail }]
  })

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              繼續購物
            </Button>
          </Link>
          <h1 className="text-xl font-bold">購物車</h1>
          <Button variant="ghost" size="sm" onClick={clearCart} disabled={items.length === 0}>
            清空
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-6">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <p className="text-muted-foreground">購物車是空的</p>
            <Link to="/"><Button>去逛逛</Button></Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border divide-y">
              {cartWithDetails.map(({ item, product, detail }) => (
                <div key={item.productId} className="flex items-center gap-3 p-4">
                  <Link to={`/products/${product.id}`} className="shrink-0">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-16 w-16 rounded-md object-cover bg-muted"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${product.id}`}>
                      <p className="font-medium leading-tight line-clamp-1 hover:underline">{product.name}</p>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      NT${product.price.toLocaleString()} / 件
                    </p>
                    {detail && detail.discountType !== 'none' && (
                      <div className="mt-0.5 flex items-center gap-1">
                        <Tag className="h-3 w-3 text-green-600" />
                        <span className="text-xs text-green-600">
                          {detail.discountType === 'full_amount' ? '滿額9折' : `分類${Math.round(detail.discountRate * 100)}折`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-7 text-center text-sm font-medium">{item.quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() => addItem(item.productId)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="w-24 text-right shrink-0">
                    {detail && detail.discountType !== 'none' ? (
                      <div>
                        <p className="font-medium text-green-600">
                          NT${detail.finalSubtotal.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground line-through">
                          NT${detail.originalSubtotal.toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <p className="font-medium">
                        NT${(product.price * item.quantity).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.productId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* 滿額進度條 */}
            {result && (() => {
              const THRESHOLD = 10000
              const pct = Math.min((result.originalTotal / THRESHOLD) * 100, 100)
              const reached = result.originalTotal >= THRESHOLD
              const remaining = THRESHOLD - result.originalTotal
              return (
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5 text-green-600" />
                      {reached
                        ? '已達滿額折扣！全單享 9 折'
                        : `再買 NT$${remaining.toLocaleString()} 享全單 9 折`}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      NT${result.originalTotal.toLocaleString()} / NT$10,000
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${reached ? 'bg-green-500' : 'bg-primary'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {!reached && (
                    <p className="text-xs text-muted-foreground">{FULL_AMOUNT_HINT}</p>
                  )}
                </div>
              )
            })()}

            {isLoading ? (
              <div className="rounded-lg border p-4 space-y-3">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : result ? (
              <div className="rounded-lg border p-4 space-y-3">
                <h3 className="font-semibold">訂單摘要</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">商品原價</span>
                    <span>NT${result.originalTotal.toLocaleString()}</span>
                  </div>
                  {result.totalSaved > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        折扣優惠（
                        {result.appliedDiscount === 'full_amount' && '滿額折扣'}
                        {result.appliedDiscount === 'category' && '分類折扣'}
                        {result.appliedDiscount === 'mixed' && '混合折扣'}
                        ）
                      </span>
                      <span>-NT${result.totalSaved.toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="font-semibold">應付金額</span>
                  <span className="text-xl font-bold">NT${result.finalTotal.toLocaleString()}</span>
                </div>
                {result.totalSaved > 0 && (
                  <div className="rounded-md bg-green-50 p-2 text-center text-sm font-medium text-green-700">
                    省下 NT${result.totalSaved.toLocaleString()}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </main>
    </div>
  )
}
