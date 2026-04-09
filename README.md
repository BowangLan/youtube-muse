## YouTube Muse Monorepo

This repo now uses Bun workspaces and Turborepo.

- `apps/web`: the existing Next.js app
- `apps/desktop`: an Electron shell for the desktop app

## Setup

```bash
bun install
```

## Development

Run the full workspace:

```bash
bun dev
```

That starts the Next.js app on `http://localhost:3000` and launches Electron after the web server is ready.

Useful targeted commands:

```bash
bun run dev:web
bun run start:desktop
bun run build
bun run lint
bun run package:desktop
```

## Web Scripts

```bash
bun --filter @youtube-muse/web test:youtube-unofficial
bun --filter @youtube-muse/web test:youtube-official
```
