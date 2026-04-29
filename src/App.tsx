import { HashRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import ProductList from '@/pages/store/ProductList'
import ProductDetail from '@/pages/store/ProductDetail'
import Cart from '@/pages/store/Cart'
import Checkout from '@/pages/store/Checkout'
import AdminProducts from '@/pages/admin/Products'
import AdminLogin from '@/pages/admin/Login'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { ErrorBoundary } from '@/components/ErrorBoundary'

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

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold">Shop Board <span className="text-muted-foreground font-normal text-base">後台</span></h1>
          <div className="flex items-center gap-2">
            <Link to="/"><Button variant="ghost" size="sm">前台商店</Button></Link>
            <Button variant="ghost" size="sm" onClick={handleLogout}>登出</Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">{children}</main>
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
