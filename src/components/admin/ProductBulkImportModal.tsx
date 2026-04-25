import { useRef, useState, useEffect } from 'react'
import { Upload, Download, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Category, Product } from '@/types/product'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const MAX_ROWS = 200

interface ParsedRow {
  index: number
  raw: Record<string, string>
  data?: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
  errors: string[]
}

interface ImportResult {
  success: number
  skipped: number   // 格式錯誤，未送出
  apiError: boolean // API 整批失敗
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  onImport: (rows: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>
}

const CSV_HEADERS = ['name', 'description', 'price', 'compareAtPrice', 'categoryId', 'stock', 'lowStockThreshold', 'status', 'imageUrl']

const TEMPLATE_CSV = [
  CSV_HEADERS.join(','),
  '範例商品A,這是商品描述,990,1290,1,50,5,active,',
  '範例商品B,另一個商品描述,1500,,3,20,3,active,',
].join('\n')

const CATEGORY_LABEL: Record<number, string> = {
  1: '3C電子', 2: '服飾配件', 3: '居家生活',
  4: '美妝保養', 5: '運動戶外', 6: '書籍文具',
}

function parseCSV(text: string, categories: Category[]): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim())

  return lines.slice(1).map((line, i) => {
    const values = line.split(',')
    const raw: Record<string, string> = {}
    headers.forEach((h, j) => { raw[h] = (values[j] ?? '').trim() })

    const errors: string[] = []
    const name = raw.name ?? ''
    const description = raw.description ?? ''
    const price = Number(raw.price)
    const compareAtPrice = raw.compareAtPrice ? Number(raw.compareAtPrice) : undefined
    const categoryId = Number(raw.categoryId)
    const stock = Number(raw.stock)
    const lowStockThreshold = Number(raw.lowStockThreshold)
    const status = raw.status as 'active' | 'inactive'

    if (!name) errors.push('名稱必填')
    if (!description) errors.push('描述必填')
    if (!raw.price || isNaN(price) || price <= 0) errors.push('售價需大於 0')
    if (raw.compareAtPrice && (isNaN(compareAtPrice!) || compareAtPrice! <= 0)) errors.push('原價格式錯誤')
    if (compareAtPrice && compareAtPrice <= price) errors.push('原價需高於售價')
    if (!raw.categoryId || isNaN(categoryId) || !categories.find(c => c.id === categoryId)) errors.push(`分類 ID 無效（有效：${categories.map(c => `${c.id}=${c.name}`).join('、')}）`)
    if (raw.stock === '' || isNaN(stock) || stock < 0 || !Number.isInteger(stock)) errors.push('庫存需為非負整數')
    if (!raw.lowStockThreshold || isNaN(lowStockThreshold) || lowStockThreshold < 1 || !Number.isInteger(lowStockThreshold)) errors.push('低庫存門檻需為正整數')
    if (status !== 'active' && status !== 'inactive') errors.push('狀態需為 active 或 inactive')

    if (errors.length > 0) return { index: i + 1, raw, errors }

    const category = categories.find(c => c.id === categoryId)!
    const seed = name.toLowerCase().replace(/\s+/g, '')
    return {
      index: i + 1,
      raw,
      errors: [],
      data: {
        name,
        description,
        price,
        compareAtPrice,
        category,
        images: [raw.imageUrl || `https://picsum.photos/seed/${seed}/400/400`],
        stock,
        lowStockThreshold,
        sales: 0,
        status,
      },
    }
  })
}

