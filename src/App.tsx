import { HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { Toaster } from 'sonner'
import ProductList from '@/pages/store/ProductList'
import ProductDetail from '@/pages/store/ProductDetail'
import Cart from '@/pages/store/Cart'
import Checkout from '@/pages/store/Checkout'
import AdminProducts from '@/pages/admin/Products'
import { Button } from '@/components/ui/button'
import { ErrorBoundary } from '@/components/ErrorBoundary'

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold">Shop Board <span className="text-muted-foreground font-normal text-base">後台</span></h1>
          <Link to="/"><Button variant="ghost" size="sm">前台商店</Button></Link>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route path="/" element={<ErrorBoundary><ProductList /></ErrorBoundary>} />
        <Route path="/products/:id" element={<ErrorBoundary><ProductDetail /></ErrorBoundary>} />
        <Route path="/cart" element={<ErrorBoundary><Cart /></ErrorBoundary>} />
        <Route path="/checkout" element={<ErrorBoundary><Checkout /></ErrorBoundary>} />
        <Route path="/admin" element={<Navigate to="/admin/products" replace />} />
        <Route
          path="/admin/products"
          element={
            <AdminLayout>
              <AdminProducts />
            </AdminLayout>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
