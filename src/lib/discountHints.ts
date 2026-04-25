// category.id → 折扣提示文字（對應前台商品分類）
// 折扣計算使用 discount.ts 的 electronics/clothing/books 規則
// 前台分類 id:1(3C電子)=electronics, id:2(服飾配件)=clothing, id:6(書籍文具)=books
export const CATEGORY_DISCOUNT_HINTS: Record<number, string> = {
  1: '買 2 件以上 3C電子商品，每件享 85 折優惠',
  2: '買 3 件以上服飾配件，每件享 8 折優惠',
  6: '買 5 件以上書籍文具，每件享 7 折優惠',
}

// 全站滿額提示
export const FULL_AMOUNT_HINT = '訂單滿 NT$10,000，全單享 9 折優惠'
