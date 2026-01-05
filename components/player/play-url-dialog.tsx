"use client";

import * as React from "react";
import type { Track } from "@/lib/types/playlist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, Link2 } from "lucide-react";
import { extractVideoIdFromUrl } from "@/lib/utils/youtube";
import { usePlaylistStore } from "@/lib/store/playlist-store";

const QUICK_PLAY_NAME = "Quick Play";
const QUICK_PLAY_DESCRIPTION = "One-off video plays";

type YouTubeVideoMetadata = {
  title: string;
  author_name: string;
  author_url: string;
  thumbnail_url: string;
};

async function fetchVideoMetadata(
  videoId: string
): Promise<Omit<Track, "addedAt"> | null> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch video metadata");
    }

    const data: YouTubeVideoMetadata = await response.json();

    return {
      id: videoId,
      title: data.title,
      author: data.author_name,
      authorUrl: data.author_url,
      duration: 0,
      thumbnailUrl: data.thumbnail_url,
    };
  } catch (error) {
    console.error("Error fetching video metadata:", error);
    return null;
  }
}

interface PlayUrlDialogProps {
  trigger?: React.ReactNode;
}

export function PlayUrlDialog({ trigger }: PlayUrlDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [videoUrl, setVideoUrl] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const playlists = usePlaylistStore((state) => state.playlists);
  const createPlaylist = usePlaylistStore((state) => state.createPlaylist);
  const setPlaylistTracks = usePlaylistStore(
    (state) => state.setPlaylistTracks
  );
  const setCurrentPlaylist = usePlaylistStore(
    (state) => state.setCurrentPlaylist
  );
  const setCurrentTrackIndex = usePlaylistStore(
    (state) => state.setCurrentTrackIndex
  );

  const normalizedInput = videoUrl.trim();
  const inputVideoId = normalizedInput
    ? extractVideoIdFromUrl(normalizedInput)
    : null;

  const resetForm = () => {
    setVideoUrl("");
    setError(null);
    setIsLoading(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(resetForm, 100);
  };

  const handlePlay = async () => {
    const trimmed = videoUrl.trim();
    if (!trimmed) {
      setError("Paste a YouTube video URL");
      return;
    }

    const videoId = extractVideoIdFromUrl(trimmed);
    if (!videoId) {
      setError("Enter a valid YouTube video URL");
      return;
    }

    setIsLoading(true);
    setError(null);

    const track = await fetchVideoMetadata(videoId);
    if (!track) {
      setError("Failed to load video details. Check the URL.");
      setIsLoading(false);
      return;
    }

    const now = Date.now();
    const quickTrack = { ...track, addedAt: now };
    const existingQuickPlay = playlists.find(
      (playlist) => playlist.name === QUICK_PLAY_NAME
    );

    if (existingQuickPlay) {
      setPlaylistTracks(existingQuickPlay.id, [quickTrack]);
      setCurrentPlaylist(existingQuickPlay.id);
      setCurrentTrackIndex(0);
    } else {
      createPlaylist(QUICK_PLAY_NAME, QUICK_PLAY_DESCRIPTION, [quickTrack]);
      const nextState = usePlaylistStore.getState();
      const createdPlaylist = nextState.playlists.find(
        (playlist) => playlist.name === QUICK_PLAY_NAME
      );
      if (createdPlaylist) {
        setCurrentPlaylist(createdPlaylist.id);
        setCurrentTrackIndex(0);
      } else {
        setError("Unable to start playback. Please try again.");
        setIsLoading(false);
        return;
      }
    }

    handleClose();
  };

  const defaultTrigger = (
    <Button className="h-10 rounded-2xl border border-white/10 bg-white/5 px-3 text-xs uppercase tracking-[0.2em] text-white/70 hover:bg-white/10 hover:text-white">
      <Link2 className="size-3.5" />
      Play URL
    </Button>
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        } else {
          setIsOpen(true);
        }
      }}
    >
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="w-[92vw] max-h-[85vh] overflow-hidden rounded-3xl border border-white/10 bg-[#070707] p-0 text-white motion-preset-slide-up-sm sm:max-w-md">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(255,255,255,0.12),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.08),transparent_40%)]"
        />
        <div className="relative flex flex-col gap-6 overflow-y-auto p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-white">
              Play a video.
            </DialogTitle>
            <DialogDescription>
              Paste a YouTube video URL to play it immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>YouTube URL</Label>
            <Input
              value={videoUrl}
              onChange={(e) => {
                setVideoUrl(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLoading && inputVideoId) {
                  handlePlay();
                }
              }}
              placeholder="https://www.youtube.com/watch?v=..."
              className="h-10 w-full rounded-none border-x-0 border-b border-t-0 border-white/20 bg-transparent px-3 text-sm text-white placeholder:text-white/30 focus-visible:ring-0"
              disabled={isLoading}
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
            <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handlePlay} disabled={!inputVideoId || isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Play Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
