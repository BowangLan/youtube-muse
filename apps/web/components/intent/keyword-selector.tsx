"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Label } from "../ui/label";

// Built-in keyword suggestions for music intents
export const MOOD_ENERGY_KEYWORDS = [
  "chill",
  "relaxing",
  "upbeat",
  "mellow",
  "calm",
];

export const GENRE_STYLE_KEYWORDS = [
  "ambient",
  "lo-fi",
  "acoustic",
  "jazz",
  "rock",
  "hip hop",
  "pop",
  "dark ambient",
];

export const ACTIVITY_PURPOSE_KEYWORDS = [
  "study",
  "focus",
  "sleep",
  "workout",
  "reading",
];

export const ATMOSPHERE_KEYWORDS = ["instrumental", "piano", "guitar", "vocal"];

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
    <div className="space-y-4 shrink-0">
      <div className="space-y-2">
        <Label>Keywords</Label>
        <Input
          placeholder="Type a keyword and press Enter"
          value={searchTerm}
          onChange={handleSearchChange}
          onKeyDown={handleAddCustomKeyword}
          className="h-11 w-full rounded-none border-x-0 border-b border-t-0 border-white/20 bg-transparent px-3 text-sm text-white placeholder:text-white/30 focus-visible:ring-0"
          disabled={disabled || keywords.length >= maxKeywords}
        />
        {/* <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
          Selected
        </div> */}
      </div>

      <div>
        {keywords.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <Button
                key={keyword}
                onClick={() => handleToggleKeyword(keyword)}
                disabled={disabled}
                size="sm"
                variant={"secondary"}
                className={cn()}
              >
                {keyword}
              </Button>
            ))}
          </div>
        ) : (
          <div className="text-xs text-white/40">
            Add keywords to define the intent.
          </div>
        )}
      </div>

      <div className="space-y-2">
        {/* <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
          Suggested
        </div> */}
        <div className="h-40 overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-white/5 p-3">
          {filteredKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {filteredKeywords.map((keyword) => (
                <Button
                  key={keyword}
                  onClick={() => handleSelectSearchResult(keyword)}
                  disabled={disabled || keywords.length >= maxKeywords}
                  size="sm"
                  variant="secondary"
                  className={cn(
                    "opacity-70",
                    keywords.length >= maxKeywords &&
                      "cursor-not-allowed opacity-40"
                  )}
                >
                  {keyword}
                </Button>
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
