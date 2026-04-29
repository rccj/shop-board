import { create } from 'zustand'

interface ProductStoreState {
  selectedIds: number[]
  selectOne: (id: number) => void
  deselectOne: (id: number) => void
  selectAll: (ids: number[]) => void
  clearSelection: () => void
}

export const useProductStore = create<ProductStoreState>(set => ({
  selectedIds: [],
  selectOne: (id) =>
    set(state => ({ selectedIds: [...state.selectedIds, id] })),
  deselectOne: (id) =>
    set(state => ({ selectedIds: state.selectedIds.filter(i => i !== id) })),
  selectAll: (ids) => set({ selectedIds: ids }),
  clearSelection: () => set({ selectedIds: [] }),
}))
