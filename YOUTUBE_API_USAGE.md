# YouTube API Usage Documentation

This document outlines how YouTube Muse uses both official and unofficial YouTube APIs across the frontend and backend.

## Overview

YouTube Muse integrates three different YouTube APIs:

1. **YouTube IFrame Player API** (Client-side, Official)
2. **YouTube Data API v3** (Server-side, Official, Requires API Key)
3. **YouTube oEmbed API** (Client-side, Unofficial but publicly available)

---

## 1. YouTube IFrame Player API (Client-side)

### Purpose
Embedded video playback for audio streaming without leaving the application.

### Location
- **Hook**: `hooks/use-youtube-player.ts`
- **Types**: `lib/types/youtube.ts`

### Implementation Details

#### API Loading
```typescript
// Dynamically loads the IFrame API script
const tag = document.createElement("script")
tag.src = "https://www.youtube.com/iframe_api"
```

**File**: `hooks/use-youtube-player.ts:92`

The hook sets up a global callback `window.onYouTubeIframeAPIReady` that fires when the API is ready.

#### Player Initialization
```typescript
const player = new window.YT.Player("youtube-player", {
  height: "1",
  width: "1",
  videoId: "dQw4w9WgXcQ",
  playerVars: {
    autoplay: 0,
    controls: 0,
    disablekb: 1,
  },
  events: {
    onReady: (event) => { /* ... */ },
    onStateChange: (event) => { /* ... */ }
  }
})
```

**File**: `hooks/use-youtube-player.ts:115-152`

The player is rendered as a 1x1 pixel element (hidden) since we only use it for audio playback.

#### Event Handlers

**onReady** (`hooks/use-youtube-player.ts:125-128`)
- Fires when the player is fully loaded
- Dispatches `PlayerReady` action to update store

**onStateChange** (`hooks/use-youtube-player.ts:129-150`)
- Fires when playback state changes (playing, paused, buffering, ended, etc.)
- Maps YouTube state codes to app states:
  - `-1` → `unstarted`
  - `0` → `ended`
  - `1` → `playing`
  - `2` → `paused`
  - `3` → `buffering`
  - `5` → `cued`
- Syncs track metadata (duration) when video is cued or playing

#### Player Methods Used

| Method | Description | Usage |
|--------|-------------|-------|
| `playVideo()` | Start playback | Play command |
| `pauseVideo()` | Pause playback | Pause command |
| `seekTo(seconds, allowSeekAhead)` | Seek to position | Scrubbing timeline |
| `setVolume(volume)` | Set volume (0-100) | Volume control |
| `getVolume()` | Get current volume | Volume state |
| `getCurrentTime()` | Get playback position | Progress tracking |
| `getDuration()` | Get video duration | Track duration |
| `loadVideoById(videoId)` | Load new video | Track switching |

#### Current Time Updates
```typescript
// Polls current time every 250ms while playing
const interval = setInterval(() => {
  if (playerRef.current) {
    const time = playerRef.current.getCurrentTime()
    dispatch({ type: "TimeTick", currentTime: time })
  }
}, 250)
```

**File**: `hooks/use-youtube-player.ts:163-168`

### Authentication
**None required** - The IFrame API is free and doesn't require an API key.

---

## 2. YouTube Data API v3 (Server-side)

### Purpose
Search for videos, channels, and fetch metadata from YouTube's official API.

### Authentication
**Required** - Uses `YOUTUBE_API_KEY` environment variable.

**Setup**: See `YOUTUBE_API_SETUP.md` for detailed setup instructions.

### Location
- **Actions**: `app/actions/youtube-search.ts` and `app/actions/youtube-channels.ts`
- **Library**: `googleapis` npm package

### Implementation

#### API Client Initialization
```typescript
import { google } from "googleapis"

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
})
```

**Files**:
- `app/actions/youtube-search.ts:3-8`
- `app/actions/youtube-channels.ts:3-8`

### API Endpoints Used

#### 1. `searchYouTubeVideos(query, type, options)`

**File**: `app/actions/youtube-search.ts:68-258`

**Purpose**: Search for videos, channels, playlists, or movies.

**API Calls**:
1. **`youtube.search.list()`** - Search for content
   - Line: `91`
   - Parameters: `q`, `type`, `maxResults`, `videoDuration`, `order`

2. **`youtube.videos.list()`** - Get video details (duration, etc.)
   - Line: `111`
   - Parameters: `part: ["contentDetails", "snippet"]`, `id: videoIds[]`

