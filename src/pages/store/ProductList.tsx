import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ArrowRight, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { Product } from '@/types/product'
import { getProducts } from '@/api/products'
import { useCartStore } from '@/store/cartStore'
import { categories } from '@/mock/data'
import { initStorage } from '@/mock/handlers'
import { ProductCard } from '@/components/store/ProductCard'
import { CartDrawer } from '@/components/store/CartDrawer'
import { Footer } from '@/components/store/Footer'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDebounce } from 'use-debounce'
import { FULL_AMOUNT_HINT } from '@/lib/discountHints'

initStorage()

type SortOption = 'default' | 'price_asc' | 'price_desc' | 'sales_desc'

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const [hotProducts, setHotProducts] = useState<Product[]>([])
  const [hotLoading, setHotLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 300)
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>()
  const [sort, setSort] = useState<SortOption>('default')
  const productListRef = useRef<HTMLElement>(null)

  const { addItem } = useCartStore()

  const handleAddToCart = (id: number, name: string) => {
    addItem(id)
    toast.success('已加入購物車', { description: name })
  }

  useEffect(() => {
    getProducts({ page: 1, pageSize: 10, sortBy: 'sales', sortOrder: 'desc', status: 'active' })
      .then(res => setHotProducts(res.data.slice(0, 6)))
      .catch(() => {})
      .finally(() => setHotLoading(false))
  }, [])

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const sortMap: Record<SortOption, { sortBy?: 'price' | 'stock' | 'sales'; sortOrder?: 'asc' | 'desc' }> = {
          default: {},
          price_asc: { sortBy: 'price', sortOrder: 'asc' },
          price_desc: { sortBy: 'price', sortOrder: 'desc' },
          sales_desc: { sortBy: 'sales', sortOrder: 'desc' },
        }
        const res = await getProducts({
          page: 1,
          pageSize: 50,
          search: debouncedSearch || undefined,
          categoryId: selectedCategory,
          status: 'active',
          ...sortMap[sort],
        })
        setProducts(res.data)
        setTotal(res.total ?? 0)
      } finally {
        setIsLoading(false)
      }
    }
    void load()
  }, [debouncedSearch, selectedCategory, sort])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold">Shop Board</h1>
          <div className="flex items-center gap-2">
            <Link to="/admin">
              <Button variant="ghost" size="sm">後台管理</Button>
            </Link>
            <CartDrawer />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4">
        {/* Hero Banner */}
        <section className="py-10">
            <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 px-8 py-10 text-white">
              <p className="mb-1 text-sm font-medium text-slate-300">限時活動</p>
              <h2 className="mb-2 text-3xl font-bold">滿 NT$10,000 享 9 折</h2>
              <p className="mb-4 text-slate-300">{FULL_AMOUNT_HINT}</p>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
                  <Tag className="h-3 w-3" /> 3C 買 2 件 85 折
                </span>
                <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
                  <Tag className="h-3 w-3" /> 服飾 買 3 件 8 折
                </span>
                <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
                  <Tag className="h-3 w-3" /> 書籍 買 5 件 7 折
                </span>
              </div>
            </div>
          </section>

        {/* 熱銷商品 */}
        <section className="pb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">熱銷商品</h2>
            {!hotLoading && (
              <Button variant="ghost" size="sm" onClick={() => {
                setSort('sales_desc')
                productListRef.current?.scrollIntoView({ behavior: 'smooth' })
              }}>
                查看更多 <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {hotLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="overflow-hidden rounded-lg border bg-card">
                    <Skeleton className="aspect-square w-full" />
                    <div className="p-4 flex flex-col min-h-[198px]">
                      <Skeleton className="mb-2 h-5 w-16 rounded-full" />
                      <Skeleton className="mb-1 h-5 w-3/4" />
                      <Skeleton className="mb-0.5 h-4 w-full" />
                      <Skeleton className="mb-2 h-4 w-2/3" />
                      <Skeleton className="mb-2 h-4 w-1/2" />
                      <div className="mt-auto flex items-center justify-between">
                        <div>
                          <Skeleton className="h-5 w-16 mb-1" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                        <Skeleton className="h-9 w-14 rounded-md" />
                      </div>
                    </div>
                  </div>
                ))
              : hotProducts.map(p => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAddToCart={(id) => handleAddToCart(id, p.name)}
                  />
                ))
            }
          </div>
          <Separator className="mt-8" />
        </section>

        {/* 商品列表 */}
        <section ref={productListRef} className="py-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">
                {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : '所有商品'}
              </h2>
              <span className="text-sm text-muted-foreground">共 {total} 件</span>
              {selectedCategory && (
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setSelectedCategory(undefined)}>
                  清除
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-56">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜尋商品…"
                  className="pl-9"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Select value={sort} onValueChange={v => setSort(v as SortOption)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">預設</SelectItem>
                  <SelectItem value="price_asc">價格低→高</SelectItem>
                  <SelectItem value="price_desc">價格高→低</SelectItem>
                  <SelectItem value="sales_desc">最熱銷</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 分類篩選 badge */}
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === undefined ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1"
              onClick={() => setSelectedCategory(undefined)}
            >
              全部
            </Badge>
            {categories.map(c => (
              <Badge
                key={c.id}
                variant={selectedCategory === c.id ? 'default' : 'outline'}
                className="cursor-pointer px-3 py-1"
                onClick={() => setSelectedCategory(c.id)}
              >
                {c.name}
              </Badge>
            ))}
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-square w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
              <p className="text-muted-foreground">沒有找到商品</p>
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setSelectedCategory(undefined) }}>
                清除篩選
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {products.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={(id) => handleAddToCart(id, p.name)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}
