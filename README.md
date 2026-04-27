# Shop Board

E-commerce storefront & admin panel with a full-featured product management system.

**[Live Demo](https://rccj.github.io/shop-board)**

---

## Features

### Storefront
- Product listing with search, category filter, and sort
- Product detail page with discount hints and low-stock warning
- Shopping cart with real-time discount calculation
- Hero banner and hot-selling products section

### Admin Panel
- Product CRUD with image upload (URL or local file)
- Inline status toggle, bulk activate / deactivate / delete
- CSV bulk import with per-row validation and error preview (max 200 rows)
- Multi-filter: category, price range, stock status, listing status
- Sortable columns, pagination, and batch action floating toolbar

### Discount Engine (`src/lib/discount.ts`)
- Full-amount discount: order ≥ NT$10,000 → 10% off
- Category discount: electronics ×2 → 15% off, clothing ×3 → 20% off, books ×5 → 30% off
- Per-item best-deal selection (no stacking)
- Strategy Pattern — adding new rules requires zero changes to existing code

---

## Tech Stack

| | |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Routing | React Router v6 |
| State | Zustand |
| UI | shadcn/ui + Tailwind CSS |
| Forms | React Hook Form + Zod |
| Mock API | localStorage (async/await + simulated delay) |

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

- Storefront: `/`
- Admin panel: `/admin/products`

---

## Project Structure

```
src/
├── api/          # API layer (swap mock → Firebase here only)
├── mock/         # Mock data + localStorage handlers
├── components/
│   ├── ui/       # shadcn/ui components
│   ├── admin/    # Admin-specific components
│   └── store/    # Storefront components
├── pages/
│   ├── store/    # ProductList, ProductDetail, Cart
│   └── admin/    # Products (CRUD + bulk operations)
├── hooks/        # useProducts, useCart
├── store/        # Zustand stores (cart, product selection)
├── lib/          # discount.ts, categoryColors, discountHints
└── types/        # TypeScript interfaces
```

---

## Mock API

All API calls use `async/await` with 300–600ms simulated delay. Data persists in `localStorage` so refreshing the page keeps your changes.

To swap in a real backend, only replace `src/api/products.ts` — all components, hooks, and stores remain unchanged.

See [MOCK-API.md](./MOCK-API.md) for full endpoint reference.

---

## Development

Built with [Claude Code](https://claude.ai/code) as AI pair programmer.
