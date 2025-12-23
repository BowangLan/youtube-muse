"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
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

// Helper to get color classes for a keyword based on its category
const getKeywordColorClasses = (keyword: string) => {
  if (MOOD_ENERGY_KEYWORDS.includes(keyword)) {
    return "bg-rose-500/25 text-rose-200 border-rose-500/40";
  }
  if (GENRE_STYLE_KEYWORDS.includes(keyword)) {
    return "bg-violet-500/25 text-violet-200 border-violet-500/40";
  }
  if (ACTIVITY_PURPOSE_KEYWORDS.includes(keyword)) {
    return "bg-emerald-500/25 text-emerald-200 border-emerald-500/40";
  }
  if (ATMOSPHERE_KEYWORDS.includes(keyword)) {
    return "bg-sky-500/25 text-sky-200 border-sky-500/40";
  }
  // Custom keywords - neutral white
  return "bg-white/20 text-white border-white/30";
};

const KEYWORD_CATEGORIES = [
  {
    id: "mood",
    label: "Mood & Energy",
    keywords: MOOD_ENERGY_KEYWORDS,
    activeClass: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    pillClass:
      "bg-rose-500/10 text-rose-300/80 border-rose-500/20 hover:bg-rose-500/20 hover:text-rose-200",
  },
  {
    id: "genre",
    label: "Genre & Style",
    keywords: GENRE_STYLE_KEYWORDS,
    activeClass: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    pillClass:
      "bg-violet-500/10 text-violet-300/80 border-violet-500/20 hover:bg-violet-500/20 hover:text-violet-200",
  },
  {
    id: "activity",
    label: "Activity",
    keywords: ACTIVITY_PURPOSE_KEYWORDS,
    activeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    pillClass:
      "bg-emerald-500/10 text-emerald-300/80 border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-200",
  },
  {
    id: "atmosphere",
    label: "Atmosphere",
    keywords: ATMOSPHERE_KEYWORDS,
    activeClass: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    pillClass:
      "bg-sky-500/10 text-sky-300/80 border-sky-500/20 hover:bg-sky-500/20 hover:text-sky-200",
  },
] as const;

export function KeywordSelector({
  keywords,
  onChange,
  maxKeywords = 10,
  disabled = false,
  onError,
}: KeywordSelectorProps) {
  const [activeCategory, setActiveCategory] = React.useState<string>("mood");

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
                "transition-all duration-200 border",
                getKeywordColorClasses(keyword)
              )}
            >
              <Check className="h-3 w-3" />
              {keyword}
            </button>
          ))}
        </div>
      )}

      {/* Keyword Selector - Desktop */}
      <div className="hidden sm:flex rounded-lg border border-white/10 bg-white/2 overflow-hidden h-56">
        {/* Sidebar */}
        <div className="flex p-1 gap-1 flex-col border-r border-white/10 bg-white/2 shrink-0">
          {KEYWORD_CATEGORIES.map((category) => {
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  "px-3 py-2 text-xs font-medium rounded-md text-left transition-all duration-200",
                  isActive
                    ? cn(category.activeClass, "border-current")
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                )}
              >
                {category.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 p-3 overflow-y-auto">
          {KEYWORD_CATEGORIES.map((category) => {
            if (activeCategory !== category.id) return null;

            return (
              <div
                key={category.id}
                className="flex flex-wrap gap-1.5 content-start"
              >
                {category.keywords.map((keyword) => {
                  const isSelected = keywords.includes(keyword);
                  if (isSelected) return null;

                  return (
                    <button
                      key={keyword}
                      type="button"
                      onClick={() => handleToggleKeyword(keyword)}
                      disabled={disabled || keywords.length >= maxKeywords}
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                        "transition-all duration-200 border",
                        category.pillClass,
                        keywords.length >= maxKeywords &&
                          "opacity-40 cursor-not-allowed"
                      )}
                    >
                      {keyword}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Keyword Selector - Mobile */}
      <div className="flex flex-col sm:hidden">
        {/* top bar */}
        <div className="flex mt-1 max-w-full overflow-x-auto min-w-0 min-h-0 gap-1 flex-row items-center flex-none scrollbar-none">
          {KEYWORD_CATEGORIES.map((category) => {
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  "px-3 py-2 text-xs flex-none font-medium rounded-md text-left transition-all duration-200",
                  isActive
                    ? cn(category.activeClass, "border-current")
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                )}
              >
                {category.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 mt-3 overflow-y-auto max-h-56">
          {KEYWORD_CATEGORIES.map((category) => {
            if (activeCategory !== category.id) return null;

            return (
              <div
                key={category.id}
                className="flex flex-wrap gap-1.5 content-start"
              >
                {category.keywords.map((keyword) => {
                  const isSelected = keywords.includes(keyword);
                  if (isSelected) return null;

                  return (
                    <button
                      key={keyword}
                      type="button"
                      onClick={() => handleToggleKeyword(keyword)}
                      disabled={disabled || keywords.length >= maxKeywords}
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                        "transition-all duration-200 border",
                        category.pillClass,
                        keywords.length >= maxKeywords &&
                          "opacity-40 cursor-not-allowed"
                      )}
                    >
                      {keyword}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <Input
        placeholder="Or enter a custom keyword..."
        onKeyDown={handleAddCustomKeyword}
        className="h-10 text-sm rounded-xl max-w-xs border-white/10 bg-white/5 text-white placeholder:text-zinc-500"
        disabled={disabled || keywords.length >= maxKeywords}
      />
    </div>
  );
}
