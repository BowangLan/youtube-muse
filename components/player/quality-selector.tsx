"use client";

import * as React from "react";
import { Settings, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useYouTubePlayerInstanceStore } from "@/lib/store/youtube-player-instance-store";
import { cn } from "@/lib/utils";

const QUALITY_LABELS: Record<string, string> = {
  hd2160: "2160p (4K)",
  hd1440: "1440p",
  hd1080: "1080p",
  hd720: "720p",
  large: "480p",
  medium: "360p",
  small: "240p",
  tiny: "144p",
  auto: "Auto",
};

const QUALITY_ORDER = [
  "hd2160",
  "hd1440",
  "hd1080",
  "hd720",
  "large",
  "medium",
  "small",
  "tiny",
];

export function QualitySelector() {
  const player = useYouTubePlayerInstanceStore((state) => state.player);
  const preferredQuality = useYouTubePlayerInstanceStore(
    (state) => state.preferredQuality
  );
  const availableQualities = useYouTubePlayerInstanceStore(
    (state) => state.availableQualities
  );
  const setPreferredQuality = useYouTubePlayerInstanceStore(
    (state) => state.setPreferredQuality
  );
  const setCurrentQuality = useYouTubePlayerInstanceStore(
    (state) => state.setCurrentQuality
  );

  const [requestedQuality, setRequestedQuality] =
    React.useState<string>(preferredQuality);
  const [actualQuality, setActualQuality] =
    React.useState<string>(preferredQuality);
  const isChangingRef = React.useRef(false);

  // Update actual quality from player, but pause polling when user is making changes
  React.useEffect(() => {
    if (!player) return;

    const interval = setInterval(() => {
      // Don't poll while quality change is in progress
      if (isChangingRef.current) return;

      try {
        const quality = player.getPlaybackQuality();
        if (quality) {
          setActualQuality(quality);
          // Also sync requested quality if we're not actively changing
          setRequestedQuality(quality);
        }
      } catch (error) {
        // Ignore errors
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [player]);

  const handleQualityChange = (quality: string) => {
    if (!player) return;

    try {
      // Set flag to prevent polling from overwriting our selection
      isChangingRef.current = true;

      // Update UI immediately for instant feedback
      setRequestedQuality(quality);

      // Set the quality (this is async in YouTube's API)
      player.setPlaybackQuality(quality);

      // Update preferred quality in store (so it persists when re-entering fullscreen)
      setPreferredQuality(quality);
      setCurrentQuality(quality);

      // Allow polling to resume after YouTube has had time to apply the change
      setTimeout(() => {
        isChangingRef.current = false;
      }, 2000);
    } catch (error) {
      console.error("Failed to change quality:", error);
      isChangingRef.current = false;
    }
  };

  // Filter and sort available qualities
  const sortedAvailableQualities = React.useMemo(() => {
    if (!availableQualities || availableQualities.length === 0) {
      return QUALITY_ORDER;
    }

    return QUALITY_ORDER.filter((quality) =>
      availableQualities.includes(quality)
    );
  }, [availableQualities]);

  // Use requested quality for UI display (shows immediate feedback)
  const displayQuality = requestedQuality;

  return (
    <DropdownMenu modal={true}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-white/80 hover:text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <Settings className="h-4 w-4" />
          <span className="sr-only">Quality settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-40 z-[99]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          Quality
        </div>
        {sortedAvailableQualities.map((quality) => (
          <DropdownMenuItem
            key={quality}
            onClick={(e) => {
              e.stopPropagation();
              handleQualityChange(quality);
            }}
            className={cn(
              "cursor-pointer flex items-center justify-between",
              displayQuality === quality && "bg-accent"
            )}
          >
            <span>{QUALITY_LABELS[quality] || quality}</span>
            {displayQuality === quality && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
