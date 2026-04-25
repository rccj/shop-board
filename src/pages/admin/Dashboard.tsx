import { Link } from 'react-router-dom'
import { Package, ShoppingCart, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">後台首頁</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: '商品管理', icon: Package, href: '/admin/products' },
          { label: '前台商店', icon: ShoppingCart, href: '/' },
          { label: '購物車折扣', icon: TrendingUp, href: '/cart' },
        ].map(item => (
          <Link key={item.href} to={item.href}>
            <div className="flex flex-col items-center gap-3 rounded-lg border p-6 transition-colors hover:bg-accent">
              <item.icon className="h-8 w-8 text-muted-foreground" />
              <span className="font-medium">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>
      <Button asChild>
        <Link to="/admin/products">進入商品管理</Link>
      </Button>
    </div>
  )
}
