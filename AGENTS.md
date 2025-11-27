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

## Security & Configuration Tips
- Do not embed secrets; the YouTube IFrame API loads client-side without keys.
- When adding APIs or persistence, guard against XSS and validate URLs using helpers in `lib/utils/youtube.ts`.
