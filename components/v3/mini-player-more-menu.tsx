"use client";

import * as React from "react";
import { ExternalLink, User } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Track } from "@/lib/types/playlist";
import { cn } from "@/lib/utils";

interface MiniPlayerMoreMenuProps {
  track: Track;
  children: React.ReactNode;
}

export function MiniPlayerMoreMenu({
  track,
  children,
}: MiniPlayerMoreMenuProps) {
  const [open, setOpen] = React.useState(false);

  const handleOpenTrack = () => {
    window.open(
      `https://www.youtube.com/watch?v=${track.id}`,
      "_blank",
      "noopener,noreferrer"
    );
    setOpen(false);
  };

  const handleOpenAuthor = () => {
    if (track.authorUrl) {
      window.open(track.authorUrl, "_blank", "noopener,noreferrer");
      setOpen(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen} modal>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="bottom"
        className="z-[150] bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-700/50 text-white p-0 rounded-t-3xl"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="flex flex-col w-full">
          {/* Drag Handle */}
          <div className="flex justify-center py-3">
            <div className="w-12 h-1 rounded-full bg-zinc-600/50" />
          </div>

          {/* Menu Items */}
          <div className="flex flex-col pb-6">
            <button
              onClick={handleOpenTrack}
              className="flex items-center gap-3 px-6 py-4 hover:bg-white/5 active:bg-white/10 transition-colors"
            >
              <ExternalLink className="h-5 w-5 text-neutral-400" />
              <span className="text-base">Open track in YouTube</span>
            </button>

            <div className="h-px bg-zinc-700/50 mx-6" />

            <button
              onClick={handleOpenAuthor}
              disabled={!track.authorUrl}
              className={cn(
                "flex items-center gap-3 px-6 py-4 hover:bg-white/5 active:bg-white/10 transition-colors",
                !track.authorUrl && "opacity-50 cursor-not-allowed"
              )}
            >
              <User className="h-5 w-5 text-neutral-400" />
              <span className="text-base">Open author in YouTube</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
