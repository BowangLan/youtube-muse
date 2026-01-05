"use client";

import * as React from "react";
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
import { Loader2, Plus, SparkleIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { useCustomIntentsStore } from "@/lib/store/custom-intents-store";
import { searchYouTubeUnofficial } from "@/app/actions/youtube-search-unofficial";
import { buildCustomIntentQuery } from "@/lib/intents";
import { KeywordSelector, SUGGESTED_KEYWORDS } from "./keyword-selector";
import { getThumbnailUrl, parseDuration } from "@/lib/utils/youtube";
import { INTENT_DEFAULT_MAX_TRACKS } from "@/lib/constants";
import { Label } from "../ui/label";

interface CreateIntentDialogProps {
  trigger?: React.ReactNode;
  onCreated?: (playlistId: string) => void;
}

export function CreateIntentDialog({
  trigger,
  onCreated,
}: CreateIntentDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [keywords, setKeywords] = React.useState<string[]>(["music"]);
  const [description, setDescription] = React.useState("");
  const [minDuration, setMinDuration] = React.useState<number>(20);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = React.useState<string>("");
  const [nameOverwritten, setNameOverwritten] = React.useState(false);
  const skipAutoNameRef = React.useRef(false);

  const createPlaylist = usePlaylistStore((state) => state.createPlaylist);
  const addTrackToPlaylist = usePlaylistStore(
    (state) => state.addTrackToPlaylist
  );
  const setCurrentPlaylist = usePlaylistStore(
    (state) => state.setCurrentPlaylist
  );
  const addCustomIntent = useCustomIntentsStore(
    (state) => state.addCustomIntent
  );
  const getCustomIntentByName = useCustomIntentsStore(
    (state) => state.getCustomIntentByName
  );

  // Helper to generate name from keywords
  const generateNameFromKeywords = React.useCallback(
    (keywordList: string[]): string => {
      if (keywordList.length === 0) return "";

      // Randomly pick 2-3 keywords (or fewer if not enough)
      const count = Math.min(
        keywordList.length,
        keywordList.length === 1 ? 1 : Math.random() > 0.5 ? 3 : 2
      );

      // Shuffle and take first 'count' keywords
      const shuffled = [...keywordList].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, count);

      // Capitalize each keyword and join with space
      return selected
        .map((k) => k.charAt(0).toUpperCase() + k.slice(1).toLowerCase())
        .join(" ");
    },
    []
  );

  React.useEffect(() => {
    if (keywords.length > 0 && !nameOverwritten) {
      if (skipAutoNameRef.current) {
        skipAutoNameRef.current = false;
        return;
      }
      setName(generateNameFromKeywords(keywords));
    }
  }, [keywords, nameOverwritten, generateNameFromKeywords]);

  const handleRandomIntent = React.useCallback(() => {
    const pool = [...SUGGESTED_KEYWORDS];
    const count = Math.min(5, Math.max(2, Math.floor(Math.random() * 4) + 2));
    const shuffled = pool.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    skipAutoNameRef.current = true;
    setKeywords(selected);
    setName(generateNameFromKeywords(selected));
    setNameOverwritten(false);
    setError(null);
  }, [generateNameFromKeywords]);

  const resetForm = () => {
    setName("");
    setKeywords(["music"]);
    setDescription("");
    setMinDuration(20);
    setError(null);
    setLoadingStatus("");
    setNameOverwritten(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(resetForm, 100);
  };

  const handleCreate = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Please enter an intent name");
      return;
    }

    if (keywords.length === 0) {
      setError("Please add at least one keyword");
      return;
    }

    // Check if intent with this name already exists
    const existingIntent = getCustomIntentByName(trimmedName);
    if (existingIntent) {
      setError("An intent with this name already exists");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the keywords array directly (already validated)
      const keywordList = keywords.slice(0, 10) as
        | [string]
        | [string, string]
        | [string, string, string];

      setLoadingStatus("Creating playlist...");

      // Create the playlist first
      createPlaylist(trimmedName, description.trim() || undefined, []);

      // Get the newly created playlist ID
      const state = usePlaylistStore.getState();
      const newPlaylist = state.playlists.find((p) => p.name === trimmedName);

      if (!newPlaylist) {
        setError("Failed to create playlist");
        setIsLoading(false);
        return;
      }

      // Add the custom intent
      addCustomIntent({
        name: trimmedName,
        description: description.trim() || undefined,
        keywords: keywordList,
        playlistId: newPlaylist.id,
        minDuration,
      });

      setLoadingStatus("Searching for tracks...");

      // Search for tracks using the keywords
      const query = buildCustomIntentQuery(keywordList);
      if (
        typeof window !== "undefined" &&
        window.umami &&
        process.env.NODE_ENV === "production"
      ) {
        window.umami.track("youtube-api-search-videos", {
          context: "create-intent",
          intentName: trimmedName,
        });
      }
      const { results, error: searchError } = await searchYouTubeUnofficial(
        query,
        "video",
        "long" // Use long videos (>20 minutes) to match minDuration behavior
      );

      if (searchError) {
        console.warn("Search error:", searchError);
        // Don't fail completely, just note the warning
      }

      if (results.length > 0) {
        setLoadingStatus("Adding tracks...");

        const existingIds = new Set<string>();
        const toAdd = results
          .filter((r) => {
            // Check if this is a video result and has videoId
            // this shouldn't be needed via "video" argument to searchYouTubeUnofficial
            // but just in case & for type safety
            if (!r || !("videoId" in r) || !r.videoId) return false;
            if (existingIds.has(r.videoId)) return false;
            existingIds.add(r.videoId);
            return true;
          })
          .slice(0, INTENT_DEFAULT_MAX_TRACKS);

        for (const result of toAdd) {
          if (!("videoId" in result)) continue;

          const thumb = getThumbnailUrl(result.videoId, "hqdefault");

          addTrackToPlaylist(newPlaylist.id, {
            id: result.videoId,
            title: result.title,
            author: result.channelTitle,
            authorUrl: `https://www.youtube.com/channel/${result.channelId}`,
            authorThumbnail: undefined, // Unofficial API doesn't provide channel thumbnails
            duration: result.lengthText ? parseDuration(result.lengthText) : 0,
            thumbnailUrl: thumb,
            publishedAt: undefined, // Unofficial API doesn't provide publishedAt
            publishedTimeText: result.publishedTime,
          });
        }
      }

      // Set as current playlist
      setCurrentPlaylist(newPlaylist.id);

      // Notify parent if callback provided
      onCreated?.(newPlaylist.id);

      handleClose();
    } catch (err) {
      console.error("Error creating intent:", err);
      setError("Failed to create intent. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingStatus("");
    }
  };

  const defaultTrigger = (
    <button
      type="button"
      className={cn(
        "relative group w-full flex min-h-32 flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl",
        "border-2 border-dashed border-white/10 bg-white/[0.02]",
        "transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04]",
        "text-white/40 hover:text-white/60"
      )}
    >
      <Plus className="h-6 w-6" />
      <span className="text-xs font-medium tracking-wide">Create Intent</span>
    </button>
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
      <DialogContent className="w-[92vw] max-h-[85vh] overflow-hidden rounded-3xl border border-white/10 bg-[#070707] p-0 text-white motion-preset-slide-up-sm sm:max-w-xl">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(255,255,255,0.12),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.08),transparent_40%)]"
        />
        <div className="relative flex max-h-[85vh] flex-col gap-6 overflow-y-auto p-6 sm:p-8">
          <DialogHeader className="space-y-2 text-left motion-preset-blur-up-lg">
            <DialogTitle className="text-2xl font-semibold text-white">
              Build your intent.
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-400">
              Select or type keywords. The name is generated automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Intent Name</Label>
            <Input
              value={name}
              onChange={(e) => {
                const nextValue = e.target.value;
                setName(nextValue);
                setNameOverwritten(nextValue.trim().length > 0);
                setError(null);
              }}
              placeholder="Auto-generated"
              className="h-10 w-full rounded-none border-x-0 border-b border-t-0 border-white/20 bg-transparent px-3 text-sm text-white placeholder:text-white/30 focus-visible:ring-0"
              disabled={isLoading}
            />
          </div>

          <KeywordSelector
            keywords={keywords}
            onChange={setKeywords}
            maxKeywords={10}
            disabled={isLoading}
            onError={setError}
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          {loadingStatus && (
            <p className="flex items-center gap-2 text-sm text-zinc-400">
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
              {loadingStatus}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <div className="flex-1"></div>
            <Button
              type="button"
              variant="secondary"
              onClick={handleRandomIntent}
              disabled={isLoading}
            >
              <SparkleIcon />
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || keywords.length === 0 || isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Intent
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
