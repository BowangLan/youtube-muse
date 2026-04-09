import { useChannelsStore } from "@/lib/store/channels-store";

export function useChannel(channelId: string | null) {
  if (!channelId) {
    return null;
  }

  const channel = useChannelsStore((state) => state.getChannel(channelId));

  if (!channel) {
    return null;
  }

  return channel;
}