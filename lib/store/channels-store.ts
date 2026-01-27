import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { Channel } from "@/lib/types/channel"

interface ChannelsState {
  channels: Channel[]
}

interface ChannelsActions {
  addChannel: (channel: Channel) => void
  removeChannel: (channelId: string) => void
  updateChannel: (channelId: string, updates: Partial<Channel>) => void
  getChannel: (channelId: string) => Channel | undefined
  getAllChannels: () => Channel[]
  getChannelsByIds: (channelIds: string[]) => Channel[]
  clearAllChannels: () => void
}

export const useChannelsStore = create<ChannelsState & ChannelsActions>()(
  persist(
    (set, get) => ({
      channels: [],

      addChannel: (channel) => {
        set((state) => {
          if (state.channels.some((c) => c.id === channel.id)) {
            return state
          }
          return {
            channels: [...state.channels, channel],
          }
        })
      },

      removeChannel: (channelId) => {
        set((state) => ({
          channels: state.channels.filter((c) => c.id !== channelId),
        }))
      },

      updateChannel: (channelId, updates) => {
        set((state) => ({
          channels: state.channels.map((c) =>
            c.id === channelId ? { ...c, ...updates } : c
          ),
        }))
      },

      getChannel: (channelId) => {
        return get().channels.find((c) => c.id === channelId)
      },

      getAllChannels: () => {
        return get().channels
      },

      getChannelsByIds: (channelIds) => {
        return get().channels.filter((c) => channelIds.includes(c.id))
      },

      clearAllChannels: () => {
        set({ channels: [] })
      },
    }),
    {
      name: "channels-storage",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
)
