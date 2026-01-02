# Convex Stream Sync (Optional)

Use Convex to keep stream channels updated.

## Setup

```bash
npx convex dev
```

Set env vars:

```bash
NEXT_PUBLIC_CONVEX_URL=your_convex_url
YOUTUBE_API_KEY=your_api_key
```

## Client Usage

```typescript
const videos = useQuery(api.channelVideos.getLatestVideosByChannelIds, {
  channelIds: [channelId1, channelId2, ...],
  limit: 30, // Maximum 30 videos
})
```

This query returns the latest videos from all specified channels, sorted by publish time (newest first). No separate sync action is needed as it queries existing data directly.
