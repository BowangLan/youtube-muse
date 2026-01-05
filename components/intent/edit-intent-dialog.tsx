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
import { Loader2 } from "lucide-react";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { useCustomIntentsStore } from "@/lib/store/custom-intents-store";
import { KeywordSelector } from "./keyword-selector";
import { Label } from "../ui/label";

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
  }, [intentMetadata?.keywords]);

  // Get the current description
  const currentDescription = React.useMemo(() => {
    return intentMetadata?.description ?? "";
  }, [intentMetadata?.description]);

  // Get the current minimum duration
  const currentMinDuration = React.useMemo(() => {
    return intentMetadata?.minDuration ?? 20;
  }, [intentMetadata?.minDuration]);

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
      <DialogContent className="w-[92vw] max-h-[85vh] overflow-hidden rounded-3xl border border-white/10 bg-[#070707] p-0 text-white motion-preset-slide-up-sm sm:max-w-xl">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(255,255,255,0.12),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.08),transparent_40%)]"
        />
        <div className="relative flex max-h-[85vh] flex-col gap-6 overflow-y-auto p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-white">
              Edit Intent
            </DialogTitle>
            <DialogDescription>
              Customize the keywords and description for &quot;{playlist.name}
              &quot;
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-6 flex-1 min-h-0 overflow-y-auto">
            {/* Intent Name */}
            <div className="space-y-2 shrink-0">
              <Label>Intent Name</Label>
              <Input
                value={playlist?.name || ""}
                disabled
                className="h-10 w-full rounded-none border-x-0 border-b border-t-0 border-white/20 bg-transparent px-3 text-sm text-white placeholder:text-white/30 focus-visible:ring-0"
              />
            </div>

            {/* Keywords */}
            <KeywordSelector
              keywords={keywords}
              onChange={setKeywords}
              maxKeywords={10}
              disabled={isSaving}
              onError={setError}
            />

            {/* Minimum Duration */}
            <div className="space-y-2 shrink-0">
              <Label>Minimum Duration (minutes)</Label>
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
                className="h-10 w-full rounded-none border-x-0 border-b border-t-0 border-white/20 bg-transparent px-3 text-sm text-white placeholder:text-white/30 focus-visible:ring-0"
                disabled={isSaving}
              />
              <p className="text-xs text-zinc-400">
                Only fetch videos at least this long
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>
                Description <span className="text-zinc-400">(optional)</span>
              </Label>
              <Textarea
                id="intent-description"
                placeholder="Describe the vibe or purpose of this intent..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-20 rounded-xl border-white/10 bg-white/5 text-sm text-white placeholder:text-zinc-500 resize-none"
                disabled={isSaving}
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="ghost" onClick={handleClose} disabled={isSaving}>
              Cancel
            </Button>
            <div className="flex-1"></div>
            <Button
              onClick={handleSave}
              disabled={keywords.length === 0 || isSaving}
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
