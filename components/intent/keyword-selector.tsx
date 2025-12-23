"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// 30+ built-in keyword suggestions for music intents
export const SUGGESTED_KEYWORDS = [
  // Mood/Energy
  "chill",
  "upbeat",
  "calm",
  "energetic",
  "relaxing",
  "intense",
  "mellow",
  "peaceful",
  // Genre/Style
  "ambient",
  "lo-fi",
  "electronic",
  "acoustic",
  "jazz",
  "classical",
  "indie",
  "synthwave",
  "retro",
  "groove",
  "rock",
  "alternative",
  "punk",
  "metal",
  "folk",
  "blues",
  "soul",
  "funk",
  "hip hop",
  "rap",
  "r&b",
  "pop",
  "dance",
  "house",
  "techno",
  "trance",
  "dubstep",
  "drum and bass",
  "experimental",
  "industrial",
  "noise",
  "soundtrack",
  "cinematic",
  "orchestral",
  "world",
  "latin",
  "reggae",
  "ska",
  "afrobeat",
  "country",
  "americana",
  "bluegrass",
  "gospel",
  "ambient pop",
  "dream pop",
  "shoegaze",
  "post-rock",
  "math rock",
  "progressive",
  "psychedelic",
  "new wave",
  "darkwave",
  "chillout",
  "downtempo",
  "vaporwave",
  // Activity/Purpose
  "focus",
  "study",
  "work",
  "meditation",
  "sleep",
  "workout",
  "coding",
  "creative",
  // Atmosphere
  "dreamy",
  "dark",
  "minimal",
  "nature",
  "night",
  "morning",
  "cozy",
] as const;

interface KeywordSelectorProps {
  keywords: string[];
  onChange: (keywords: string[]) => void;
  maxKeywords?: number;
  disabled?: boolean;
  onError?: (error: string | null) => void;
}

export function KeywordSelector({
  keywords,
  onChange,
  maxKeywords = 10,
  disabled = false,
  onError,
}: KeywordSelectorProps) {
  const handleToggleKeyword = (keyword: string) => {
    if (keywords.includes(keyword)) {
      onChange(keywords.filter((k) => k !== keyword));
      onError?.(null);
    } else {
      if (keywords.length >= maxKeywords) {
        onError?.(`Maximum ${maxKeywords} keywords allowed`);
        return;
      }
      onError?.(null);
      onChange([...keywords, keyword]);
    }
  };

  const handleAddCustomKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const input = e.currentTarget;
      const value = input.value.trim().toLowerCase();

      if (!value) return;

      if (keywords.includes(value)) {
        onError?.("Keyword already added");
        return;
      }

      if (keywords.length >= maxKeywords) {
        onError?.(`Maximum ${maxKeywords} keywords allowed`);
        return;
      }

      onChange([...keywords, value]);
      onError?.(null);
      input.value = "";
    }
  };

  return (
    <div className="space-y-2">
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <button
              key={keyword}
              type="button"
              onClick={() => handleToggleKeyword(keyword)}
              disabled={disabled}
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                "transition-all duration-200",
                "bg-white/20 text-white border border-white/30"
              )}
            >
              <Check className="h-3 w-3" />
              {keyword}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {SUGGESTED_KEYWORDS.map((keyword) => {
          const isSelected = keywords.includes(keyword);

          if (isSelected) {
            return null;
          }

          return (
            <button
              key={keyword}
              type="button"
              onClick={() => handleToggleKeyword(keyword)}
              disabled={disabled || keywords.length >= maxKeywords}
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                "transition-all duration-200",
                "bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10 hover:text-white",
                keywords.length >= maxKeywords &&
                  "opacity-40 cursor-not-allowed"
              )}
            >
              {keyword}
            </button>
          );
        })}
      </div>

      <Input
        placeholder="Type custom keyword and press Enter..."
        onKeyDown={handleAddCustomKeyword}
        className="h-10 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-zinc-500"
        disabled={disabled || keywords.length >= maxKeywords}
      />
    </div>
  );
}