function downloadTemplate() {
  const blob = new Blob(['﻿' + TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '商品匯入範本.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export function ProductBulkImportModal({ open, onOpenChange, categories, onImport }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [overLimitCount, setOverLimitCount] = useState<number | null>(null)

  useEffect(() => {
    if (!importing) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [importing])

  const validRows = rows.filter(r => r.errors.length === 0)
  const invalidRows = rows.filter(r => r.errors.length > 0)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      const parsed = parseCSV(text, categories)
      if (parsed.length > MAX_ROWS) {
        setOverLimitCount(parsed.length)
        setRows([])
      } else {
        setOverLimitCount(null)
        setRows(parsed)
      }
      setResult(null)
    }
    reader.readAsText(file, 'UTF-8')
    e.target.value = ''
  }

  const handleImport = async () => {
    const toImport = validRows.map(r => r.data!)
    setImporting(true)
    try {
      await onImport(toImport)
      setResult({ success: toImport.length, skipped: invalidRows.length, apiError: false })
    } catch {
      setResult({ success: 0, skipped: invalidRows.length, apiError: true })
    } finally {
      setImporting(false)
    }
  }

  // 匯入中禁止關閉
  const handleClose = () => {
    if (importing) return
    setRows([])
    setResult(null)
    setOverLimitCount(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>批量匯入商品</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-hidden">
          {/* Step 1: 操作區 */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              下載 CSV 範本
            </Button>
            <Button size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              上傳 CSV
            </Button>
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
            {rows.length > 0 && !result && (
              <span className="text-sm text-muted-foreground">
                共 {rows.length} 筆：
                <span className="text-green-600 font-medium"> {validRows.length} 筆正常</span>
                {invalidRows.length > 0 && <span className="text-destructive font-medium">，{invalidRows.length} 筆錯誤</span>}
              </span>
            )}
          </div>

          {/* 欄位說明 */}
          {rows.length === 0 && (
            <div className="rounded-lg border border-dashed p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">CSV 欄位說明</p>
                <span className="text-xs text-muted-foreground">每次最多 {MAX_ROWS} 筆</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-1.5 pr-4 font-medium">欄位</th>
                    <th className="pb-1.5 pr-4 font-medium">說明</th>
                    <th className="pb-1.5 pr-4 font-medium">規則</th>
                    <th className="pb-1.5 font-medium">必填</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[
                    { field: 'name',              label: '商品名稱',   rule: '—',                   required: true },
                    { field: 'description',       label: '商品描述',   rule: '—',                   required: true },
                    { field: 'price',             label: '售價',       rule: '數字 > 0',             required: true },
                    { field: 'compareAtPrice',    label: '原價',       rule: '數字 > 售價',          required: false },
                    { field: 'categoryId',        label: '分類 ID',    rule: '1–6（見下方）',        required: true },
                    { field: 'stock',             label: '庫存數量',   rule: '非負整數',             required: true },
                    { field: 'lowStockThreshold', label: '低庫存門檻', rule: '正整數',               required: true },
                    { field: 'status',            label: '上架狀態',   rule: 'active / inactive',   required: true },
                    { field: 'imageUrl',          label: '圖片網址',   rule: '空白自動產生示意圖',    required: false },
                  ].map(({ field, label, rule, required }) => (
                    <tr key={field}>
                      <td className="py-1.5 pr-4">
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{field}</code>
                      </td>
                      <td className="py-1.5 pr-4 text-muted-foreground">{label}</td>
                      <td className="py-1.5 pr-4 text-muted-foreground">{rule}</td>
                      <td className="py-1.5">
                        {required
                          ? <span className="text-xs font-medium text-destructive">必填</span>
                          : <span className="text-xs text-muted-foreground">選填</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-muted-foreground border-t pt-2">
                分類 ID：{Object.entries(CATEGORY_LABEL).map(([id, name]) => (
                  <span key={id} className="mr-2"><code className="bg-muted px-1 rounded">{id}</code> {name}</span>
                ))}
              </p>
            </div>
          )}

          {/* 超量擋住 */}
          {overLimitCount && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm space-y-1">
              <p className="font-medium text-destructive">檔案筆數超過上限</p>
              <p className="text-muted-foreground">
                檔案共 <span className="font-medium text-foreground">{overLimitCount}</span> 筆，每次最多 <span className="font-medium text-foreground">{MAX_ROWS}</span> 筆。請將 CSV 裁切後分批上傳。
              </p>
            </div>
          )}

          {/* 匯入結果 */}
          {result && (
            <div className="rounded-lg border p-4 space-y-1.5">
              {result.apiError ? (
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-4 w-4" />
                  <span className="font-medium">匯入失敗，請稍後再試</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">成功匯入 {result.success} 筆</span>
                </div>
              )}
              {result.skipped > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <XCircle className="h-3.5 w-3.5 text-destructive" />
                  {result.skipped} 筆格式錯誤，已略過（未送出）
                </div>
              )}
            </div>
          )}

          {/* 預覽表格 */}
          {rows.length > 0 && !result && (
            <div className="-mx-6 px-6 overflow-y-auto max-h-[45vh] [&::-webkit-scrollbar]:hidden">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3 w-8">#</th>
                    <th className="py-2 pr-3">名稱</th>
                    <th className="py-2 pr-3">售價</th>
                    <th className="py-2 pr-3">分類</th>
                    <th className="py-2 pr-3">庫存</th>
                    <th className="py-2 pr-3">狀態</th>
                    <th className="py-2">檢查</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.index} className={`border-b last:border-0 ${row.errors.length > 0 ? 'bg-destructive/5' : ''}`}>
                      <td className="py-2 pr-3 text-muted-foreground">{row.index}</td>
                      <td className="py-2 pr-3 max-w-[160px] truncate">{row.raw.name || '—'}</td>
                      <td className="py-2 pr-3">{row.raw.price ? `NT$${Number(row.raw.price).toLocaleString()}` : '—'}</td>
                      <td className="py-2 pr-3">{row.raw.categoryId ? (CATEGORY_LABEL[Number(row.raw.categoryId)] ?? `ID:${row.raw.categoryId}`) : '—'}</td>
                      <td className="py-2 pr-3">{row.raw.stock || '—'}</td>
                      <td className="py-2 pr-3">
                        {row.raw.status === 'active'
                          ? <Badge variant="success">上架</Badge>
                          : row.raw.status === 'inactive'
                          ? <Badge variant="secondary">下架</Badge>
                          : <span className="text-destructive">—</span>}
                      </td>
                      <td className="py-2">
                        {row.errors.length === 0
                          ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                          : (
                            <div className="space-y-0.5">
                              {row.errors.map((e, i) => (
                                <p key={i} className="text-xs text-destructive">{e}</p>
                              ))}
                            </div>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={handleClose} disabled={importing}>
            {result ? '關閉' : '取消'}
          </Button>
          {!result && validRows.length > 0 && (
            <Button onClick={handleImport} disabled={importing}>
              {importing
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />匯入中，請勿關閉…</>
                : `匯入 ${validRows.length} 筆商品${invalidRows.length > 0 ? `（跳過 ${invalidRows.length} 筆錯誤）` : ''}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