3. **`youtube.channels.list()`** - Get channel thumbnails
   - Line: `126`
   - Parameters: `part: ["snippet"]`, `id: channelIds[]`

**Options**:
- `minDurationMinutes`: Filter videos by minimum duration
- `order`: Sort order (`date`, `rating`, `relevance`, `title`, `viewCount`)
- `maxResults`: Number of results to return

**Returns**: Array of `SearchResult` objects with video metadata.

**Usage**:
- `components/playlist/add-track-dialog.tsx:106` - Search for tracks to add to playlists
- `components/intent/intent-detail-section.tsx:123` - Add tracks to intents
- `components/intent/intent-detail-section.tsx:158` - Refresh intent tracks
- `components/intent/create-intent-dialog.tsx:160` - Initial intent track search

---

#### 2. `searchYouTubeChannels(query)`

**File**: `app/actions/youtube-channels.ts:70-144`

**Purpose**: Search for YouTube channels by name.

**API Calls**:
1. **`youtube.search.list()`** - Search for channels
   - Line: `83`
   - Parameters: `q`, `type: ["channel"]`, `maxResults: 20`, `order: "relevance"`

2. **`youtube.channels.list()`** - Get channel details (subscriber count, etc.)
   - Line: `101`
   - Parameters: `part: ["snippet", "statistics"]`, `id: channelIds[]`

**Returns**: Array of `ChannelSearchResult` objects with channel metadata.

**Usage**:
- `components/stream/add-channel-popover.tsx:48` - Search channels in add channel popover
- `components/stream/create-stream-dialog.tsx:104` - Search channels when creating streams

---

#### 3. `getChannelById(channelIdOrHandle)`

**File**: `app/actions/youtube-channels.ts:149-214`

**Purpose**: Fetch a specific channel by ID or @handle.

**API Calls**:
1. **`youtube.channels.list()`** - Get channel by ID
   - Line: `171`
   - Parameters: `part: ["snippet", "statistics"]`, `id: [channelId]`

**Returns**: Single `ChannelSearchResult` object or null.

**Usage**:
- `components/stream/create-stream-dialog.tsx:187` - Fetch channel when user pastes URL/ID

---

#### 4. `getChannelLatestVideos(channelId, channelTitle, limit, channelThumbnail)`

**File**: `app/actions/youtube-channels.ts:220-377`

**Purpose**: Fetch the latest videos from a channel's uploads playlist.

**API Calls**:
1. **`youtube.channels.list()`** - Get channel's uploads playlist ID
   - Line: `233`
   - Parameters: `part: ["contentDetails"]`, `id: [channelId]`

2. **`youtube.playlistItems.list()`** - Get videos from uploads playlist
   - Line: `249`
   - Parameters: `playlistId: uploadsPlaylistId`, `maxResults`

3. **`youtube.videos.list()`** - Get video details (duration to filter shorts)
   - Line: `265`
   - Parameters: `part: ["contentDetails", "snippet"]`, `id: videoIds[]`

**Filtering**:
- Filters out YouTube Shorts (videos < 4 minutes)
- Returns only videos ≥ 240 seconds

**Returns**: Array of `ChannelVideoResult` objects.

**Usage**:
- `lib/store/streams-store.ts:155` - Refresh stream with latest channel videos

---

### Quota Usage

YouTube Data API v3 has a daily quota of **10,000 units** (free tier).

**Cost per operation**:
- `search.list`: 100 units
- `videos.list`: 1 unit
- `channels.list`: 1 unit
- `playlistItems.list`: 1 unit

**Example**: Creating a stream with 3 channels fetching 10 videos each:
- 3 channels × 1 unit (channel lookup) = 3 units
- 3 × 1 unit (playlist items) = 3 units
- 1 unit (video details) = 1 unit
- **Total**: ~7 units per stream refresh

**See**: `YOUTUBE_API_SETUP.md` for detailed quota information.

---

## 3. YouTube oEmbed API (Client-side)

### Purpose
Fetch basic video metadata (title, author, thumbnail) without requiring an API key.

### Location
- **Component**: `components/playlist/add-track-dialog.tsx:48-76`

### Implementation

```typescript
async function fetchVideoMetadata(videoId: string) {
  const response = await fetch(
    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
  )

  const data: YouTubeVideoMetadata = await response.json()

  return {
    id: videoId,
    title: data.title,
    author: data.author_name,
    authorUrl: data.author_url,
    duration: 0, // oEmbed doesn't provide duration
    thumbnailUrl: data.thumbnail_url,
  }
}
```

