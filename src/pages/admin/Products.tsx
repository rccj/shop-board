import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Upload } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import { useProductStore } from '@/store/productStore'
import { Product } from '@/types/product'
import { categories } from '@/mock/data'
import { initStorage } from '@/mock/handlers'
import { ProductTable } from '@/components/admin/ProductTable'
import { ProductFilters } from '@/components/admin/ProductFilters'
import { BatchActionToolbar } from '@/components/admin/BatchActionToolbar'
import { ProductEditModal } from '@/components/admin/ProductEditModal'
import { ProductAddModal } from '@/components/admin/ProductAddModal'
import { ProductBulkImportModal } from '@/components/admin/ProductBulkImportModal'
import { ProductDeleteDialog } from '@/components/admin/ProductDeleteDialog'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

initStorage()

export default function AdminProducts() {
  const {
    products, total, isLoading,
    search, setSearch,
    categoryId, setCategoryId,
    priceMin, setPriceMin,
    priceMax, setPriceMax,
    stockStatus, setStockStatus,
    status, setStatus,
    sortBy, sortOrder, handleSort,
    page, setPage,
    pageSize, setPageSize,
    handleUpdate, handleCreate, handleBatchCreate, handleDelete, handleBatch,
  } = useProducts()

  const { selectedIds, selectOne, deselectOne, selectAll, clearSelection } = useProductStore()

  const [editTarget, setEditTarget] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [bulkImportOpen, setBulkImportOpen] = useState(false)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const handleSelectOne = (id: number, checked: boolean) => {
    checked ? selectOne(id) : deselectOne(id)
  }

  const handleSelectAll = (checked: boolean) => {
    checked ? selectAll(products.map(p => p.id)) : clearSelection()
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await handleDelete(deleteTarget.id)
      toast.success('已刪除', { description: deleteTarget.name })
    } catch {
      toast.error('刪除失敗，請稍後再試')
    }
    clearSelection()
    setDeleteTarget(null)
  }

  const handleBatchAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (action === 'delete') {
      setBatchDeleteOpen(true)
      return
    }
    await handleBatch({ ids: selectedIds, action })
    clearSelection()
  }

  const handleConfirmBatchDelete = async () => {
    try {
      await handleBatch({ ids: selectedIds, action: 'delete' })
      toast.success(`已刪除 ${selectedIds.length} 筆商品`)
    } catch {
      toast.error('刪除失敗，請稍後再試')
    }
    clearSelection()
    setBatchDeleteOpen(false)
  }

  const resetFilters = () => {
    setSearch('')
    setCategoryId(undefined)
    setPriceMin(undefined)
    setPriceMax(undefined)
    setStockStatus(undefined)
    setStatus(undefined)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">商品管理</h1>
          <p className="text-sm text-muted-foreground">共 {total} 筆商品</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBulkImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            批量匯入
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            新增商品
          </Button>
        </div>
      </div>

      <ProductFilters
        search={search}
        categories={categories}
        categoryId={categoryId}
        priceMin={priceMin}
        priceMax={priceMax}
        stockStatus={stockStatus}
        status={status}
        onSearchChange={setSearch}
        onCategoryChange={setCategoryId}
        onPriceMinChange={setPriceMin}
        onPriceMaxChange={setPriceMax}
        onStockStatusChange={setStockStatus}
        onStatusChange={setStatus}
        onReset={resetFilters}
      />

      <BatchActionToolbar
        count={selectedIds.length}
        onActivate={() => handleBatchAction('activate')}
        onDeactivate={() => handleBatchAction('deactivate')}
        onDelete={() => handleBatchAction('delete')}
        onClear={clearSelection}
      />

      <ProductTable
        products={products}
        isLoading={isLoading}
        selectedIds={selectedIds}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onSelectOne={handleSelectOne}
        onSelectAll={handleSelectAll}
        onEdit={p => setEditTarget(p)}
        onDelete={p => setDeleteTarget(p)}
        onToggleStatus={async p => {
          const newStatus = p.status === 'active' ? 'inactive' : 'active'
          try {
            await handleUpdate(p.id, { status: newStatus })
            toast.success(newStatus === 'active' ? '已上架' : '已下架', { description: p.name })
          } catch {
            toast.error('操作失敗')
          }
        }}
        onReset={resetFilters}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>共 {total} 筆，每頁</span>
          <Select
            value={pageSize.toString()}
            onValueChange={v => setPageSize(Number(v) as 10 | 20 | 50)}
          >
            <SelectTrigger className="h-8 w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span>筆</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            上一頁
          </Button>
          <span className="tabular-nums text-sm text-muted-foreground px-3">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            下一頁
          </Button>
        </div>
      </div>

      <ProductEditModal
        product={editTarget}
        open={!!editTarget}
        onOpenChange={open => !open && setEditTarget(null)}
        categories={categories}
        onSave={handleUpdate}
      />

      <ProductAddModal
        open={addOpen}
        onOpenChange={setAddOpen}
        categories={categories}
        onSave={handleCreate}
      />

      <ProductBulkImportModal
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        categories={categories}
        onImport={handleBatchCreate}
      />

      <ProductDeleteDialog
        product={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={open => !open && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      <AlertDialog open={batchDeleteOpen} onOpenChange={setBatchDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認批次刪除</AlertDialogTitle>
            <AlertDialogDescription>
              即將刪除 <span className="font-semibold text-foreground">{selectedIds.length}</span> 筆商品，此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmBatchDelete}
            >
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
