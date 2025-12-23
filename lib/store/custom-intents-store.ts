import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { GRADIENT_CLASS_NAMES, type IntentDefinition } from "@/lib/intents"

// Available gradient classes for custom intents (gradients 7-22, excluding built-in 1-6)
const CUSTOM_INTENT_GRADIENTS = GRADIENT_CLASS_NAMES.slice(6)

export interface CustomIntent extends IntentDefinition {
  id: string
  isCustom: true
  playlistId: string // Links to the playlist with this intent
}

interface CustomIntentsState {
  customIntents: CustomIntent[]
}

interface CustomIntentsActions {
  addCustomIntent: (intent: Omit<CustomIntent, "id" | "gradientClassName" | "isCustom">) => CustomIntent
  removeCustomIntent: (id: string) => void
  getCustomIntent: (id: string) => CustomIntent | undefined
  getCustomIntentByPlaylistId: (playlistId: string) => CustomIntent | undefined
  getCustomIntentByName: (name: string) => CustomIntent | undefined
}

const generateId = () => {
  return `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export const useCustomIntentsStore = create<CustomIntentsState & CustomIntentsActions>()(
  persist(
    (set, get) => ({
      customIntents: [],

      addCustomIntent: (intent) => {
        const state = get()
        const gradientIndex = state.customIntents.length % CUSTOM_INTENT_GRADIENTS.length
        const newIntent: CustomIntent = {
          ...intent,
          id: generateId(),
          gradientClassName: CUSTOM_INTENT_GRADIENTS[gradientIndex],
          isCustom: true,
        }

        set((state) => ({
          customIntents: [...state.customIntents, newIntent],
        }))

        return newIntent
      },

      removeCustomIntent: (id) => {
        set((state) => ({
          customIntents: state.customIntents.filter((i) => i.id !== id),
        }))
      },

      getCustomIntent: (id) => {
        return get().customIntents.find((i) => i.id === id)
      },

      getCustomIntentByPlaylistId: (playlistId) => {
        return get().customIntents.find((i) => i.playlistId === playlistId)
      },

      getCustomIntentByName: (name) => {
        return get().customIntents.find((i) => i.name === name)
      },
    }),
    {
      name: "custom-intents-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
)