**File**: `components/playlist/add-track-dialog.tsx:48-76`

### oEmbed Response Format
```typescript
type YouTubeVideoMetadata = {
  title: string
  author_name: string
  author_url: string
  type: string
  thumbnail_url: string
  thumbnail_height: number
  thumbnail_width: number
  // ... other fields
}
```

### Limitations
- **No duration data** - Duration is set to `0` and synced later from the IFrame Player
- **Basic metadata only** - Doesn't include view count, publish date, etc.
- **Rate limiting** - Not officially documented but generally permissive

### Authentication
**None required** - This is a public endpoint that doesn't require an API key.

### Usage
- `components/playlist/add-track-dialog.tsx:158` - Fetch metadata when adding track by URL
- `components/playlist/add-track-dialog.tsx:203` - Fetch metadata for search result clicks

---

## Backend vs Frontend API Usage

### Server-Side (Next.js Server Actions)
- **YouTube Data API v3** (`searchYouTubeVideos`, `searchYouTubeChannels`, `getChannelById`, `getChannelLatestVideos`)
- Requires API key stored in environment variable
- Used for searching and fetching channel/video metadata
- Marked with `"use server"` directive

**Files**:
- `app/actions/youtube-search.ts`
- `app/actions/youtube-channels.ts`

### Client-Side (React Components/Hooks)
- **YouTube IFrame Player API** (embedded player)
- **YouTube oEmbed API** (basic video metadata)
- No API key required
- Used for playback and quick metadata fetches

**Files**:
- `hooks/use-youtube-player.ts`
- `components/playlist/add-track-dialog.tsx`

---

## Convex Usage

**Optional for streams** - Convex can sync latest channel videos for streams without replacing local stores.

**Flow**:
- `convex/youtube-unofficial.ts` scrapes the channel videos page to detect the latest IDs.
- `convex/channel-videos.ts` checks for changes; only then calls the official API to fetch full metadata.
- `convex/schema.ts` stores channels and videos for live subscription from the frontend.

**Env**:
- `YOUTUBE_API_KEY` for official Data API fetches in Convex actions
- `NEXT_PUBLIC_CONVEX_URL` for the frontend Convex client

**Stores remain**:
- `lib/store/streams-store.ts` - Stream configuration and local playlist updates
- `lib/store/playlist-store.ts` - Playlists and tracks

---

## Event Tracking

All YouTube API calls are tracked with Umami analytics for monitoring usage.

**Events tracked**:
- `youtube-api-search-videos` - Video searches
- `youtube-api-search-channels` - Channel searches
- `youtube-api-get-channel` - Fetch channel by ID
- `youtube-api-get-channel-videos` - Fetch channel videos

**Implementation**: Wrapped API calls check for `window.umami` availability before tracking.

**Example**:
```typescript
if (typeof window !== 'undefined' && window.umami) {
  window.umami.track('youtube-api-search-videos', {
    context: 'add-track-dialog',
    query: query.substring(0, 50)
  })
}
```

---

## API Key Security

### Environment Variables
```bash
YOUTUBE_API_KEY=your_api_key_here
```

### Security Best Practices
1. **Server-side only** - API key is only used in server actions, never exposed to client
2. **Git ignored** - `.env.local` is in `.gitignore`
3. **API restrictions** - Restrict key by HTTP referrer or IP in Google Cloud Console
4. **Quota monitoring** - Monitor usage in Google Cloud Console

---

## Future Considerations

### Potential Optimizations
1. **Caching** - Cache search results to reduce API calls
2. **Batch requests** - Combine multiple API calls where possible
3. **CDN for thumbnails** - Use YouTube's CDN URLs directly instead of fetching
4. **WebSocket for live streams** - Use YouTube Live API for real-time stream updates

### Alternative APIs
1. **Invidious API** - Privacy-focused YouTube API proxy (no key required)
2. **YouTube RSS Feeds** - For channel uploads (limited metadata)
3. **Piped API** - Another privacy-focused proxy

---

## Resources

- [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference)
- [YouTube Data API v3](https://developers.google.com/youtube/v3)
- [YouTube oEmbed](https://www.youtube.com/oembed)
- [API Quota Calculator](https://developers.google.com/youtube/v3/determine_quota_cost)
