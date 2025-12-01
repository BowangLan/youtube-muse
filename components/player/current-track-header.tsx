import { Track } from "@/lib/types/playlist";
import Image from "next/image";
import { getThumbnailUrl } from "@/lib/utils/youtube";

export function CurrentTrackHeader({ track }: { track: Track }) {
  return (
    <div className="flex flex-col gap-6 items-center sm:items-start sm:flex-row motion-blur-in-lg motion-opacity-in-0 motion-delay-700">
      <div className="relative aspect-video w-full sm:max-w-[16rem] md:max-w-[22rem] overflow-hidden rounded-xl">
        <Image
          src={getThumbnailUrl(track.id, "maxresdefault")}
          alt={track.title}
          fill
          sizes="220px"
          className="object-cover"
          priority
        />
      </div>
      <div className="flex min-w-0 w-full sm:flex-1 flex-col gap-2 md:gap-3 text-neutral-300">
        <span className="text-xs uppercase hidden sm:block tracking-[0.4em] text-neutral-500">
          playing now
        </span>
        <h2 className="md:text-3xl text-xl font-light leading-tight text-white">
          <a
            href={`https://www.youtube.com/watch?v=${track.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {track.title}
          </a>
        </h2>
        <p className="md:text-sm text-xs">
          <a
            href={track.authorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-white"
          >
            {track.author || "Unknown Artist"}
          </a>
        </p>
      </div>
    </div>
  );
}
