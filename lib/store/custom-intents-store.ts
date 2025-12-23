import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { GRADIENT_CLASS_NAMES, type IntentDefinition, type GradientClassName } from "@/lib/intents"

// Available gradient classes for custom intents (gradients 7-22, excluding built-in 1-6)
const CUSTOM_INTENT_GRADIENTS = GRADIENT_CLASS_NAMES.slice(6)

export interface CustomIntent extends IntentDefinition {
  id: string
  isCustom: true
  playlistId: string // Links to the playlist with this intent
}

interface CustomIntentsState {
  customIntents: CustomIntent[]
  // Gradient overrides for any playlist (built-in or custom) - keyed by playlist ID
  gradientOverrides: Record<string, GradientClassName>
  // Set of built-in intent names that have been hidden/deleted by user
  hiddenBuiltInIntents: string[]
}

interface CustomIntentsActions {
  addCustomIntent: (intent: Omit<CustomIntent, "id" | "gradientClassName" | "isCustom">) => CustomIntent
  removeCustomIntent: (id: string) => void
  updateCustomIntent: (id: string, updates: Partial<Pick<CustomIntent, "name" | "gradientClassName" | "keywords">>) => void
  getCustomIntent: (id: string) => CustomIntent | undefined
  getCustomIntentByPlaylistId: (playlistId: string) => CustomIntent | undefined
  getCustomIntentByName: (name: string) => CustomIntent | undefined
  // Gradient override methods
  setGradientOverride: (playlistId: string, gradient: GradientClassName) => void
  getGradientOverride: (playlistId: string) => GradientClassName | undefined
  clearGradientOverride: (playlistId: string) => void
  // Hidden built-in intents methods
  hideBuiltInIntent: (intentName: string) => void
  unhideBuiltInIntent: (intentName: string) => void
  isBuiltInIntentHidden: (intentName: string) => boolean
}

const generateId = () => {
  return `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export const useCustomIntentsStore = create<CustomIntentsState & CustomIntentsActions>()(
  persist(
    (set, get) => ({
      customIntents: [],
      gradientOverrides: {},
      hiddenBuiltInIntents: [],

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

      updateCustomIntent: (id, updates) => {
        set((state) => ({
          customIntents: state.customIntents.map((i) =>
            i.id === id ? { ...i, ...updates } : i
          ),
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

      // Gradient override methods
      setGradientOverride: (playlistId, gradient) => {
        set((state) => ({
          gradientOverrides: {
            ...state.gradientOverrides,
            [playlistId]: gradient,
          },
        }))
      },

      getGradientOverride: (playlistId) => {
        return get().gradientOverrides[playlistId]
      },

      clearGradientOverride: (playlistId) => {
        set((state) => {
          const { [playlistId]: _, ...rest } = state.gradientOverrides
          return { gradientOverrides: rest }
        })
      },

      // Hidden built-in intents methods
      hideBuiltInIntent: (intentName) => {
        set((state) => ({
          hiddenBuiltInIntents: state.hiddenBuiltInIntents.includes(intentName)
            ? state.hiddenBuiltInIntents
            : [...state.hiddenBuiltInIntents, intentName],
        }))
      },

      unhideBuiltInIntent: (intentName) => {
        set((state) => ({
          hiddenBuiltInIntents: state.hiddenBuiltInIntents.filter((n) => n !== intentName),
        }))
      },

      isBuiltInIntentHidden: (intentName) => {
        return get().hiddenBuiltInIntents.includes(intentName)
      },
    }),
    {
      name: "custom-intents-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
)

