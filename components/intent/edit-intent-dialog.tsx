"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Pencil } from "lucide-react";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { useCustomIntentsStore } from "@/lib/store/custom-intents-store";
import { KeywordSelector } from "./keyword-selector";

interface EditIntentDialogProps {
  playlistId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditIntentDialog({
  playlistId,
  isOpen,
  onOpenChange,
}: EditIntentDialogProps) {
  const [keywords, setKeywords] = React.useState<string[]>([]);
  const [description, setDescription] = React.useState("");
  const [minDuration, setMinDuration] = React.useState<number>(20);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const playlists = usePlaylistStore((state) => state.playlists);
  const updatePlaylist = usePlaylistStore((state) => state.updatePlaylist);

  const intentMetadataByPlaylistId = useCustomIntentsStore(
    (state) => state.intentMetadataByPlaylistId
  );
  const updateIntentMetadata = useCustomIntentsStore(
    (state) => state.updateIntentMetadata
  );

  // Find the playlist and custom intent
  const playlist = React.useMemo(
    () => playlists.find((p) => p.id === playlistId),
    [playlists, playlistId]
  );

  const intentMetadata = React.useMemo(
    () => intentMetadataByPlaylistId[playlistId],
    [intentMetadataByPlaylistId, playlistId]
  );

  const isCustomIntent = !!intentMetadata?.isCustom;
  const isBuiltInIntent = !!intentMetadata && !intentMetadata.isCustom;

  // Get the current keywords (from override, custom intent, or built-in intent)
  const currentKeywords = React.useMemo(() => {
    return intentMetadata?.keywords ?? [];
  }, [
    intentMetadata?.keywords,
  ]);

  // Get the current description
  const currentDescription = React.useMemo(() => {
    return intentMetadata?.description ?? "";
  }, [
    intentMetadata?.description,
  ]);

  // Get the current minimum duration
  const currentMinDuration = React.useMemo(() => {
    return intentMetadata?.minDuration ?? 20;
  }, [
    intentMetadata?.minDuration,
  ]);

  // Initialize form when dialog opens or intent changes
  React.useEffect(() => {
    if (isOpen) {
      setKeywords([...currentKeywords]);
      setDescription(currentDescription);
      setMinDuration(currentMinDuration);
      setError(null);
    }
  }, [isOpen, currentKeywords, currentDescription, currentMinDuration]);

  const handleClose = () => {
    onOpenChange(false);
    setError(null);
  };

  const handleSave = async () => {
    if (keywords.length === 0) {
      setError("Please add at least one keyword");
      return;
    }

    if (!isCustomIntent && !isBuiltInIntent) {
      setError("Cannot edit this intent");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const keywordsTyped = keywords.slice(0, 10) as
        | [string]
        | [string, string]
        | [string, string, string];

      updateIntentMetadata(playlistId, {
        keywords: keywordsTyped,
        description: description || undefined,
        minDuration,
      });

      // Update the playlist description if changed
      if (playlist && description !== (playlist.description || "")) {
        updatePlaylist(playlistId, { description: description || undefined });
      }

      handleClose();
    } catch (err) {
      console.error("Error saving intent:", err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!playlist || (!isCustomIntent && !isBuiltInIntent)) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full sm:max-w-4xl rounded-2xl border border-white/10 bg-[#050505] p-0 text-white motion-preset-slide-up-sm max-h-[90vh] overflow-hidden">
        <div className="space-y-3 p-4 sm:space-y-4 sm:p-6 overflow-y-auto max-h-[90vh] flex flex-col">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold sm:text-xl">
              <Pencil className="h-4 w-4 shrink-0 text-purple-400 sm:h-5 sm:w-5" />
              Edit Intent
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 sm:text-sm">
              Customize the keywords and description for &quot;{playlist.name}
              &quot;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 flex-1">
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
                disabled={isSaving}
                onError={setError}
              />
            </div>

            {/* Minimum Duration */}
            <div className="space-y-1.5 sm:space-y-2">
              <div>
                <label
                  htmlFor="intent-min-duration"
                  className="text-xs font-medium text-white/70 sm:text-sm"
                >
                  Minimum Duration (minutes)
                </label>
              </div>
              <Input
                id="intent-min-duration"
                type="number"
                min="1"
                max="240"
                placeholder="20"
                value={minDuration}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (!isNaN(value) && value >= 1 && value <= 240) {
                    setMinDuration(value);
                  }
                }}
                className="h-10 w-full rounded-xl border-white/10 bg-white/5 text-sm text-white placeholder:text-zinc-500 sm:h-11 sm:max-w-xs sm:text-base"
                disabled={isSaving}
              />
              <p className="text-[11px] text-zinc-500 sm:text-xs">
                Only fetch videos at least this long
              </p>
            </div>

            {/* Description - hidden on mobile */}
            <div className="space-y-1.5 sm:space-y-2 hidden sm:block">
              <div>
                <label
                  htmlFor="intent-description"
                  className="text-xs font-medium text-white/70 sm:text-sm"
                >
                  Description <span className="text-zinc-500">(optional)</span>
                </label>
              </div>
              <Textarea
                id="intent-description"
                placeholder="Describe the vibe or purpose of this intent..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-20 rounded-xl border-white/10 bg-white/5 text-sm text-white placeholder:text-zinc-500 resize-none sm:text-base"
                disabled={isSaving}
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 sm:text-sm">{error}</p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-end">
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={isSaving}
              className="h-10 w-full rounded-full px-4 text-white hover:bg-white/10 sm:h-auto sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={keywords.length === 0 || isSaving}
              className="h-10 w-full rounded-full bg-white text-black hover:bg-white/90 sm:h-auto sm:w-auto"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
