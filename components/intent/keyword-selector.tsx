"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// 30+ built-in keyword suggestions for music intents
export const MOOD_ENERGY_KEYWORDS = [
  "chill",
  "upbeat",
  "calm",
  "energetic",
  "relaxing",
  "intense",
  "mellow",
  "peaceful",
  "happy",
  "joyful",
  "playful",
  "optimistic",
  "bright",
  "warm",
  "romantic",
  "dreamy",
  "nostalgic",
  "sentimental",
  "emotional",
  "melancholic",
  "sad",
  "dark",
  "moody",
  "brooding",
  "mysterious",
  "eerie",
  "tense",
  "dramatic",
  "aggressive",
  "angry",
  "raw",
  "powerful",
  "epic",
  "uplifting",
  "inspiring",
  "motivational",
  "focused",
  "contemplative",
  "meditative",
  "hypnotic",
  "laid-back",
  "smooth",
];

export const GENRE_STYLE_KEYWORDS = [
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
];

export const ACTIVITY_PURPOSE_KEYWORDS = [
  "focus",
  "study",
  "work",
  "meditation",
  "sleep",
  "workout",
  "coding",
  "creative",
  "reading",
  "writing",
  "brainstorming",
  "deep work",
  "background listening",
  "stress management",
  "yoga",
  "mindfulness practice",
  "breathing exercises",
  "commuting",
  "traveling",
  "gaming",
  "streaming",
  "presenting",
  "reflection",
];

export const ATMOSPHERE_KEYWORDS = [
  "minimalist",
  "natural",
  "nocturnal",
  "dawn",
  "intimate",
  "spacious",
  "airy",
  "cinematic space",
  "ethereal texture",
  "urban setting",
  "futuristic setting",
  "retro aesthetic",
  "organic texture",
  "analog feel",
  "digital feel",
  "immersive",
  "environmental",
  "abstract",
  "textural",
  "atmospheric layers",
];

export const SUGGESTED_KEYWORDS = [
  ...MOOD_ENERGY_KEYWORDS,
  ...GENRE_STYLE_KEYWORDS,
  ...ACTIVITY_PURPOSE_KEYWORDS,
  ...ATMOSPHERE_KEYWORDS,
] as const;

interface KeywordSelectorProps {
  keywords: string[];
  onChange: (keywords: string[]) => void;
  maxKeywords?: number;
  disabled?: boolean;
  onError?: (error: string | null) => void;
}

const getKeywordColorClasses = (keyword: string) => {
  if (
    SUGGESTED_KEYWORDS.includes(keyword as (typeof SUGGESTED_KEYWORDS)[number])
  ) {
    return "bg-white/5 text-white/80 border-white/15";
  }
  return "bg-white/10 text-white border-white/20";
};

export function KeywordSelector({
  keywords,
  onChange,
  maxKeywords = 10,
  disabled = false,
  onError,
}: KeywordSelectorProps) {
  const [searchTerm, setSearchTerm] = React.useState<string>("");

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
      setSearchTerm("");
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  // Filter built-in keywords based on search term
  const filteredKeywords = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return SUGGESTED_KEYWORDS.filter((keyword) => {
      if (keywords.includes(keyword)) return false;
      if (!term) return true;
      return keyword.toLowerCase().includes(term);
    });
  }, [searchTerm, keywords]);

  const handleSelectSearchResult = (keyword: string) => {
    if (keywords.length >= maxKeywords) {
      onError?.(`Maximum ${maxKeywords} keywords allowed`);
      return;
    }
    onChange([...keywords, keyword]);
    onError?.(null);
    setSearchTerm("");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Input
          placeholder="Type a keyword and press Enter"
          value={searchTerm}
          onChange={handleSearchChange}
          onKeyDown={handleAddCustomKeyword}
          className="h-11 w-full rounded-none border-x-0 border-b border-t-0 border-white/20 bg-transparent px-0 text-sm text-white placeholder:text-white/30 focus-visible:ring-0"
          disabled={disabled || keywords.length >= maxKeywords}
        />
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
          Selected
        </div>
        <div className="h-24 overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-white/5 p-3">
          {keywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <button
                  key={keyword}
                  type="button"
                  onClick={() => handleToggleKeyword(keyword)}
                  disabled={disabled}
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                    "transition-all duration-200 border",
                    getKeywordColorClasses(keyword)
                  )}
                >
                  {keyword}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-xs text-white/40">
              Add keywords to define the intent.
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
          Suggested
        </div>
        <div className="h-40 overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-white/5 p-3">
          {filteredKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {filteredKeywords.map((keyword) => (
                <button
                  key={keyword}
                  type="button"
                  onClick={() => handleSelectSearchResult(keyword)}
                  disabled={disabled || keywords.length >= maxKeywords}
                  className={cn(
                    "inline-flex items-center rounded-full border border-white/10 bg-white/3 px-3 py-1.5 text-xs text-white/70",
                    "transition-all duration-200 hover:bg-white/10 hover:text-white",
                    keywords.length >= maxKeywords &&
                      "cursor-not-allowed opacity-40"
                  )}
                >
                  {keyword}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-xs text-white/40">
              No matches. Press Enter to add &quot;{searchTerm.trim()}&quot;.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
