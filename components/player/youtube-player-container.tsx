"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  PLAYER_CONTAINER_ID,
  PLAYER_ELEMENT_ID,
} from "@/components/player/youtube-player-element";
import { useYouTubePlayerInstanceStore } from "@/lib/store/youtube-player-instance-store";
import { FullscreenIcon, PlayIcon } from "lucide-react";
import { motion } from "motion/react";
import {
  PlayPauseButton,
  ProgressBar,
  TimeDisplay,
  VolumeControl,
} from "@/components/player/player-controls";
import { Icons } from "../icons";
import { usePlayerStore } from "@/lib/store/player-store";
import { useIsPlaying } from "@/hooks/use-is-playing";
import { VideoPlaybackOverlay } from "./playback-overlay";
import { FullscreenPlayerControls } from "./fullscreen-player-controls";

const getFloatingFallbackStyles = (): React.CSSProperties => ({
  position: "fixed",
  right: "1.5rem",
  bottom: "6.5rem",
  left: "",
  top: "",
  width: "360px",
  height: "202px",
  opacity: "1",
  pointerEvents: "auto",
  borderRadius: "8px",
  boxShadow: "0 24px 60px rgba(0, 0, 0, 0.45)",
  zIndex: "60",
  overflow: "hidden",
});

const fullscreenStyles: React.CSSProperties = {
  position: "fixed",
  inset: "0",
  width: "100vw",
  height: "100vh",
  opacity: "1",
  pointerEvents: "auto",
  borderRadius: "0",
  boxShadow: "none",
  zIndex: "80",
};

const hiddenStyles: React.CSSProperties = {
  position: "fixed",
  display: "none",
  right: "1.5rem",
  bottom: "6.5rem",
  left: "",
  top: "",
  width: "360px",
  height: "202px",
  opacity: "0",
  pointerEvents: "none",
  borderRadius: "",
  boxShadow: "",
  zIndex: "",
};

export function YouTubePlayerContainer() {
  const videoMode = useYouTubePlayerInstanceStore((state) => state.videoMode);
  const hostElement = useYouTubePlayerInstanceStore(
    (state) => state.hostElement
  );
  const setVideoMode = useYouTubePlayerInstanceStore(
    (state) => state.setVideoMode
  );
  const player = useYouTubePlayerInstanceStore((state) => state.player);
  const isMobile = useIsMobile();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const iframeContainerRef = React.useRef<HTMLDivElement>(null);
  const [floatingStyle, setFloatingStyle] = React.useState<React.CSSProperties>(
    getFloatingFallbackStyles()
  );

  React.useEffect(() => {
    const element = document.getElementById(PLAYER_ELEMENT_ID);
    if (!element) return;
    if (element.parentElement === iframeContainerRef.current) return;
    if (!iframeContainerRef.current) return;
    iframeContainerRef.current.appendChild(element);
  }, [hostElement, player]);

  React.useEffect(() => {
    if (videoMode !== "fullscreen") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setVideoMode("floating");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setVideoMode, videoMode]);

  React.useEffect(() => {
    const iframe = player?.getIframe?.();
    if (!iframe) return;
    iframe.style.pointerEvents = "none";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
  }, [player]);

  React.useEffect(() => {
    if (isMobile || videoMode !== "floating") {
      return;
    }

    const updateFromAnchor = () => {
      const anchor = document.querySelector(
        '[data-video-anchor="mini-player-cover"]'
      ) as HTMLElement | null;
      if (!anchor) {
        setFloatingStyle(getFloatingFallbackStyles());
        return;
      }

      const rect = anchor.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        setFloatingStyle(getFloatingFallbackStyles());
        return;
      }

      setFloatingStyle({
        position: "fixed",
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        opacity: "1",
        pointerEvents: "auto",
        borderRadius: "8px",
        boxShadow: "0 24px 60px rgba(0, 0, 0, 0.45)",
        zIndex: "60",
      });
    };

    updateFromAnchor();

    const handleScroll = () => updateFromAnchor();
    const handleResize = () => updateFromAnchor();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    let observer: ResizeObserver | null = null;
    const anchor = document.querySelector(
      '[data-video-anchor="mini-player-cover"]'
    ) as HTMLElement | null;
    if (anchor && "ResizeObserver" in window) {
      observer = new ResizeObserver(() => updateFromAnchor());
      observer.observe(anchor);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      if (observer) observer.disconnect();
    };
  }, [isMobile, videoMode]);

  const style = React.useMemo(() => {
    if (isMobile) {
      return videoMode === "hidden"
        ? hiddenStyles
        : {
            width: "100%",
            height: "100%",
            position: "",
            left: "",
            right: "",
            top: "",
            bottom: "",
            opacity: "",
            pointerEvents: "auto",
            borderRadius: "",
            boxShadow: "",
            zIndex: "",
          };
    }

    if (videoMode === "fullscreen") {
      return fullscreenStyles;
    }

    return videoMode === "floating" ? floatingStyle : hiddenStyles;
  }, [floatingStyle, isMobile, videoMode]);

  if (typeof document === "undefined") return null;

  const handleContainerClick = () => {
    if (!isMobile && videoMode === "floating") {
      setVideoMode("fullscreen");
    } else if (videoMode === "fullscreen") {
      setVideoMode("floating");
    }
  };

  // console.log("rednering youtube player container", videoMode);

  const content = (
    <motion.div
      id={PLAYER_CONTAINER_ID}
      ref={containerRef}
      layout
      className={cn(
        "group",
        videoMode === "fullscreen" &&
          "flex flex-col p-6 bg-black/50 backdrop-blur-xl justify-center"
      )}
      style={style as React.CSSProperties}
      onClick={handleContainerClick}
    >
      {/* Overlay */}
      {videoMode === "floating" && (
        <div className="group-hover:opacity-100 opacity-0 transition-all duration-300 ease-out absolute inset-0 rounded-lg overflow-hidden bg-black/50 flex items-center justify-center z-20">
          {/* Full screen button */}
          <div className="size-10 rounded-full hover:bg-white/10 hover:scale-105 trans active:scale-95 flex items-center justify-center">
            <FullscreenIcon className="size-5 text-white" />
          </div>
        </div>
      )}

      {/* actual iframe container */}
      <motion.div
        layout
        ref={iframeContainerRef}
        className={cn(
          "z-10 group/iframe-container",
          videoMode === "floating" &&
            "h-full w-full relative rounded-lg overflow-hidden",
          videoMode === "fullscreen" &&
            "w-full aspect-video max-w-5xl mx-auto rounded-2xl overflow-hidden relative"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <VideoPlaybackOverlay videoMode={videoMode} />
      </motion.div>

      {videoMode === "fullscreen" && <FullscreenPlayerControls />}
    </motion.div>
  );

  return createPortal(content, hostElement ?? document.body);
}
