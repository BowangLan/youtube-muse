YouTube‑Muse Interaction Specification

This document specifies user‑visible interactions and states for YouTube‑Muse. It intentionally avoids system mechanics, APIs, or implementation details.

The goal is to define what the user does, sees, and feels at each moment.

⸻

1. App Launch

Entry State

When the app loads, the user lands directly on the Intent Grid.

User perception:
	•	The app feels immediately usable
	•	No setup, search, or onboarding friction
	•	Music is one tap away

System behavior is invisible.

⸻

2. Intent Grid (Closed State)

Visual State

Each intent box:
	•	Occupies a large, tappable area
	•	Displays a single intent label (e.g. “Deep Focus”)
	•	Uses subtle motion or texture to imply liveliness

The grid:
	•	Fits entirely on screen
	•	Does not scroll
	•	Feels stable and calm

⸻

Interaction: Tap Intent

Action: User taps an intent box

Result:
	•	The intent opens immediately
	•	Audio playback begins (or continues) seamlessly
	•	The grid transitions into the intent’s open state

There is no confirmation step.

⸻

Interaction: Long‑Press Intent (Optional)

Action: User long‑presses an intent box

Result:
	•	A lightweight tuning surface appears
	•	The user can adjust:
	•	Energy (calm ↔ intense)
	•	Vocals on/off
	•	Familiar ↔ exploratory bias
	•	Session length hint

Changes apply immediately and persist for this intent.

⸻

3. Intent Open State

Visual Layout

Opening an intent reveals:
	•	A vertically scrollable list of tracks/videos
	•	Clear visual grouping suggesting flow
	•	Minimal controls

The UI communicates continuity, not discovery.

⸻

Track List Behavior

Tracks:
	•	Appear in an order that implies progression
	•	Do not display unnecessary metadata
	•	Are visually lightweight

The list:
	•	Can be scrolled
	•	Does not feel infinite
	•	Suggests “what belongs here right now”

⸻

4. Playback Interaction

Passive Playback

By default:
	•	Playback continues uninterrupted
	•	Tracks transition smoothly
	•	No explicit queue management is required

The user is not expected to curate.

⸻

Interaction: Select Track

Action: User taps a track

Result:
	•	Playback jumps to that track
	•	The rest of the list remains intact

Selecting a track does not break the intent session.

⸻

5. Add Interaction

Primary Add Action

Each open intent includes a single Add button.

Action: User taps “Add”

Result:
	•	A new track appears appended to the list
	•	The addition feels immediate
	•	No search UI is shown

User perception:

“Give me more of this.”

⸻

Add Feedback

After adding:
	•	The new track is briefly highlighted
	•	The list subtly expands
	•	Playback behavior remains uninterrupted

No confirmation dialog is shown.

⸻

6. Deduplication (Perceived)

User‑visible guarantees:
	•	The same track never appears twice in one intent
	•	Recently encountered tracks are avoided
	•	Repeated use of Add continues to feel novel

No duplicate warnings or errors are surfaced.

⸻

7. Closing an Intent

Interaction: Back / Swipe Down

Action: User exits the open intent

Result:
	•	The app returns to the intent grid
	•	Playback may continue in background
	•	The intent box reflects recent activity

The user feels they left something running, not closed it.

⸻

8. Re‑Entering an Intent

Resume Behavior

When an intent is re‑opened:
	•	The playlist feels continuous
	•	Recent context is preserved
	•	Energy and tone match prior usage

The session resumes rather than restarts.

⸻

9. Empty / First‑Use State

First Time Opening an Intent

If an intent has no visible tracks yet:
	•	The open state is not empty
	•	Initial content appears immediately
	•	The experience feels intentional, not generated

There is no explicit “loading” narrative.

⸻

10. Error & Loading States (Perceptual)

Errors and loading should be:
	•	Rare
	•	Soft
	•	Non‑blocking

If delays occur:
	•	Motion and placeholders maintain continuity
	•	The app never feels broken or technical

⸻

11. Non‑Interactions (Deliberate Absences)

The following actions are intentionally unsupported:
	•	Manual search
	•	Drag‑and‑drop reordering
	•	Playlist editing
	•	Explicit recommendations feed

Absence is a feature.

⸻

Interaction Summary

The user loop:
	1.	Choose intent
	2.	Enter state
	3.	Let it run
	4.	Add occasionally
	5.	Leave and return

At no point should the user feel like they are managing music.

They are managing attention.