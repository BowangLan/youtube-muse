# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YouTube Muse is a Next.js 16 application that provides a beautiful, intuitive YouTube music player and playlist manager. The app integrates the YouTube IFrame API to play music videos without navigating away from the interface.

## Development Commands

```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Architecture

### State Management

The application uses **Zustand** for state management with two primary stores:

1. **Player Store** (`lib/store/player-store.ts`)
   - Manages YouTube player instance and playback state
   - Handles loading states with flags: `isLoadingNewVideo`, `wasPlayingBeforeLoad`, `pendingPlayState`
   - These flags prevent UI flickering during video transitions and buffering states
   - Controls: play/pause, seek, volume, skip forward/backward (10s intervals)

2. **Playlist Store** (`lib/store/playlist-store.ts`)
   - Persists to localStorage using Zustand's persist middleware
   - Manages playlists, tracks, and playback position
   - Handles track reordering and playlist management
   - Maintains `currentPlaylistId` and `currentTrackIndex` for playback coordination

### YouTube Integration

**Hook: `use-youtube-player.ts`**
- Dynamically loads YouTube IFrame API script
- Initializes hidden player instance (positioned off-screen via CSS)
- Handles state synchronization between YouTube player events and Zustand stores
- **Critical behavior**: Auto-plays next track on video end via `onStateChange` event handler
- Manages complex loading states to prevent UI flashing during buffering

**Hook: `use-playlist-player.ts`**
- Wrapper hook that combines YouTube player with playlist functionality
- Provides unified interface for playback controls and playlist navigation

### Key Types

- **Track** (`lib/types/playlist.ts`): YouTube video metadata including ID, title, author, duration, thumbnail
- **Playlist** (`lib/types/playlist.ts`): Collection of tracks with metadata and timestamps
- **YTPlayer** (`lib/types/youtube.ts`): TypeScript interface for YouTube IFrame API player methods

### Component Structure

- **app/page.tsx**: Main page with player UI, playlist sidebar, and hidden YouTube iframe container
- **components/player/**: Player controls, now playing display
- **components/playlist/**: Playlist sidebar, add track dialog
- **components/ui/**: shadcn/ui component library

### Utilities

- **lib/utils/youtube.ts**:
  - `extractVideoId()`: Parses YouTube URLs and video IDs
  - `formatTime()`: Converts seconds to MM:SS format
  - `getThumbnailUrl()`: Generates YouTube thumbnail URLs

- **lib/constants.ts**: Default playlist tracks for initialization

## Important Implementation Details

### Player State Synchronization

The player uses a sophisticated state management approach to handle YouTube's buffering states:

1. When loading a new video, `isLoadingNewVideo` is set to prevent state updates
2. `wasPlayingBeforeLoad` tracks whether to auto-resume after loading
3. `pendingPlayState` handles optimistic UI updates during play/pause transitions
4. State changes are ignored during loading to prevent flickering

### Hydration Safety

Components use `useHasMounted()` hook to prevent hydration mismatches when reading from localStorage-persisted state. This is critical for SSR compatibility.

### Path Aliases

The project uses `@/*` path alias mapping to the root directory (configured in `tsconfig.json`).

## Styling

- **Tailwind CSS 4** with custom dark theme
- Gradient backgrounds with layered radial/linear gradients for depth
- shadcn/ui components for consistent design system
- Responsive design with mobile-first approach
- Custom range sliders for playback progress and volume control

## SEO & Metadata

Comprehensive metadata configuration in `app/layout.tsx` including:
- OpenGraph tags for social sharing
- Twitter card configuration
- Structured data via `components/seo/structured-data.tsx`
- PWA manifest support
