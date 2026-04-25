import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, CreditCard, MapPin, User } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useCartStore } from '@/store/cartStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Footer } from '@/components/store/Footer'

export default function Checkout() {
  const { result } = useCart()
  const { items, clearCart } = useCartStore()
  const navigate = useNavigate()
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    clearCart()
    setTimeout(() => navigate('/'), 3000)
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500" />
        <h1 className="text-2xl font-bold">訂單已送出！</h1>
        <p className="text-muted-foreground">感謝您的購買，我們將盡快為您處理。</p>
        <p className="text-sm text-muted-foreground">3 秒後自動返回首頁…</p>
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

          {/* 右側：訂單摘要 */}
          <div>
            <div className="sticky top-20 rounded-lg border p-4 space-y-3">
              <h2 className="font-semibold">訂單摘要</h2>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>商品小計</span>
                  <span>NT${result?.originalTotal.toLocaleString() ?? '—'}</span>
                </div>
                {result && result.totalSaved > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>折扣優惠</span>
                    <span>-NT${result.totalSaved.toLocaleString()}</span>
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
                <span className="text-lg">NT${result?.finalTotal.toLocaleString() ?? '—'}</span>
              </div>
              <Button type="submit" className="w-full" size="lg">
                確認下單
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                按下確認即表示同意服務條款
              </p>
            </div>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  )
}
