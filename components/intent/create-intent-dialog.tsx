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
import { Loader2, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { useCustomIntentsStore } from "@/lib/store/custom-intents-store";
import { searchYouTubeVideos } from "@/app/actions/youtube-search";
import { buildCustomIntentQuery } from "@/lib/intents";
import { KeywordSelector } from "./keyword-selector";
import { getThumbnailUrl, parseDuration } from "@/lib/utils/youtube";

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
  const [keywords, setKeywords] = React.useState<string[]>([]);
  const [description, setDescription] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = React.useState<string>("");
  const [nameOverwritten, setNameOverwritten] = React.useState(false);

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

  // Auto-generate name when keywords change and name hasn't been manually edited
  React.useEffect(() => {
    if (keywords.length > 0 && (!nameOverwritten || !name.trim())) {
      setName(generateNameFromKeywords(keywords));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only regenerate on keyword changes, not name changes
  }, [keywords, nameOverwritten, generateNameFromKeywords]);

  const resetForm = () => {
    setName("");
    setKeywords([]);
    setDescription("");
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
      });

      setLoadingStatus("Searching for tracks...");

      // Search for tracks using the keywords
      const query = buildCustomIntentQuery(keywordList);
      const { results, error: searchError } = await searchYouTubeVideos(query);

      if (searchError) {
        console.warn("Search error:", searchError);
        // Don't fail completely, just note the warning
      }

      if (results.length > 0) {
        setLoadingStatus("Adding tracks...");

        const existingIds = new Set<string>();
        const toAdd = results.filter((r) => {
          if (!r?.id) return false;
          if (existingIds.has(r.id)) return false;
          existingIds.add(r.id);
          return true;
        });

        for (const result of toAdd) {
          const thumb = getThumbnailUrl(result.id, "hqdefault");

          addTrackToPlaylist(newPlaylist.id, {
            id: result.id,
            title: result.title,
            author: result.channelTitle,
            authorUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(
              result.channelTitle
            )}`,
            duration: result.length?.simpleText
              ? parseDuration(result.length.simpleText)
              : 0,
            thumbnailUrl: thumb,
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
      <DialogContent className="w-full h-full sm:max-w-4xl rounded-2xl border border-white/10 bg-[#050505] p-0 text-white motion-preset-slide-up-sm max-h-[90vh] overflow-hidden">
        <div className="space-y-3 p-4 sm:space-y-4 sm:p-6 overflow-y-auto max-h-[90vh] flex flex-col">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold sm:text-xl">
              <Sparkles className="h-4 w-4 shrink-0 text-purple-400 sm:h-5 sm:w-5" />
              Create Custom Intent
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 sm:text-sm">
              Define your own intent with custom keywords. We&apos;ll
              automatically find tracks that match your vibe.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 flex-1">
            <div className="space-y-1.5 sm:space-y-2">
              <div>
                <label
                  htmlFor="intent-name"
                  className="text-xs font-medium text-white/70 sm:text-sm"
                >
                  Name
                </label>
              </div>
              <Input
                id="intent-name"
                placeholder="e.g., Night Owl, Coding Mode"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameOverwritten(true);
                  setError(null);
                }}
                className="h-10 w-full rounded-xl border-white/10 bg-white/5 text-sm text-white placeholder:text-zinc-500 sm:h-11 sm:max-w-sm sm:text-base"
                disabled={isLoading}
              />
            </div>

            {/* Keywords */}
            <div className="space-y-1.5 sm:space-y-2">
              <div>
                <label className="text-xs font-medium text-white/70 sm:text-sm">
                  Keywords <span className="text-zinc-500">(max 10)</span>
                </label>
              </div>
              <KeywordSelector
                keywords={keywords}
                onChange={setKeywords}
                maxKeywords={10}
                disabled={isLoading}
                onError={setError}
              />
              <p className="text-[11px] text-zinc-500 sm:text-xs">
                These keywords will be used to search for music that matches
                your intent.
              </p>
            </div>

            <div className="space-y-1.5 sm:space-y-2 hidden sm:block">
              <div>
                <label
                  htmlFor="intent-description"
                  className="text-xs font-medium text-white/70 sm:text-sm"
                >
                  Description <span className="text-zinc-500">(optional)</span>
                </label>
              </div>
              <Input
                id="intent-description"
                placeholder="e.g., For late night coding sessions"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-10 w-full rounded-xl border-white/10 bg-white/5 text-sm text-white placeholder:text-zinc-500 sm:h-11 sm:text-base"
                disabled={isLoading}
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 sm:text-sm">{error}</p>
            )}

            {loadingStatus && (
              <p className="flex items-center gap-2 text-xs text-zinc-400 sm:text-sm">
                <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                {loadingStatus}
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-end">
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={isLoading}
              className="h-10 w-full rounded-full px-4 text-white hover:bg-white/10 sm:h-auto sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || keywords.length === 0 || isLoading}
              className="h-10 w-full rounded-full bg-white text-black hover:bg-white/90 sm:h-auto sm:w-auto"
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
