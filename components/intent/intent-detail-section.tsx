"use client"

import * as React from "react"
import type { Playlist } from "@/lib/types/playlist"
import type { IntentDefinition } from "@/lib/intents"
import { cn } from "@/lib/utils"
import { TrackItemSmall } from "@/components/playlist/track-item-small"
import { ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export function IntentDetailSection({
  activePlaylist,
  activeIntent,
  currentActualTrackIndex,
  canAdd,
  isAdding,
  onBack,
  onAdd,
  onTrackClick,
}: {
  activePlaylist: Playlist | undefined
  activeIntent: IntentDefinition | undefined
  currentActualTrackIndex: number
  canAdd: boolean
  isAdding: boolean
  onBack: () => void
  onAdd: () => void
  onTrackClick: (index: number) => void
}) {
  const intentGradient = activeIntent?.gradientClassName
    ? activeIntent.gradientClassName
    : undefined

  return (
    <section
      aria-label="Intent"
      className="space-y-6 md:space-y-8 motion-preset-slide-up-sm"
    >
      <div
        className={cn(
          "relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/3 p-3",
          "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-linear-to-br before:opacity-90",
          intentGradient
        )}
      >
        <Button
          variant="ghost"
          onClick={onBack}
          className="rounded-full px-3 text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="ml-2 text-sm">Back</span>
        </Button>

        <Button
          onClick={onAdd}
          disabled={isAdding || !canAdd}
          className="rounded-full bg-white text-black hover:bg-white/90"
        >
          <Plus className="h-4 w-4" />
          <span className="ml-2 text-sm">{isAdding ? "Adding…" : "Add"}</span>
        </Button>
      </div>

      <div className="space-y-1">
        <div className="text-xs uppercase tracking-[0.3em] text-white/50">
          {activePlaylist?.name ?? "Intent"}
        </div>
        <div className="text-sm text-white/60">{activePlaylist?.tracks.length ?? 0} tracks</div>
      </div>

      <div className="space-y-1">
        {(activePlaylist?.tracks ?? []).map((track, index) => (
          <TrackItemSmall
            key={`${track.id}-${track.addedAt}`}
            track={track}
            isCurrentTrack={currentActualTrackIndex === index}
            onClick={() => onTrackClick(index)}
            // Deliberately unused: no editing/removal in this UX
            onRemove={() => {}}
            align="left"
          />
        ))}
      </div>
    </section>
  )
}


