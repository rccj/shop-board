import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Minus, Plus, Trash2, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { useCart } from '@/hooks/useCart'
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
import { FULL_AMOUNT_HINT } from '@/lib/discountHints'

export function CartDrawer() {
  const { items, result, addItem, removeItem, updateQuantity, clearCart, calculate } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0)

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

  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
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
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={clearCart}>
                  清空
                </Button>
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
                <div key={item.productId} className="flex items-center gap-3 p-3">
                  <DrawerClose asChild>
                    <Link to={`/products/${product.id}`} className="shrink-0">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-14 w-14 rounded-md object-cover bg-muted"
                      />
                    </Link>
                  </DrawerClose>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{product.name}</p>
                    <p className="text-xs text-muted-foreground">NT${product.price.toLocaleString()}</p>
                    {detail && detail.discountType !== 'none' && (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <Tag className="h-3 w-3" />
                        {detail.discountType === 'full_amount' ? '滿額9折' : `分類${Math.round(detail.discountRate * 100)}折`}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="icon" variant="outline" className="h-6 w-6"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                    <Button size="icon" variant="outline" className="h-6 w-6"
                      onClick={() => { addItem(item.productId); toast.success('已加入購物車', { description: product.name }) }}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="w-16 text-right shrink-0">
                    {detail && detail.discountType !== 'none' ? (
                      <div>
                        <p className="text-xs font-medium text-green-600">NT${detail.finalSubtotal.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground line-through">NT${detail.originalSubtotal.toLocaleString()}</p>
                      </div>
                    ) : (
                      <p className="text-xs font-medium">NT${(product.price * item.quantity).toLocaleString()}</p>
                    )}
                  </div>
                  <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.productId)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
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
                      <span className="flex items-center gap-1 font-medium">
                        <Tag className="h-3 w-3 text-green-600" />
                        {reached ? '已達滿額折扣！全單9折' : `再 NT$${(THRESHOLD - result.originalTotal).toLocaleString()} 享全單9折`}
                      </span>
                      <span className="text-muted-foreground">{Math.round(pct)}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${reached ? 'bg-green-500' : 'bg-primary'}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })()}

              <Separator />

              {result && (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>小計</span>
                    <span>NT${result.originalTotal.toLocaleString()}</span>
                  </div>
                  {result.totalSaved > 0 && (
                    <div className="flex justify-between text-green-600 text-xs">
                      <span>折扣優惠</span>
                      <span>-NT${result.totalSaved.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold">
                    <span>應付金額</span>
                    <span>NT${result.finalTotal.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <DrawerClose asChild>
                <Link to="/checkout">
                  <Button className="w-full" size="lg">前往結帳</Button>
                </Link>
              </DrawerClose>
              <p className="text-center text-xs text-muted-foreground">{FULL_AMOUNT_HINT}</p>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}
