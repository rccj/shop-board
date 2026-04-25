import { Separator } from '@/components/ui/separator'

export function Footer() {
  return (
    <footer className="mt-16 border-t bg-muted/30">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <h3 className="mb-3 text-base font-bold">Shop Board</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              精選 3C、服飾、居家、美妝、運動、書籍，一站購足。
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">購物指南</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>如何下單</li>
              <li>付款方式</li>
              <li>配送說明</li>
              <li>退換貨政策</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">會員服務</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>會員登入</li>
              <li>訂單查詢</li>
              <li>優惠活動</li>
              <li>點數兌換</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">客服中心</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>聯絡我們</li>
              <li>常見問題</li>
              <li>服務時間</li>
              <li>意見回饋</li>
            </ul>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Shop Board. All rights reserved.</p>
          <div className="flex gap-4">
            <span>隱私權政策</span>
            <span>服務條款</span>
            <span>Cookie 設定</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
