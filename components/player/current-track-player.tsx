import Image from "next/image";
import { getThumbnailUrl } from "@/lib/utils/youtube";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { usePlayerStore } from "@/lib/store/player-store";
import { PlayPauseButton, ProgressBar, TimeDisplay } from "./player-controls";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { SkipBack, SkipForward } from "lucide-react";
import { useAppStateStore } from "@/lib/store/app-state-store";

export function CurrentTrackPlayer() {
  const isFocused = useAppStateStore((state) => state.isFocused);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {isFocused ? (
        <motion.div
          key="mini"
          initial={{ opacity: 0.2, filter: "blur(12px)" }}
          animate={{
            opacity: 1,
            filter: "blur(0px)",
            transition: { duration: 0.35, ease: "easeOut" },
          }}
          exit={{
            opacity: 0.2,
            filter: "blur(10px)",
            transition: { duration: 0.1, ease: "easeOut" },
          }}
        >
          <CurrentTrackPlayerMini />
        </motion.div>
      ) : (
        <motion.div
          key="detailed"
          initial={{ opacity: 0.2, filter: "blur(12px)" }}
          animate={{
            opacity: 1,
            filter: "blur(0px)",
            transition: { duration: 0.35, ease: "easeOut" },
          }}
          exit={{
            opacity: 0.2,
            filter: "blur(10px)",
            transition: { duration: 0.1, ease: "easeOut" },
          }}
        >
          <CurrentTrackPlayerDetailed />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CurrentTrackPlayerDetailed() {
  const track = usePlaylistStore((state) => state.getCurrentTrack());
  const dispatch = usePlayerStore((state) => state.dispatch);
  // const canPlayNext = usePlaylistStore((state) => state.canPlayNext);

  if (!track) {
    return null;
  }

  return (
    <div className="flex flex-col group/player gap-6 sm:gap-8 animate-[fadeIn_0s_ease-out] w-full min-w-sm max-w-md lg:max-w-lg gap-x-6 gap-y-6 items-start">
      {/* Album Art */}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-2xl trans hover:shadow-white/5 ring-1 ring-white/5">
        <Image
          src={getThumbnailUrl(track.id, "maxresdefault")}
          alt={track.title}
          fill
          sizes="192px"
          className="h-full w-full object-cover trans group-hover/player:scale-105"
          priority
        />
        {/* Hover Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 backdrop-blur-sm trans group-hover/player:opacity-100 cursor-pointer">
          <PlayPauseButton variant="ghost" />
        </div>
      </div>

      {/* Track Info & Controls */}
      <div className="w-full space-y-6 sm:space-y-8">
        {/* Titles */}
        <div className="space-y-1">
          <Link
            href={`https://www.youtube.com/watch?v=${track.id}`}
            target="_blank"
          >
            <h1 className="text-xl hover:underline group-hover/player:text-2xl sm:text-2xl sm:group-hover/player:text-[1.6rem] tracking-tighter font-semibold text-white leading-tight line-clamp-2 trans">
              {track.title}
            </h1>
          </Link>
          <Link
            href={`https://www.youtube.com/watch?v=${track.id}`}
            target="_blank"
          >
            <p className="text-sm hover:underline hover:text-white trans sm:text-base text-white/50 font-normal tracking-tight">
              {track.author || "Unknown Artist"}
            </p>
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          <ProgressBar />
          <TimeDisplay />
        </div>

        {/* Controls Row */}
        <div className="flex items-center gap-8 pt-1">
          {/* Like Button */}
          <button className="text-white/40 hover:text-rose-400 transition-colors duration-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              data-lucide="heart"
              className="lucide lucide-heart h-5 w-5"
            >
              <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"></path>
            </svg>
          </button>
          {/* Main Transport */}
          <div className="flex items-center gap-6 w-full justify-center">
            <button
              className="text-white/70 hover:text-white transition-colors duration-200 cursor-pointer"
              onClick={() => dispatch({ type: "UserPreviousTrack" })}
            >
              <SkipBack className="h-5 w-5" />
            </button>
            <PlayPauseButton
              className="h-12 w-12 group-hover/player:h-14 group-hover/player:w-14"
              iconClassName="h-5 w-5 group-hover/player:h-6 group-hover/player:w-6"
            />
            <button
              className="text-white/70 hover:text-white transition-colors duration-200 cursor-pointer"
              onClick={() => dispatch({ type: "UserNextTrack" })}
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>
          {/* Volume/Options */}
          <button className="text-white/40 hover:text-white transition-colors duration-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              data-lucide="list-music"
              className="lucide lucide-list-music h-5 w-5"
            >
              <path d="M16 5H3"></path>
              <path d="M11 12H3"></path>
              <path d="M11 19H3"></path>
              <path d="M21 16V5"></path>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export function CurrentTrackPlayerMini() {
  const track = usePlaylistStore((state) => state.getCurrentTrack());

  if (!track) {
    return null;
  }

  return (
    <div className="flex flex-col group/player gap-6 w-full min-w-[20rem] max-w-[20rem] gap-x-6 gap-y-6 items-start">
      {/* Album Art */}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-2xl trans hover:shadow-white/5 ring-1 ring-white/5">
        <Image
          src={getThumbnailUrl(track.id, "maxresdefault")}
          alt={track.title}
          fill
          sizes="192px"
          className="h-full w-full object-cover trans group-hover/player:scale-105"
          priority
        />
        {/* Hover Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 backdrop-blur-sm trans group-hover/player:opacity-100 cursor-pointer">
          <PlayPauseButton variant="ghost" />
        </div>
      </div>

      {/* Track Info & Controls */}
      <div className="w-full space-y-6">
        {/* Titles */}
        <div className="flex items-center gap-2 justify-between">
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <Link
              href={`https://www.youtube.com/watch?v=${track.id}`}
              target="_blank"
            >
              <h1 className="text-base hover:underline sm:text-lg tracking-tighter font-normal text-white leading-tight line-clamp-1 trans">
                {track.title}
              </h1>
            </Link>
            {/* Author */}
            <Link
              href={track.authorUrl ?? "#"}
              target="_blank"
              className="hover:underline"
              rel="noopener noreferrer"
            >
              <p className="text-sm hover:underline hover:text-white trans text-white/50 font-normal tracking-tight">
                {track.author || "Unknown Artist"}
              </p>
            </Link>
          </div>
          <PlayPauseButton
            className="h-10 w-10 flex-none"
            iconClassName="h-4.5 w-4.5"
          />
        </div>

        <div className="flex flex-col gap-4">
          <ProgressBar />
        </div>

        {/* Controls Row */}
        <div className="flex items-center gap-8 pt-1">
          {/* Main Transport */}
          <div className="flex items-center gap-6 w-full justify-center"></div>
        </div>
      </div>
    </div>
  );
}
