# YouTube‑Muse UX Design Document

## Product Thesis

YouTube‑Muse is a **mood‑first music player**.

Users do not choose songs, artists, or playlists. They choose an **intent**—a mental or emotional state they want to enter. Each intent behaves like a living playlist that evolves over time.

The system handles discovery, continuity, and variation. The user only declares intent.

---

## Core Mental Model

**Intent → Living Playlist → Ongoing Session**

An intent box is not a shortcut. It is a *container* that:

* Accumulates relevant tracks
* Remembers recent context
* Evolves with use

From the user’s perspective:

> “This mode knows what belongs here.”

How that knowledge is produced is intentionally invisible.

---

## Home Screen: Intent Grid

The primary screen is a grid of large intent boxes.

Examples:

* Deep Focus
* Momentum
* Sprint
* Float
* Background
* Grind

Constraints:

* 2×2 or 3×3 grid maximum
* One word per box
* No genres, artists, or playlists visible

Each box represents a *behavioral promise*, not a music category.

---

## Intent Box States

### Closed State

In the grid view, each intent box:

* Appears calm and legible
* May show subtle motion reflecting recent audio texture
* Feels persistent (not ephemeral)

A box can suggest readiness without demanding attention.

---

### Open State (Intent Expanded)

Opening an intent reveals its internal playlist.

The open state displays:

* A scrollable list of videos/tracks associated with this intent
* Clear ordering that suggests flow, not ranking
* Lightweight controls only

This view communicates:

> “This is what belongs to this mode right now.”

---

## Intent as Playlist

Each intent maintains its own evolving list of videos.

UX guarantees:

* Content is relevant to the intent
* Previously added tracks do not repeat
* The list grows organically over time
* Recently heard content is deprioritized

The user never explicitly searches. Discovery is implicit.

---

## Add Interaction (One‑Click Growth)

In the open state, each intent provides a **single, fast add action**.

Behavior:

* Tapping “Add” instantly appends a new track to the intent
* The added track aligns with the intent’s character
* No intermediate search UI is shown

From the user’s perspective:

> “Give me more of *this*.”

The system decides what “this” means.

---

## Deduplication (As a Promise)

Deduplication is a UX guarantee, not a visible feature.

Rules:

* The same track never appears twice in one intent
* Recently encountered content is avoided
* Re‑adding feels additive, not repetitive

Users should never think about duplicates.

---

## Session Continuity

Re‑entering an intent resumes context:

* The playlist feels continuous, not reset
* Energy and tone align with prior usage
* The list reflects recent history

The experience should feel remembered, not replayed.

---

## Navigation Philosophy

There are no traditional tabs:

* No search screen
* No library
* No genre browser

Depth is accessed only by interacting with intent boxes.

The grid *is* the navigation.

---

## Visual & Interaction Principles

* Large touch targets
* Minimal chrome
* Soft motion
* Calm typography
* No visible metadata unless necessary

If a user starts thinking about YouTube, the UX has failed.

---

## Explicit Non‑Goals

YouTube‑Muse is not:

* A YouTube client
* A playlist manager
* A productivity tracker
* A recommendation feed

Music discovery exists only in service of intent.

---

## Design Constraints (Non‑Narrative)

The following are system guarantees that support the UX, but should remain invisible:

* Automatic content sourcing per intent
* Intent‑specific relevance logic
* Deduplication across sessions
* Lazy growth of playlists

These constraints must never surface as explicit controls.

---

## Summary

YouTube‑Muse treats sound as an environment.

Users do not browse.
They choose a state.

Each intent box is a living playlist that grows quietly in the background—ready whenever the user returns.
