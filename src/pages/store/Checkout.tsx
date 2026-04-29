import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, CreditCard, MapPin, User, Tag, ChevronDown } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useCart } from '@/hooks/useCart'
import { useCartStore } from '@/store/cartStore'
import { getCartProducts } from '@/api/cart'
import { Product } from '@/types/product'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Footer } from '@/components/store/Footer'

export default function Checkout() {
  const { result, calculate } = useCart()
  const { items, clearCart } = useCartStore()
  const navigate = useNavigate()
  const [submitted, setSubmitted] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [products, setProducts] = useState<Product[]>([])
  const [discountExpanded, setDiscountExpanded] = useState(false)

  useEffect(() => {
    if (items.length > 0) setProducts(getCartProducts(items.map(i => i.productId)))
  }, [items])

  useEffect(() => {
    void calculate()
  }, [calculate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    clearCart()
  }

  useEffect(() => {
    if (!submitted) return
    if (countdown <= 0) {
      navigate('/')
      return
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [submitted, countdown, navigate])

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500" />
        <h1 className="text-2xl font-bold">訂單已送出！</h1>
        <p className="text-muted-foreground">感謝您的購買，我們將盡快為您處理。</p>
        <p className="text-sm text-muted-foreground">{countdown} 秒後自動返回首頁…</p>
        <Link to="/"><Button variant="outline">立即返回首頁</Button></Link>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-muted-foreground">購物車是空的</p>
        <Link to="/"><Button>去逛逛</Button></Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/cart">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回購物車
            </Button>
          </Link>
          <h1 className="text-xl font-bold">結帳</h1>
          <div className="w-24" />
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-8">
        <form onSubmit={handleSubmit} className="grid gap-8 md:grid-cols-[1fr_320px]">
          {/* 左側：填寫資訊 */}
          <div className="space-y-6">
            {/* 收件人 */}
            <section className="space-y-4">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <User className="h-4 w-4" /> 收件人資訊
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">姓名</Label>
                  <Input id="name" placeholder="王小明" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="phone">電話</Label>
                  <Input id="phone" type="tel" placeholder="0912-345-678" required />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="example@mail.com" required />
              </div>
            </section>

            <Separator />

            {/* 配送地址 */}
            <section className="space-y-4">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <MapPin className="h-4 w-4" /> 配送地址
              </h2>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="address">地址</Label>
                <Input id="address" placeholder="台北市信義區信義路五段 7 號" required />
              </div>
            </section>

            <Separator />

            {/* 付款方式 */}
            <section className="space-y-4">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <CreditCard className="h-4 w-4" /> 付款方式
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {['信用卡', '超商付款', 'LINE Pay'].map(method => (
                  <label
                    key={method}
                    className="flex cursor-pointer items-center justify-center rounded-lg border p-3 text-sm font-medium transition-colors hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <input type="radio" name="payment" value={method} defaultChecked={method === '信用卡'} className="sr-only" />
                    {method}
                  </label>
                ))}
              </div>
            </section>
          </div>

          {/* 右側：訂單明細 */}
          {(() => {
            const cartWithDetails = items.flatMap(item => {
              const product = products.find(p => p.id === item.productId)
              if (!product) return []
              const detail = result?.discounts.find(d => d.productId === item.productId)
              return [{ item, product, detail }]
            })
            const markedTotal = cartWithDetails.reduce(
              (sum, { product, item }) => sum + (product.compareAtPrice ?? product.price) * item.quantity, 0
            )
            const totalDisplaySaved = result ? markedTotal - result.finalTotal : 0
            const THRESHOLD = 10000
            const pct = Math.min(((result?.originalTotal ?? 0) / THRESHOLD) * 100, 100)
            const reached = (result?.originalTotal ?? 0) >= THRESHOLD
            const productMarkdownItems = cartWithDetails.filter(
              ({ product }) => product.compareAtPrice && product.compareAtPrice > product.price
            )
            const cartDiscountItems = cartWithDetails.filter(
              ({ detail }) => detail && detail.discountType !== 'none'
            )
            return (
              <div>
                <div className="sticky top-20 rounded-lg border p-4 space-y-3">
                  <h2 className="font-semibold">訂單明細</h2>

                  {/* 商品列表 */}
                  <div className="divide-y">
                    {cartWithDetails.map(({ item, product, detail }) => {
                      const hasDiscount = detail && detail.discountType !== 'none'
                      const markedSubtotal = (product.compareAtPrice ?? product.price) * item.quantity
                      const finalAmt = hasDiscount ? detail.finalSubtotal : product.price * item.quantity
                      const showStrike = markedSubtotal > finalAmt
                      return (
                        <div key={item.productId} className="flex items-start gap-2 py-2 text-sm">
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-10 w-10 rounded object-cover bg-muted shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="font-medium leading-tight line-clamp-2 cursor-default">{product.name}</p>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[200px]">{product.name}</TooltipContent>
                            </Tooltip>
                            <p className="text-muted-foreground text-xs">× {item.quantity}</p>
                            {detail && detail.discountType !== 'none' && (
                              <span className="flex items-center gap-1 text-xs text-green-600 mt-0.5">
                                <Tag className="h-3 w-3" />
                                {detail.discountType === 'full_amount' ? '滿額9折' : detail.discountType === 'second_item_half' ? '第二件半價' : `分類${Number.isInteger(detail.discountRate * 10) ? detail.discountRate * 10 : Math.round(detail.discountRate * 100)}折`}
                              </span>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            {showStrike ? (
                              <>
                                <p className="font-medium text-green-600 tabular-nums">NT${finalAmt.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground line-through tabular-nums">NT${markedSubtotal.toLocaleString()}</p>
                              </>
                            ) : (
                              <p className="font-medium tabular-nums">NT${finalAmt.toLocaleString()}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <Separator />

                  {/* 滿額進度條 */}
                  {result && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-1 font-medium underline cursor-pointer">
                              <Tag className="h-3 w-3 text-green-600" />
                              {reached ? '已達滿額折扣！全單9折' : `再 NT$${(THRESHOLD - result.originalTotal).toLocaleString()} 享全單9折`}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top">優惠不疊加，每件商品自動套用最優折扣</TooltipContent>
                        </Tooltip>
                        <span className="text-muted-foreground">{Math.floor(pct)}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${reached ? 'bg-green-500' : 'bg-primary'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* 金額明細 */}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>商品小計</span>
                      <span className="tabular-nums">NT${markedTotal.toLocaleString()}</span>
                    </div>
                    {totalDisplaySaved > 0 && (
                      <div>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between text-green-600 text-xs py-0.5"
                          onClick={() => setDiscountExpanded(e => !e)}
                        >
                          <span className="flex items-center gap-1">
                            折扣優惠
                            <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${discountExpanded ? 'rotate-180' : ''}`} />
                          </span>
                          <span className="tabular-nums">-NT${totalDisplaySaved.toLocaleString()}</span>
                        </button>
                        {discountExpanded && (
                          <div className="mt-1 space-y-1 pl-2 border-l-2 border-green-100">
                            {cartWithDetails.map(({ product, item, detail }) => {
                              const hasMd = product.compareAtPrice && product.compareAtPrice > product.price
                              const hasCart = detail && detail.discountType !== 'none'
                              if (!hasMd && !hasCart) return null
                              return (
                                <div key={product.id} className="space-y-0.5">
                                  {hasMd && (
                                    <div className="flex justify-between text-[10px] text-blue-600">
                                      <span className="truncate mr-2">{product.name} ×{item.quantity} <span className="opacity-75">(商品折扣)</span></span>
                                      <span className="shrink-0">-NT${((product.compareAtPrice! - product.price) * item.quantity).toLocaleString()}</span>
                                    </div>
                                  )}
                                  {hasCart && (
                                    <div className="flex justify-between text-[10px] text-green-600">
                                      <span className="truncate mr-2">{product.name} ×{item.quantity} <span className="opacity-75">({detail!.discountType === 'full_amount' ? '滿額9折' : detail!.discountType === 'second_item_half' ? '第二件半價' : `分類${Number.isInteger(detail!.discountRate * 10) ? detail!.discountRate * 10 : Math.round(detail!.discountRate * 100)}折`})</span></span>
                                      <span className="shrink-0">-NT${(detail!.originalSubtotal - detail!.finalSubtotal).toLocaleString()}</span>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex justify-between text-muted-foreground">
                      <span>運費</span>
                      <span>免費</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between font-semibold">
                    <span>應付金額</span>
                    <span className="text-lg tabular-nums">NT${result?.finalTotal.toLocaleString() ?? '—'}</span>
                  </div>
                  <Button type="submit" className="w-full" size="lg">
                    確認下單
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    按下確認即表示同意服務條款
                  </p>
                </div>
              </div>
            )
          })()}
        </form>
      </main>
      <Footer />
    </div>
  )
}
