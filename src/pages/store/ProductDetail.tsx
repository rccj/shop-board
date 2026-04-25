import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingCart, Tag, AlertTriangle, Minus, Plus, Truck } from 'lucide-react'
import { CartDrawer } from '@/components/store/CartDrawer'
import { toast } from 'sonner'
import { Product } from '@/types/product'
import { getProduct, getProducts } from '@/api/products'
import { useCartStore } from '@/store/cartStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ProductCard } from '@/components/store/ProductCard'
import { Footer } from '@/components/store/Footer'
import { CATEGORY_DISCOUNT_HINTS } from '@/lib/discountHints'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addItem } = useCartStore()
  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [qty, setQty] = useState(1)

  useEffect(() => {
    if (!id) return
    setIsLoading(true)
    getProduct(Number(id))
      .then(res => {
        setProduct(res.data)
        return getProducts({ page: 1, pageSize: 10, categoryId: res.data.category.id, status: 'active' })
      })
      .then(res => {
        setRelated(res.data.filter(p => p.id !== Number(id)).slice(0, 4))
      })
      .catch(() => navigate('/'))
      .finally(() => setIsLoading(false))
  }, [id, navigate])

  const handleAddToCart = () => {
    if (!product) return
    addItem(product.id, qty)
    toast.success(`已加入購物車`, { description: `${product.name} × ${qty}` })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background sticky top-0 z-10">
          <div className="container mx-auto flex items-center justify-between px-4 py-3">
            <Link to="/"><Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />返回</Button></Link>
            <CartDrawer />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="grid gap-8 md:grid-cols-2">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!product) return null

  const isOutOfStock = product.stock === 0
  const isLowStock = product.stock > 0 && product.stock <= product.lowStockThreshold
  const discountHint = CATEGORY_DISCOUNT_HINTS[product.category.id]

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/"><Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />所有商品</Button></Link>
          <CartDrawer />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl grid gap-8 md:grid-cols-2">
          {/* 圖片 */}
          <div className="overflow-hidden rounded-xl bg-muted">
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover aspect-square"
            />
          </div>

          {/* 資訊 */}
          <div className="flex flex-col gap-5">
            {/* 標題 */}
            <div>
              <Badge variant="secondary" className="mb-2">{product.category.name}</Badge>
              <h1 className="text-2xl font-bold leading-snug">{product.name}</h1>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            <Separator />

            {/* 價格（垂直堆疊） */}
            <div className="space-y-1">
              {product.compareAtPrice && (
                <p className="text-sm text-muted-foreground line-through">
                  NT${product.compareAtPrice.toLocaleString()}
                </p>
              )}
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold">
                  NT${product.price.toLocaleString()}
                </span>
                {product.compareAtPrice && (
                  <Badge variant="destructive">
                    -{Math.round((1 - product.price / product.compareAtPrice) * 100)}%
                  </Badge>
                )}
              </div>
            </div>

            {/* 折扣提示 */}
            {discountHint && (
              <div className="flex items-start gap-2 rounded-lg bg-green-50 dark:bg-green-950 p-3 text-sm text-green-700 dark:text-green-300">
                <Tag className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{discountHint}</span>
              </div>
            )}

            {/* 庫存狀態 */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isOutOfStock ? (
                <Badge variant="destructive">缺貨中</Badge>
              ) : isLowStock ? (
                <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                  <AlertTriangle className="h-4 w-4" />
                  庫存僅剩 {product.stock} 件
                </span>
              ) : (
                <span>庫存 {product.stock} 件</span>
              )}
              <span>·</span>
              <span>已售 {product.sales.toLocaleString()} 件</span>
            </div>

            <Separator />

            {/* 數量 + 加購 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">數量</span>
                <div className="flex items-center rounded-md border">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-r-none"
                    disabled={isOutOfStock || qty <= 1}
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-12 text-center text-sm font-medium tabular-nums">{qty}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-l-none"
                    disabled={isOutOfStock || qty >= product.stock}
                    onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {isOutOfStock ? '目前缺貨' : '加入購物車'}
              </Button>

              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5" />
                  免費配送
                </span>
                <span>·</span>
                <span>7 天退換貨保障</span>
              </div>
            </div>
          </div>
        </div>

        {/* 相關商品 */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-xl font-semibold">同分類商品</h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {related.map(p => (
                <ProductCard key={p.id} product={p} onAddToCart={(pid) => {
                  addItem(pid)
                  const name = related.find(r => r.id === pid)?.name ?? ''
                  toast.success('已加入購物車', { description: name })
                }} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}
