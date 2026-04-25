# SETUP — 環境建置

## 一、Claude Code Skills 安裝

```bash
# UI 品質提升，避免 AI 味道太重
npx skills add https://github.com/anthropics/skills --skill frontend-design

# React 效能最佳實務，64 條規則
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices

# UX/可及性/效能 100+ 條規則
npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines

# React 組合模式，元件設計更好
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-composition-patterns

# UI 元件互動最佳實務
npx skills add ibelick/ui-skills

# shadcn/ui 元件最佳實務
npx skills add shadcn/ui

# 程式碼審查，SOLID/資安/效能
npx skills add https://github.com/sanyuan0704/code-review-expert --skill code-review-expert
```

---

## 二、專案初始化

```bash
# 1. 建立專案
npm create vite@latest . -- --template react-ts

# 2. 路由
npm install react-router-dom

# 3. 狀態管理
npm install zustand

# 4. 樣式
npm install tailwindcss @tailwindcss/vite

# 5. shadcn/ui 初始化
npm install class-variance-authority clsx tailwind-merge lucide-react
npx shadcn@latest init

# 6. shadcn 元件
npx shadcn@latest add table dialog alert-dialog select input button checkbox badge form pagination

# 7. 工具套件
npm install use-debounce
npm install react-hook-form zod @hookform/resolvers
```

---

## 三、資料夾結構

```
src/
├── api/                  # API 層（統一入口，mock or firebase）
│   ├── products.ts       # 商品 CRUD
│   └── cart.ts           # 購物車
├── mock/                 # Mock 假資料與延遲模擬
│   ├── data.ts           # 初始商品假資料（localStorage seed）
│   └── handlers.ts       # 模擬 API response 格式與延遲
├── components/
│   ├── ui/               # shadcn/ui 元件
│   ├── admin/            # 後台專用元件
│   └── store/            # 前台專用元件
├── pages/
│   ├── store/
│   │   ├── ProductList.tsx    # 前台商品列表
│   │   └── Cart.tsx           # 購物車（串接折扣邏輯）
│   └── admin/
│       ├── Dashboard.tsx      # 後台首頁
│       └── Products.tsx       # 商品管理（題目一）
├── lib/
│   └── discount.ts       # 折扣計算邏輯（題目二）
├── hooks/
│   ├── useProducts.ts
│   └── useCart.ts
├── store/                # Zustand 狀態
│   ├── cartStore.ts
│   └── productStore.ts
└── types/
    ├── product.ts        # 題目一：照題目給定格式（Category + Product）
    └── discount.ts       # 題目二：完全照題目定義的 interface
```

---

## 四、路由規劃

| 路徑 | 頁面 | 說明 |
|------|------|------|
| `/` | 前台商品列表 | 顧客視角 |
| `/cart` | 購物車 | 串接折扣邏輯 |
| `/admin` | 後台商品管理 | 題目一主要頁面 |

> P2 加分項：`/login` 登入頁 + `/admin` 路由守衛

---

## 五、確認決策

| 項目 | 決策 | 備註 |
|------|------|------|
| Mock 資料儲存 | `localStorage` | 重整不消失，後續可換 Firebase |
| 商品圖片 | `picsum.photos` placeholder | 先用隨機圖，後續可替換 |
| 後台保護 | 暫無登入 | P2 再加 `/login` + 路由守衛 |
