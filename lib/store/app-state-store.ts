import { create } from "zustand"

export type AppState = {
  isFocused: boolean
}

export type AppStateActions = {
  toggleFocus: () => void
}

export const useAppStateStore = create<AppState & AppStateActions>((set) => ({
  isFocused: false,
  toggleFocus: () => set((state) => ({ isFocused: !state.isFocused })),
}))