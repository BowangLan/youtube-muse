"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
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
import { getIntentByName } from "@/lib/intents";
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
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const playlists = usePlaylistStore((state) => state.playlists);
  const updatePlaylist = usePlaylistStore((state) => state.updatePlaylist);

  const customIntents = useCustomIntentsStore((state) => state.customIntents);
  const updateCustomIntent = useCustomIntentsStore(
    (state) => state.updateCustomIntent
  );
  const keywordOverrides = useCustomIntentsStore(
    (state) => state.keywordOverrides
  );
  const descriptionOverrides = useCustomIntentsStore(
    (state) => state.descriptionOverrides
  );
  const setKeywordOverride = useCustomIntentsStore(
    (state) => state.setKeywordOverride
  );
  const setDescriptionOverride = useCustomIntentsStore(
    (state) => state.setDescriptionOverride
  );

  // Find the playlist and custom intent
  const playlist = React.useMemo(
    () => playlists.find((p) => p.id === playlistId),
    [playlists, playlistId]
  );

  const customIntent = React.useMemo(
    () => customIntents.find((ci) => ci.playlistId === playlistId),
    [customIntents, playlistId]
  );

  // Check if this is a built-in intent
  const builtInIntent = React.useMemo(
    () => getIntentByName(playlist?.name),
    [playlist?.name]
  );

  const isCustomIntent = !!customIntent;
  const isBuiltInIntent = !!builtInIntent;

  // Get the current keywords (from override, custom intent, or built-in intent)
  const currentKeywords = React.useMemo(() => {
    if (isCustomIntent && customIntent) {
      return customIntent.keywords;
    }
    if (isBuiltInIntent) {
      return keywordOverrides[playlistId] ?? builtInIntent.keywords;
    }
    return [];
  }, [
    isCustomIntent,
    customIntent,
    isBuiltInIntent,
    keywordOverrides,
    playlistId,
    builtInIntent,
  ]);

  // Get the current description
  const currentDescription = React.useMemo(() => {
    if (isCustomIntent && customIntent) {
      return customIntent.description || "";
    }
    if (isBuiltInIntent) {
      return (
        descriptionOverrides[playlistId] ?? builtInIntent.description ?? ""
      );
    }
    return "";
  }, [
    isCustomIntent,
    customIntent,
    isBuiltInIntent,
    descriptionOverrides,
    playlistId,
    builtInIntent,
  ]);

  // Initialize form when dialog opens or intent changes
  React.useEffect(() => {
    if (isOpen) {
      setKeywords([...currentKeywords]);
      setDescription(currentDescription);
      setError(null);
    }
  }, [isOpen, currentKeywords, currentDescription]);

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

      if (isCustomIntent && customIntent) {
        // Update the custom intent in the store (both keywords and description)
        updateCustomIntent(customIntent.id, {
          keywords: keywordsTyped,
          description: description || undefined,
        });
      } else if (isBuiltInIntent) {
        // For built-in intents, store as overrides
        setKeywordOverride(playlistId, keywordsTyped);
        if (description) {
          setDescriptionOverride(playlistId, description);
        }
      }

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
      <DialogContent className="sm:max-w-4xl rounded-2xl border border-white/10 bg-[#050505] p-0 text-white motion-preset-slide-up-sm">
        <div className="space-y-5 p-6">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
              <Pencil className="h-5 w-5 text-purple-400" />
              Edit Intent
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-500">
              Customize the keywords and description for &quot;{playlist.name}
              &quot;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Keywords */}
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium text-white/70">
                  Keywords (max 10)
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

            {/* Description */}
            <div className="space-y-2">
              <label
                htmlFor="intent-description"
                className="text-sm font-medium text-white/70"
              >
                Description <span className="text-zinc-500">(optional)</span>
              </label>
              <Textarea
                id="intent-description"
                placeholder="Describe the vibe or purpose of this intent..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-20 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-zinc-500 resize-none"
                disabled={isSaving}
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={isSaving}
              className="rounded-full px-4 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={keywords.length === 0 || isSaving}
              className="rounded-full bg-white text-black hover:bg-white/90"
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
