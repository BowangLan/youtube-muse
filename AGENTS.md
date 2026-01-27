# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js 16 app router entry, layout, SEO (robots/sitemap) and global styles.
- `components/`: Feature UI for player/playlist plus shared shadcn-inspired primitives in `components/ui/`.
- `hooks/`: Client hooks for YouTube IFrame orchestration, playlist playback, and responsive behaviors.
- `lib/`: Zustand stores (`lib/store/*`), shared types, constants, and YouTube helpers.
- `public/`: Static icons/manifest; `scripts/` holds one-off utilities (e.g., favicon generation).
- Path alias `@/*` resolves to repo root (see `tsconfig.json`).

## Build, Test, and Development Commands
- `npm run dev` (or `bun dev`): Start local dev server at http://localhost:3000.
- `npm run build`: Create production build; run before release changes.
- `npm start`: Serve the production build locally for verification.
- `npm run lint`: ESLint (Next.js config) across the project; fix issues before opening a PR.

## Coding Style & Naming Conventions
- TypeScript-first, client components where needed; prefer functional components and hooks.
- Tailwind CSS v4 utilities for styling; keep class strings ordered by layout → spacing → color for readability.
- Components and files: `PascalCase` for React components, `kebab-case` for folders, hooks prefixed with `use`. Zustand stores live in `*-store.ts`.
- Two-space indentation, trailing commas allowed; keep imports absolute via `@/` when possible.

## Testing Guidelines
- No automated test suite is wired yet; add focused unit/integration tests when touching stateful logic (stores, hooks) and document the command in your PR (e.g., `npm test`).
- For UI changes, provide manual validation steps or screenshots; ensure player controls and playlist flows still work.

## Commit & Pull Request Guidelines
- Follow the existing history: concise, imperative subjects (e.g., "Refactor player controls"), ~50 chars; include context on state/UX changes.
- PRs should summarize intent, list key changes, and call out UX/SEO impacts. Link issues when applicable and attach screenshots for UI updates.

## Channel Feature Overview
Channels are first-class entities that represent YouTube sources and power discovery, playback, and playlist curation. Users can browse channels, follow/unfollow them, and surface the latest uploads across the app.

### Data Models
- **Channel**: YouTube channel data (id, title, thumbnailUrl, customUrl, description, subscriberCount)
- **Track**: Individual video converted from YouTube API (id, title, author info, duration, thumbnails, timestamps)
- **ChannelCollection**: User-managed set of followed channels with ordering and metadata

### State Management & Persistence
- Zustand `useChannelsStore` for CRUD operations: follow/unfollow channels, update channel metadata, track refresh timestamps
- Persistent storage in localStorage
- Channel collections map to curated playlists via `playlistId` relationship

### UI Components
- **ChannelGridSection**: Displays the channel browse and follow view
- **ChannelDetailSection**: Main channel header, videos list, and follow actions
  - **ChannelDetailHeader**: Visual header with actions and channel stats
  - **ChannelInfo**: Content section showing channel metadata and links
- **ChannelDataLoader**: Background component that fetches/loads channel data when needed
- **CreateChannelCollectionDialog**: Modal for creating collections with channel selection
- **ChannelHeaderActions**: Quick actions (edit, delete, refresh)

### Data Fetching Flow
1. **ChannelDataLoader** mounts for each channel and monitors for changes
2. Triggers video fetching when channel selection changes or page switches to channel view
3. Calls `getChannelLatestVideos` server action for each channel in parallel
4. Merges, sorts by publish date (newest first), and limits to configured track limits
5. Converts YouTube videos to Track format
6. Updates associated playlists (removes old tracks, adds new ones)
7. Updates `lastRefreshedAt` timestamp

### Key Behaviors
- Auto-refresh happens when switching to channel view or via manual refresh button
- Videos distributed evenly across followed channels based on configured limits
- Channel deletion cascades to remove associated playlists
- Visual gradients assigned automatically to distinguish channel collections
- Channels can be added/removed dynamically after collection creation

This design supports a follow-based experience for YouTube channels without actual YouTube API subscriptions.

## Security & Configuration Tips
- Do not embed secrets; the YouTube IFrame API loads client-side without keys.
- When adding APIs or persistence, guard against XSS and validate URLs using helpers in `lib/utils/youtube.ts`.
