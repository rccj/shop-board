import { useState } from 'react'
import { HashRouter, Routes, Route, Navigate, Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import ProductList from '@/pages/store/ProductList'
import ProductDetail from '@/pages/store/ProductDetail'
import Cart from '@/pages/store/Cart'
import Checkout from '@/pages/store/Checkout'
import AdminProducts from '@/pages/admin/Products'
import AdminLogin from '@/pages/admin/Login'
import { useAuthStore } from '@/store/authStore'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Package, Store, LogOut, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/admin/products', label: '商品管理', icon: Package },
]

function AdminGuard({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token)
  const location = useLocation()
  if (!token) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
  }
  return <>{children}</>
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  const logout = useAuthStore(s => s.logout)
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col border-r bg-background transition-all duration-200 shrink-0',
          collapsed ? 'w-14' : 'w-52',
        )}
      >
        {/* Logo + toggle */}
        <div className="flex h-14 items-center justify-between border-b px-3 gap-2">
          {collapsed ? (
            <ShoppingBag className="h-5 w-5 text-primary mx-auto" />
          ) : (
            <span className="font-bold text-sm truncate">Shop Board 後台</span>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="shrink-0 rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-0.5 p-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <Tooltip key={to} delayDuration={0}>
              <TooltipTrigger asChild>
                <NavLink to={to}>
                  {({ isActive }) => (
                    <span className={cn(
                      'flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors cursor-pointer',
                      collapsed ? 'justify-center' : '',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}>
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{label}</span>}
                    </span>
                  )}
                </NavLink>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">{label}</TooltipContent>
              )}
            </Tooltip>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="border-t p-2 space-y-0.5">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Link to="/" className={cn(
                'flex items-center gap-3 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
                collapsed ? 'justify-center' : '',
              )}>
                <Store className="h-4 w-4 shrink-0" />
                {!collapsed && <span>前台商店</span>}
              </Link>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">前台商店</TooltipContent>}
          </Tooltip>

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
                  collapsed ? 'justify-center' : '',
                )}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {!collapsed && <span>登出</span>}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">登出</TooltipContent>}
          </Tooltip>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <TooltipProvider>
    <HashRouter>
      <Toaster richColors position="top-center" />
      <Routes>
        <Route path="/" element={<ErrorBoundary><ProductList /></ErrorBoundary>} />
        <Route path="/products/:id" element={<ErrorBoundary><ProductDetail /></ErrorBoundary>} />
        <Route path="/cart" element={<ErrorBoundary><Cart /></ErrorBoundary>} />
        <Route path="/checkout" element={<ErrorBoundary><Checkout /></ErrorBoundary>} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <AdminGuard>
              <Navigate to="/admin/products" replace />
            </AdminGuard>
          }
        />
        <Route
          path="/admin/products"
          element={
            <AdminGuard>
              <AdminLayout>
                <AdminProducts />
              </AdminLayout>
            </AdminGuard>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
    </TooltipProvider>
  )
}
