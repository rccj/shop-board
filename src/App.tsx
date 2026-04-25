import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { Toaster } from 'sonner'
import ProductList from '@/pages/store/ProductList'
import ProductDetail from '@/pages/store/ProductDetail'
import Cart from '@/pages/store/Cart'
import AdminProducts from '@/pages/admin/Products'
import { Button } from '@/components/ui/button'

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
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route path="/" element={<ProductList />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
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
    </BrowserRouter>
  )
}
