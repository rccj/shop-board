import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Upload } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Product, Category } from '@/types/product'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(1, '請輸入商品名稱').max(100, '名稱不可超過 100 字'),
  description: z.string().min(1, '請輸入商品描述').max(500, '描述不可超過 500 字'),
  price: z.coerce.number().min(1, '售價必須大於 0'),
  compareAtPrice: z.preprocess(
    v => (v === '' || v == null) ? undefined : Number(v),
    z.number().min(1, '原價必須大於 0').optional()
  ),
  categoryId: z.coerce.number({ invalid_type_error: '請選擇分類' }).min(1, '請選擇分類'),
  stock: z.coerce.number().min(0, '庫存不可為負數').int('庫存必須為整數'),
  lowStockThreshold: z.coerce.number().min(1, '請設定低庫存門檻').int('門檻必須為整數'),
  status: z.enum(['active', 'inactive']),
}).refine(
  data => !data.compareAtPrice || data.compareAtPrice > data.price,
  { message: '原價必須高於售價', path: ['compareAtPrice'] }
)

type FormValues = z.infer<typeof schema>

const err = (msg?: string) => msg ? <p className="text-xs text-destructive mt-0.5">{msg}</p> : null

interface Props {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  onSave: (id: number, updates: Partial<Omit<Product, 'id'>>) => Promise<void>
}

export function ProductEditModal({ product, open, onOpenChange, categories, onSave }: Props) {
  const [imageValue, setImageValue] = useState('')
  const [imageMode, setImageMode] = useState<'url' | 'file'>('url')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        categoryId: product.category.id,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        status: product.status,
      })
      setImageValue(product.images[0] ?? '')
      setImageMode('url')
    }
  }, [product, reset])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImageValue(reader.result as string)
    reader.readAsDataURL(file)
  }

  const onSubmit = async (values: FormValues) => {
    if (!product) return
    const category = categories.find(c => c.id === values.categoryId)!
    try {
      await onSave(product.id, {
        name: values.name,
        description: values.description,
        price: values.price,
        compareAtPrice: values.compareAtPrice || undefined,
        category,
        images: [imageValue || product.images[0]],
        stock: values.stock,
        lowStockThreshold: values.lowStockThreshold,
        status: values.status,
      })
      toast.success('已儲存', { description: values.name })
      onOpenChange(false)
    } catch {
      toast.error('儲存失敗，請稍後再試')
    }
  }

  const e = (f: keyof typeof errors) => errors[f]?.message as string | undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>編輯商品</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="-mx-6 px-6 overflow-y-auto max-h-[65vh] space-y-4 pb-2 [&::-webkit-scrollbar]:hidden">

            {/* 圖片 */}
            <div className="space-y-2">
              <Label>商品圖片</Label>
              <div className="flex gap-3">
                {imageValue && (
                  <img src={imageValue} alt="preview" className="h-20 w-20 shrink-0 rounded border object-cover" />
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex rounded-md border text-xs">
                    <button type="button" className={`flex-1 px-3 py-1.5 rounded-l-md transition-colors ${imageMode === 'url' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`} onClick={() => setImageMode('url')}>URL</button>
                    <button type="button" className={`flex-1 px-3 py-1.5 rounded-r-md transition-colors ${imageMode === 'file' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`} onClick={() => setImageMode('file')}>上傳</button>
                  </div>
                  {imageMode === 'url' ? (
                    <Input placeholder="https://..." value={imageValue.startsWith('data:') ? '' : imageValue} onChange={e => setImageValue(e.target.value)} />
                  ) : (
                    <>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                      <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="mr-2 h-3.5 w-3.5" />選擇圖片
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-name">商品名稱</Label>
              <Input id="edit-name" className={cn(errors.name && 'border-destructive focus-visible:ring-0')} {...register('name')} />
              {err(e('name'))}
            </div>

            <div className="space-y-1">
              <Label>商品描述</Label>
              <Input className={cn(errors.description && 'border-destructive focus-visible:ring-0')} {...register('description')} />
              {err(e('description'))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>售價</Label>
                <Input type="number" className={cn(errors.price && 'border-destructive focus-visible:ring-0')} {...register('price')} />
                {err(e('price'))}
              </div>
              <div className="space-y-1">
                <Label>原價（選填）</Label>
                <Input type="number" className={cn(errors.compareAtPrice && 'border-destructive focus-visible:ring-0')} {...register('compareAtPrice')} />
                {err(e('compareAtPrice'))}
              </div>
            </div>

            <div className="space-y-1">
              <Label>分類</Label>
              <Select value={watch('categoryId')?.toString()} onValueChange={v => setValue('categoryId', Number(v), { shouldValidate: true })}>
                <SelectTrigger className={cn(errors.categoryId && 'border-destructive focus-visible:ring-0')}>
                  <SelectValue placeholder="選擇分類" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {err(e('categoryId'))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>庫存</Label>
                <Input type="number" className={cn(errors.stock && 'border-destructive focus-visible:ring-0')} {...register('stock')} />
                {err(e('stock'))}
              </div>
              <div className="space-y-1">
                <Label>低庫存門檻</Label>
                <Input type="number" className={cn(errors.lowStockThreshold && 'border-destructive focus-visible:ring-0')} {...register('lowStockThreshold')} />
                {err(e('lowStockThreshold'))}
              </div>
            </div>

            <div className="space-y-1">
              <Label>狀態</Label>
              <Select value={watch('status')} onValueChange={v => setValue('status', v as 'active' | 'inactive')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">上架</SelectItem>
                  <SelectItem value="inactive">下架</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? '儲存中…' : '儲存'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
