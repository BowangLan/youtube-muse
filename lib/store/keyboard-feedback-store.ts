import { create } from "zustand"

export type KeyboardFeedbackIcon =
  | "play"
  | "pause"
  | "skip-forward"
  | "skip-back"
  | "next"
  | "previous"
  | "volume"
  | "mute"
  | "seek-forward"
  | "seek-backward"

export type KeyboardFeedback = {
  label: string
  icon?: KeyboardFeedbackIcon
}

type KeyboardFeedbackState = {
  currentFeedback: KeyboardFeedback | null
  showFeedback: (feedback: KeyboardFeedback) => void
  clearFeedback: () => void
}

export const useKeyboardFeedbackStore = create<KeyboardFeedbackState>(
  (set) => ({
    currentFeedback: null,
    showFeedback: (feedback) => set({ currentFeedback: feedback }),
    clearFeedback: () => set({ currentFeedback: null }),
  })
)
