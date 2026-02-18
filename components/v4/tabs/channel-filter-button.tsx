"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Channel } from "@/lib/types/channel";

interface ChannelFilterButtonProps {
  channel: Channel;
  isSelected: boolean;
  onToggle: () => void;
}

function ChannelTooltipCard({ channel }: { channel: Channel }) {
  const descriptionSnippet = channel.description
    ? channel.description.length > 100
      ? `${channel.description.slice(0, 100).trim()}…`
      : channel.description
    : null;

  return (
    <div className="flex flex-col gap-3 p-3.5 min-w-[210px] max-w-[260px] h-fit">
      {/* Avatar + identity */}
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <img
            src={channel.thumbnailUrl}
            alt=""
            className="size-10 rounded-full object-cover"
          />
          <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/20" />
        </div>
        <div className="min-w-0 flex-1">
          <a
            href={`https://www.youtube.com/channel/${channel.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <p className="text-[13px] font-medium text-white/90 truncate leading-snug hover:text-white trans">
              {channel.title}
            </p>
          </a>
          {channel.customUrl && (
            <p className="text-[11px] text-white/35 truncate mt-0.5 font-mono tracking-tight">
              {channel.customUrl}
            </p>
          )}
        </div>
      </div>

      {/* <pre className="text-xs text-white/35 truncate mt-0.5 font-mono tracking-tight whitespace-pre-wrap">
        {JSON.stringify(channel, null, 2)}
      </pre> */}

      {/* Subscriber pill */}
      {channel.subscriberCount && (
        <div>
          <span className="inline-flex items-center rounded-full px-2 py-0.5 bg-white/[0.07] border border-white/10 text-[10px] font-medium text-white/45 tracking-wide">
            {channel.subscriberCount}
          </span>
        </div>
      )}

      {/* Description */}
      {descriptionSnippet && (
        <>
          <div className="h-px bg-white/[0.07]" />
          <p className="text-[11px] text-white/38 line-clamp-3 leading-relaxed">
            {descriptionSnippet}
          </p>
        </>
      )}
    </div>
  );
}

export function ChannelFilterButton({
  channel,
  isSelected,
  onToggle,
}: ChannelFilterButtonProps) {
  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "flex flex-col items-center relative gap-2 w-16 shrink-0 group cursor-pointer select-none rounded-lg p-1 -m-1 transition-colors",
            isSelected && "rounded-full"
          )}
        >
          <div className="relative">
            <img
              src={channel.thumbnailUrl}
              alt={channel.title}
              className="size-13 rounded-full object-cover trans"
            />
            {isSelected && (
              <div className="absolute rounded-full inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <X className="size-4 text-white" />
              </div>
            )}
          </div>
          <span className="text-xs text-center truncate w-full max-w-12 font-medium text-foreground/60 group-hover:text-foreground trans">
            {channel.title}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="start"
        className="z-50 p-0 overflow-hidden rounded-2xl border border-white/[0.09] bg-black/75 backdrop-blur-2xl shadow-2xl shadow-black/60 [&>svg]:hidden"
      >
        <ChannelTooltipCard channel={channel} />
      </TooltipContent>
    </Tooltip>
  );
}
