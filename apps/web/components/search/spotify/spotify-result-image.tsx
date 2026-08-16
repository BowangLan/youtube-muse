import type { SpotifySearchResult } from "@/lib/spotify/api";
import { catalogPrimaryImage } from "@/lib/types/catalog-search";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type SpotifyResultImageProps = {
  result: SpotifySearchResult;
  className: string;
  icon: LucideIcon;
};

export function SpotifyResultImage({ result, className, icon: Icon }: SpotifyResultImageProps) {
  const imageUrl = catalogPrimaryImage(result.images);

  return imageUrl ? (
    <img src={imageUrl} alt="" loading="lazy" className={className} />
  ) : (
    <span
      className={cn("flex items-center justify-center bg-white/[0.06] text-white/25", className)}
    >
      <Icon className="size-7" />
    </span>
  );
}
