# Playback Session

The session owns selection, autoplay eligibility, source readiness, command execution,
progress polling, source/track/lifetime filtering, end deduplication, and queue advancement.
The existing player reducer remains its internal state model.

## Seams

- UI controls use the unchanged Zustand state view and user-intent dispatch in
  `lib/store/player-store.ts`. Source observations cannot enter through that dispatch.
- `usePlaybackSession` mounts the listening page, captures user interaction, and
  coalesces playlist notifications before selecting the final track.
- YouTube and Spotify hooks create their SDK resources and attach a scoped
  connection. Readiness and observations from a disconnected lifetime are ignored.
- Adapters translate transport operations and observations. Spotify's lack of a cue
  operation stays inside its adapter; the session owns its rewind-based end policy.
- Async loads receive an abort signal. Completions, errors, and progress reads are
  also checked against the current selection because cancellation alone cannot
  undo a request already processed by a remote source.
- Late playback from an inactive source is silenced. If the active source reverts
  to an old track after observing the selected track, the session reloads the
  selection with the current play/pause intent; outgoing loading snapshots do not
  trigger repeated recovery loads.

The playlist store still owns ordering, shuffle, and persistence. Visual video modes
and quality remain YouTube-specific. Slice repeat retains its existing shared behavior.
The app's existing YouTube-script startup screen is unchanged.

## Verification

From the repository root:

```sh
bun run test
bun run --cwd apps/web typecheck
bun run lint
bun run build:web
```

Tests exercise the session interface with mock sources and the real Spotify adapter
with a mock SDK, without account credentials or network requests.

Manual checks with playable YouTube videos and a connected Spotify Premium account:

1. Reload: the selected track is cued, not autoplayed before interaction.
2. Choose a non-first playlist row: only the chosen track loads.
3. Play/pause, seek, change volume, use next/previous and OS media controls.
4. Switch YouTube → Spotify → YouTube rapidly: only the selected source plays.
5. Finish a Spotify track: advance once without restarting the outgoing track.
6. Exercise repeat-one, one-track playlist repeat, and slice loop/pause on both sources.
7. Disconnect/reconnect Spotify or navigate between listening pages: no duplicate
   playback; the current intent is honored when the selected source becomes ready.
8. Toggle hidden/floating/fullscreen video modes; selecting Spotify hides video.

Live playback depends on the providers' account, anti-bot, and autoplay restrictions;
mock tests do not verify those restrictions.
