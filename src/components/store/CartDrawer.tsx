import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Minus, Plus, Trash2, Tag, ChevronDown } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useCartStore } from '@/store/cartStore'
import { getCartProducts } from '@/api/cart'
import { Product } from '@/types/product'
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ConfirmPopover } from '@/components/ui/confirm-popover'

export function CartDrawer() {
  const { items, result, addItem, removeItem, updateQuantity, clearCart, calculate } = useCart()
  const { isCartOpen, setCartOpen } = useCartStore()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [discountExpanded, setDiscountExpanded] = useState(false)
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0)

  useEffect(() => {
    if (isCartOpen) {
      triggerRef.current?.click()
      setCartOpen(false)
    }
  }, [isCartOpen, setCartOpen])

  useEffect(() => {
    setProducts(items.length > 0 ? getCartProducts(items.map(i => i.productId)) : [])
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

  const markedTotal = cartWithDetails.reduce(
    (sum, { product, item }) => sum + (product.compareAtPrice ?? product.price) * item.quantity, 0
  )

  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button ref={triggerRef} variant="outline" size="sm" className="relative">
          <ShoppingCart className="h-4 w-4" />
          {cartCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {cartCount}
            </span>
          )}
        </Button>
      </DrawerTrigger>

      <DrawerContent className="inset-x-auto inset-y-0 right-0 mt-0 h-full w-full max-w-sm rounded-none flex flex-col">
        <DrawerHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <DrawerTitle>購物車 {cartCount > 0 && `(${cartCount})`}</DrawerTitle>
            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <ConfirmPopover
                  trigger={
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground">
                      清空
                    </Button>
                  }
                  message="確定要清空購物車？"
                  onConfirm={clearCart}
                />
              )}
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">✕</Button>
              </DrawerClose>
            </div>
          </div>
        </DrawerHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">購物車是空的</p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto divide-y">
              {cartWithDetails.map(({ item, product, detail }) => (
                <div key={item.productId} className="flex items-start gap-3 p-3">
                  <DrawerClose asChild>
                    <Link to={`/products/${product.id}`} className="shrink-0">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-14 w-14 rounded-md object-cover bg-muted"
                      />
                    </Link>
                  </DrawerClose>
                  {/* info + qty controls */}
                  <div className="flex-1 min-w-0 overflow-hidden space-y-1.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-sm font-medium line-clamp-2 cursor-default">{product.name}</p>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[200px]">{product.name}</TooltipContent>
                    </Tooltip>
                    {detail && detail.discountType !== 'none' && (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <Tag className="h-3 w-3" />
                        {detail.discountType === 'full_amount' ? '滿額9折' : detail.discountType === 'second_item_half' ? '第二件半價' : `分類${(Number.isInteger(detail.discountRate * 10) ? detail.discountRate * 10 : Math.round(detail.discountRate * 100))}折`}
                      </span>
                    )}
                    <div className="flex items-center gap-1">
                      {item.quantity === 1 ? (
                        <ConfirmPopover
                          trigger={
                            <Button size="icon" variant="outline" className="h-6 w-6" data-testid="cart-minus">
                              <Minus className="h-3 w-3" />
                            </Button>
                          }
                          message="確定移除此商品？"
                          onConfirm={() => removeItem(item.productId)}
                        />
                      ) : (
                        <Button size="icon" variant="outline" className="h-6 w-6" data-testid="cart-minus"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                      )}
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <Button size="icon" variant="outline" className="h-6 w-6" data-testid="cart-plus"
                        onClick={() => addItem(item.productId)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {/* price + trash */}
                  <div className="flex flex-col items-end justify-between self-stretch shrink-0 w-[5.5rem] overflow-hidden">
                    {detail && detail.discountType !== 'none' ? (
                      <div className="text-right">
                        <p className="truncate text-xs font-medium text-green-600 tabular-nums">NT${detail.finalSubtotal.toLocaleString()}</p>
                        <p className="truncate text-[10px] text-muted-foreground line-through tabular-nums">NT${detail.originalSubtotal.toLocaleString()}</p>
                      </div>
                    ) : (
                      <p className="truncate text-xs font-medium tabular-nums">NT${(product.price * item.quantity).toLocaleString()}</p>
                    )}
                    <ConfirmPopover
                      trigger={
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" data-testid="cart-trash">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      }
                      message="確定移除此商品？"
                      onConfirm={() => removeItem(item.productId)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t p-4 space-y-3">
              {result && (() => {
                const THRESHOLD = 10000
                const pct = Math.min((result.originalTotal / THRESHOLD) * 100, 100)
                const reached = result.originalTotal >= THRESHOLD
                return (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center gap-1 font-medium underline cursor-pointer">
                            <Tag className="h-3 w-3 text-green-600" />
                            {reached ? '已達滿額折扣！全單9折' : `再 NT$${(THRESHOLD - result.originalTotal).toLocaleString()} 享全單9折`}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          優惠不疊加，每件商品自動套用最優折扣
                        </TooltipContent>
                      </Tooltip>
                      <span className="text-muted-foreground">{Math.floor(pct)}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${reached ? 'bg-green-500' : 'bg-primary'}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })()}

              <Separator />

              {result && (() => {
                const totalDisplaySaved = markedTotal - result.finalTotal
                return (
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span className="shrink-0">小計</span>
                      <span className="min-w-0 truncate text-right tabular-nums ml-2">NT${markedTotal.toLocaleString()}</span>
                    </div>
                    {totalDisplaySaved > 0 && (
                      <div>
                        <button
                          className="flex w-full items-center justify-between text-green-600 text-xs py-0.5"
                          onClick={() => setDiscountExpanded(e => !e)}
                        >
                          <span className="flex items-center gap-1 shrink-0">
                            折扣優惠
                            <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${discountExpanded ? 'rotate-180' : ''}`} />
                          </span>
                          <span className="min-w-0 truncate text-right tabular-nums ml-2">-NT${totalDisplaySaved.toLocaleString()}</span>
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
                                    <div className="flex justify-between text-[10px] text-muted-foreground">
                                      <span className="truncate mr-2">{product.name} ×{item.quantity} <span className="text-blue-600">(商品折扣)</span></span>
                                      <span className="shrink-0">-NT${((product.compareAtPrice! - product.price) * item.quantity).toLocaleString()}</span>
                                    </div>
                                  )}
                                  {hasCart && (
                                    <div className="flex justify-between text-[10px] text-muted-foreground">
                                      <span className="truncate mr-2">{product.name} ×{item.quantity} <span className="text-green-600">({detail!.discountType === 'full_amount' ? '滿額9折' : detail!.discountType === 'second_item_half' ? '第二件半價' : `分類${Number.isInteger(detail!.discountRate * 10) ? detail!.discountRate * 10 : Math.round(detail!.discountRate * 100)}折`})</span></span>
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
                    <div className="flex justify-between font-semibold">
                      <span className="shrink-0">應付金額</span>
                      <span className="min-w-0 truncate text-right tabular-nums ml-2">NT${result.finalTotal.toLocaleString()}</span>
                    </div>
                  </div>
                )
              })()}

              <DrawerClose asChild>
                <Link to="/checkout" className="block w-full">
                  <Button className="w-full" size="lg">前往結帳</Button>
                </Link>
              </DrawerClose>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}
