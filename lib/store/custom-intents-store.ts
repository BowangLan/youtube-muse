import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { GRADIENT_CLASS_NAMES, type IntentDefinition, type GradientClassName } from "@/lib/intents"

// Available gradient classes for custom intents (gradients 7-22, excluding built-in 1-6)
const CUSTOM_INTENT_GRADIENTS = GRADIENT_CLASS_NAMES.slice(6)

export interface CustomIntent extends IntentDefinition {
  id: string
  isCustom: true
  playlistId: string // Links to the playlist with this intent
  minDuration?: number // Minimum video duration in minutes (default: 20)
}

// Keyword override type for built-in intents
export type KeywordsOverride = [string] | [string, string] | [string, string, string]

interface CustomIntentsState {
  customIntents: CustomIntent[]
  // Gradient overrides for any playlist (built-in or custom) - keyed by playlist ID
  gradientOverrides: Record<string, GradientClassName>
  // Keyword overrides for built-in intents - keyed by playlist ID
  keywordOverrides: Record<string, KeywordsOverride>
  // Description overrides for built-in intents - keyed by playlist ID
  descriptionOverrides: Record<string, string>
  // Minimum duration overrides for built-in intents - keyed by playlist ID
  minDurationOverrides: Record<string, number>
  // Set of built-in intent names that have been hidden/deleted by user
  hiddenBuiltInIntents: string[]
}

interface CustomIntentsActions {
  addCustomIntent: (intent: Omit<CustomIntent, "id" | "gradientClassName" | "isCustom">) => CustomIntent
  removeCustomIntent: (id: string) => void
  updateCustomIntent: (id: string, updates: Partial<Pick<CustomIntent, "name" | "gradientClassName" | "keywords" | "description" | "minDuration">>) => void
  getCustomIntent: (id: string) => CustomIntent | undefined
  getCustomIntentByPlaylistId: (playlistId: string) => CustomIntent | undefined
  getCustomIntentByName: (name: string) => CustomIntent | undefined
  // Gradient override methods
  setGradientOverride: (playlistId: string, gradient: GradientClassName) => void
  getGradientOverride: (playlistId: string) => GradientClassName | undefined
  clearGradientOverride: (playlistId: string) => void
  // Keyword override methods (for built-in intents)
  setKeywordOverride: (playlistId: string, keywords: KeywordsOverride) => void
  getKeywordOverride: (playlistId: string) => KeywordsOverride | undefined
  clearKeywordOverride: (playlistId: string) => void
  // Description override methods (for built-in intents)
  setDescriptionOverride: (playlistId: string, description: string) => void
  getDescriptionOverride: (playlistId: string) => string | undefined
  clearDescriptionOverride: (playlistId: string) => void
  // Minimum duration override methods (for built-in intents)
  setMinDurationOverride: (playlistId: string, minDuration: number) => void
  getMinDurationOverride: (playlistId: string) => number | undefined
  clearMinDurationOverride: (playlistId: string) => void
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
      keywordOverrides: {},
      descriptionOverrides: {},
      minDurationOverrides: {},
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

      // Keyword override methods (for built-in intents)
      setKeywordOverride: (playlistId, keywords) => {
        set((state) => ({
          keywordOverrides: {
            ...state.keywordOverrides,
            [playlistId]: keywords,
          },
        }))
      },

      getKeywordOverride: (playlistId) => {
        return get().keywordOverrides[playlistId]
      },

      clearKeywordOverride: (playlistId) => {
        set((state) => {
          const { [playlistId]: _, ...rest } = state.keywordOverrides
          return { keywordOverrides: rest }
        })
      },

      // Description override methods (for built-in intents)
      setDescriptionOverride: (playlistId, description) => {
        set((state) => ({
          descriptionOverrides: {
            ...state.descriptionOverrides,
            [playlistId]: description,
          },
        }))
      },

      getDescriptionOverride: (playlistId) => {
        return get().descriptionOverrides[playlistId]
      },

      clearDescriptionOverride: (playlistId) => {
        set((state) => {
          const { [playlistId]: _, ...rest } = state.descriptionOverrides
          return { descriptionOverrides: rest }
        })
      },

      // Minimum duration override methods (for built-in intents)
      setMinDurationOverride: (playlistId, minDuration) => {
        set((state) => ({
          minDurationOverrides: {
            ...state.minDurationOverrides,
            [playlistId]: minDuration,
          },
        }))
      },

      getMinDurationOverride: (playlistId) => {
        return get().minDurationOverrides[playlistId]
      },

      clearMinDurationOverride: (playlistId) => {
        set((state) => {
          const { [playlistId]: _, ...rest } = state.minDurationOverrides
          return { minDurationOverrides: rest }
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

