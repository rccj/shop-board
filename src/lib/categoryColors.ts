const CATEGORY_COLORS: Record<number, string> = {
  1: 'bg-transparent border-blue-400 text-blue-600',
  2: 'bg-transparent border-purple-400 text-purple-600',
  3: 'bg-transparent border-emerald-400 text-emerald-600',
  4: 'bg-transparent border-pink-400 text-pink-600',
  5: 'bg-transparent border-orange-400 text-orange-600',
  6: 'bg-transparent border-amber-400 text-amber-600',
}

export const getCategoryColor = (id: number) =>
  CATEGORY_COLORS[id] ?? 'bg-muted text-muted-foreground border-border'
