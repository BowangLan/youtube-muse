# Catalog Search Session

The session owns submission, source/filter transitions, token lookup, result
normalization, pagination, error state, and playable-result projection. The UI
reads its state and issues intent; it cannot commit arbitrary request results.

## Interface and seams

- `search`, `setSpotifyType`, and `loadMore` use the same request lifecycle.
- `setQuery`, `setSource`, `setYouTubeDuration`, and `clearSearch` invalidate
  outstanding work. Request identity, not matching query text alone, determines
  whether a completion can update the session. Spotify receives an abort signal;
  YouTube server-action responses are ignored when obsolete.
- Source and YouTube duration changes clear results without submitting. Spotify
  filter/section changes submit immediately when a query exists, as before.
- Query text remains editable without automatically searching. Editing it
  invalidates pending work and prevents paging a new draft into old results;
  submit to establish the next result set.
- Pagination is single-flight. Failures retain existing results and allow retry
  at the same offset. Pages deduplicate by source, result type, and identity.
- Only videos and tracks enter the search playlist. The currently playing search
  track survives result replacement, filtering, clearing, and errors. Result
  clicks resolve identity rather than assuming result and queue indices match.

The existing Spotify HTTP module retains provider normalization. The session
accepts provider functions, token acquisition, and a queue adapter as dependencies.
`search-store.ts` connects those seams to the real providers and playlist store;
tests use delayed providers and an in-memory queue. Playlist ordering, shuffle,
persistence, and playback intent remain outside this module.

## Verification

From the repository root:

```sh
bun run test
bun run --cwd apps/web typecheck
bun run lint
bun run build:web
```

Manual checks:

1. Submit YouTube searches and change duration filters; verify only videos appear.
2. Switch sources or filters during a slow search; the old completion must not
   replace results or errors in the newer search.
3. With Spotify connected, search All, expand a section, and load further pages.
   Switch query/filter while paging and retry any page error.
4. Play a result, replace the results, then click another result. Playback should
   remain on the original track until that click and then select the clicked one.
   Repeat with shuffle enabled.

Mock tests do not verify provider authentication, rate limits, or actual audio playback.
