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

export type IntentMetadata = {
  playlistId: string
  name: string
  description?: string
  keywords: string[]
  gradientClassName: GradientClassName
  minDuration?: number
  isCustom: boolean
}

// Keyword override type for built-in intents
export type KeywordsOverride = [string] | [string, string] | [string, string, string]

interface CustomIntentsState {
  customIntents: CustomIntent[]
  intentMetadataByPlaylistId: Record<string, IntentMetadata>
  intentPlaylistOrder: string[]
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
  setIntentMetadata: (playlistId: string, metadata: IntentMetadata) => void
  updateIntentMetadata: (playlistId: string, updates: Partial<IntentMetadata>) => void
  removeIntentMetadata: (playlistId: string) => void
  getIntentMetadataByPlaylistId: (playlistId: string) => IntentMetadata | undefined
  getIntentMetadataByName: (name: string) => IntentMetadata | undefined
  setIntentPlaylistOrder: (order: string[]) => void
  addIntentToOrder: (playlistId: string) => void
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
      intentMetadataByPlaylistId: {},
      intentPlaylistOrder: [],
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
          intentMetadataByPlaylistId: {
            ...state.intentMetadataByPlaylistId,
            [newIntent.playlistId]: {
              playlistId: newIntent.playlistId,
              name: newIntent.name,
              description: newIntent.description,
              keywords: [...newIntent.keywords],
              gradientClassName: newIntent.gradientClassName,
              minDuration: newIntent.minDuration,
              isCustom: true,
            },
          },
          intentPlaylistOrder: state.intentPlaylistOrder.includes(newIntent.playlistId)
            ? state.intentPlaylistOrder
            : [...state.intentPlaylistOrder, newIntent.playlistId],
        }))

        return newIntent
      },

      removeCustomIntent: (id) => {
        const intent = get().customIntents.find((i) => i.id === id)
        set((state) => ({
          customIntents: state.customIntents.filter((i) => i.id !== id),
          intentMetadataByPlaylistId: intent
            ? Object.fromEntries(
                Object.entries(state.intentMetadataByPlaylistId).filter(
                  ([playlistId]) => playlistId !== intent.playlistId
                )
              )
            : state.intentMetadataByPlaylistId,
          intentPlaylistOrder: intent
            ? state.intentPlaylistOrder.filter((playlistId) => playlistId !== intent.playlistId)
            : state.intentPlaylistOrder,
        }))
      },

      updateCustomIntent: (id, updates) => {
        const current = get().customIntents.find((i) => i.id === id)
        set((state) => ({
          customIntents: state.customIntents.map((i) =>
            i.id === id ? { ...i, ...updates } : i
          ),
          intentMetadataByPlaylistId: current
            ? {
                ...state.intentMetadataByPlaylistId,
                [current.playlistId]: {
                  ...state.intentMetadataByPlaylistId[current.playlistId],
                  ...updates,
                  playlistId: current.playlistId,
                  name: updates.name ?? current.name,
                  keywords: updates.keywords ? [...updates.keywords] : state.intentMetadataByPlaylistId[current.playlistId]?.keywords ?? current.keywords,
                  gradientClassName:
                    updates.gradientClassName ??
                    state.intentMetadataByPlaylistId[current.playlistId]?.gradientClassName ??
                    current.gradientClassName,
                  minDuration:
                    updates.minDuration ??
                    state.intentMetadataByPlaylistId[current.playlistId]?.minDuration ??
                    current.minDuration,
                  isCustom: true,
                },
              }
            : state.intentMetadataByPlaylistId,
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

      setIntentMetadata: (playlistId, metadata) => {
        set((state) => ({
          intentMetadataByPlaylistId: {
            ...state.intentMetadataByPlaylistId,
            [playlistId]: metadata,
          },
          intentPlaylistOrder: state.intentPlaylistOrder.includes(playlistId)
            ? state.intentPlaylistOrder
            : [...state.intentPlaylistOrder, playlistId],
        }))
      },

      updateIntentMetadata: (playlistId, updates) => {
        set((state) => {
          const current = state.intentMetadataByPlaylistId[playlistId]
          if (!current) return { intentMetadataByPlaylistId: state.intentMetadataByPlaylistId }

          const next = {
            ...current,
            ...updates,
            playlistId: current.playlistId,
          }

          return {
            intentMetadataByPlaylistId: {
              ...state.intentMetadataByPlaylistId,
              [playlistId]: next,
            },
            customIntents: current.isCustom
              ? state.customIntents.map((intent) =>
                  intent.playlistId === playlistId
                    ? {
                        ...intent,
                        name: next.name,
                        description: next.description,
                        keywords: next.keywords as KeywordsOverride,
                        gradientClassName: next.gradientClassName,
                        minDuration: next.minDuration,
                      }
                    : intent
                )
              : state.customIntents,
          }
        })
      },

      removeIntentMetadata: (playlistId) => {
        set((state) => {
          const { [playlistId]: _, ...rest } = state.intentMetadataByPlaylistId
          return {
            intentMetadataByPlaylistId: rest,
            intentPlaylistOrder: state.intentPlaylistOrder.filter((id) => id !== playlistId),
          }
        })
      },

      getIntentMetadataByPlaylistId: (playlistId) => {
        return get().intentMetadataByPlaylistId[playlistId]
      },

      getIntentMetadataByName: (name) => {
        return Object.values(get().intentMetadataByPlaylistId).find((intent) => intent.name === name)
      },

      setIntentPlaylistOrder: (order) => {
        set(() => ({
          intentPlaylistOrder: order,
        }))
      },

      addIntentToOrder: (playlistId) => {
        set((state) => ({
          intentPlaylistOrder: state.intentPlaylistOrder.includes(playlistId)
            ? state.intentPlaylistOrder
            : [...state.intentPlaylistOrder, playlistId],
        }))
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
      version: 2,
      migrate: (persistedState, version) => {
        const state = persistedState as CustomIntentsState | undefined
        if (!state || version >= 2) return state as CustomIntentsState

        const intentMetadataByPlaylistId: Record<string, IntentMetadata> = {}

        for (const intent of state.customIntents ?? []) {
          intentMetadataByPlaylistId[intent.playlistId] = {
            playlistId: intent.playlistId,
            name: intent.name,
            description: intent.description,
            keywords: [...intent.keywords],
            gradientClassName: intent.gradientClassName,
            minDuration: intent.minDuration,
            isCustom: true,
          }
        }

        return {
          ...state,
          intentMetadataByPlaylistId,
          intentPlaylistOrder: (state.customIntents ?? []).map((intent) => intent.playlistId),
        }
      },
    }
  )
)
