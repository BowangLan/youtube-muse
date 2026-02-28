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
import { AnimatePresence, motion } from "motion/react";
import { usePlayerStore } from "@/lib/store/player-store";
import { VideoPlaybackOverlay } from "./playback-overlay";
import { FullscreenPlayerControls } from "./fullscreen-player-controls";
import { FloatingPlayerControls } from "./floating-player-controls";
import { EASING_EASE_OUT } from "@/lib/styles/animation";

const getFloatingFallbackStyles = (): React.CSSProperties => ({
  position: "fixed",
  right: "1.5rem",
  bottom: "6.5rem",
  left: "",
  top: "",
  width: 360 * 1.2,
  height: 202 * 1.2,
  opacity: "1",
  pointerEvents: "auto",
  borderRadius: "12px",
  boxShadow: "0 4px 8px rgba(255, 255, 255, 0.25)",
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
  right: "1.5rem",
  bottom: "6.5rem",
  left: "",
  top: "",
  width: 360 * 1.2,
  height: 202 * 1.2,
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
  const wheelSeekStateRef = React.useRef({
    accumulatedDelta: 0,
    rafId: 0 as number | null,
  });
  const [floatingStyle, setFloatingStyle] = React.useState<React.CSSProperties>(
    getFloatingFallbackStyles()
  );
  const [customPosition, setCustomPosition] = React.useState<{
    x: number;
    y: number;
  } | null>(null);
  const dragStateRef = React.useRef<{
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
    width: number;
    height: number;
  } | null>(null);
  const didDragRef = React.useRef(false);

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
    if (isMobile || videoMode !== "fullscreen") return;

    const handleWheel = (event: WheelEvent) => {
      if (event.deltaX === 0) return;
      event.preventDefault();

      const dominantDelta = -event.deltaX;
      const deltaMultiplier =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? window.innerHeight
            : 1;

      const state = wheelSeekStateRef.current;
      state.accumulatedDelta += dominantDelta * deltaMultiplier;

      if (state.rafId !== null) return;

      state.rafId = window.requestAnimationFrame(() => {
        const { currentTime, duration, dispatch } = usePlayerStore.getState();
        const secondsPerPixel = 0.05;
        const deltaSeconds = state.accumulatedDelta * secondsPerPixel;
        const nextTime = Math.min(
          duration,
          Math.max(0, currentTime + deltaSeconds)
        );

        if (
          duration > 0 &&
          Math.abs(deltaSeconds) > 0.01 &&
          nextTime !== currentTime
        ) {
          dispatch({ type: "UserSeek", seconds: nextTime });
        }

        state.accumulatedDelta = 0;
        state.rafId = null;
      });
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      const { rafId } = wheelSeekStateRef.current;
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        wheelSeekStateRef.current.rafId = null;
      }
      wheelSeekStateRef.current.accumulatedDelta = 0;
    };
  }, [isMobile, videoMode]);

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
      setFloatingStyle(getFloatingFallbackStyles());
    };

    updateFromAnchor();

    const handleResize = () => updateFromAnchor();
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

    switch (videoMode) {
      case "fullscreen":
        return fullscreenStyles;
      case "floating": {
        const base = { ...floatingStyle };
        if (customPosition) {
          base.left = customPosition.x;
          base.top = customPosition.y;
          base.right = undefined;
          base.bottom = undefined;
        }
        return base;
      }
      case "hidden":
        return hiddenStyles;
      default:
        return {};
    }
  }, [customPosition, floatingStyle, isMobile, videoMode]);

  if (typeof document === "undefined") return null;

  const handleContainerClick = () => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    if (!isMobile && videoMode === "floating") {
      setVideoMode("fullscreen");
    } else if (videoMode === "fullscreen") {
      setVideoMode("floating");
    }
  };

  const handleFloatingPointerDown = (e: React.PointerEvent) => {
    if (isMobile || videoMode !== "floating") return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLeft: rect.left,
      startTop: rect.top,
      width: rect.width,
      height: rect.height,
    };
    didDragRef.current = false;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleFloatingPointerMove = (e: React.PointerEvent) => {
    const state = dragStateRef.current;
    if (!state) return;
    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) didDragRef.current = true;
    const padding = 8;
    const maxX = window.innerWidth - state.width - padding;
    const maxY = window.innerHeight - state.height - padding;
    const x = Math.max(padding, Math.min(maxX, state.startLeft + dx));
    const y = Math.max(padding, Math.min(maxY, state.startTop + dy));
    setCustomPosition({ x, y });
  };

  const handleFloatingPointerUp = (e: React.PointerEvent) => {
    if (dragStateRef.current) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      dragStateRef.current = null;

      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const snapThresholdX = Math.max(80, window.innerWidth * 0.2);
        const snapThresholdY = Math.max(80, window.innerHeight * 0.1);
        const padding = 16;
        let x = rect.left;
        let y = rect.top;

        if (rect.left < snapThresholdX) x = padding;
        if (window.innerWidth - rect.right < snapThresholdX) {
          x = window.innerWidth - rect.width - padding;
        }
        if (rect.top < snapThresholdY) y = padding;
        if (window.innerHeight - rect.bottom < snapThresholdY) {
          y = window.innerHeight - rect.height - padding;
        }

        setCustomPosition({ x, y });
      }
    }
  };

  const content = (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        id={PLAYER_CONTAINER_ID}
        ref={containerRef}
        layout
        transition={dragStateRef.current ? {
          duration: 0,
          ease: "easeOut"
        } : {
          duration: 0.5,
          ease: EASING_EASE_OUT,
        }}
        className={cn(
          "group",
          videoMode === "fullscreen" &&
          "flex flex-col justify-start p-6",
          !isMobile &&
          videoMode === "floating" &&
          "cursor-grab active:cursor-grabbing"
        )}
        style={style as React.CSSProperties}
        onClick={handleContainerClick}
        onPointerDown={
          !isMobile && videoMode === "floating"
            ? handleFloatingPointerDown
            : undefined
        }
        onPointerMove={
          !isMobile && videoMode === "floating"
            ? handleFloatingPointerMove
            : undefined
        }
        onPointerUp={
          !isMobile && videoMode === "floating"
            ? handleFloatingPointerUp
            : undefined
        }
      >
        {videoMode === "floating" && <FloatingPlayerControls />}

        {/* actual iframe container */}
        <div
          // layout
          ref={iframeContainerRef}
          // transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn(
            "z-10 group/iframe-container",
            videoMode === "floating" &&
            "h-full w-full relative rounded-lg overflow-hidden",
            videoMode === "fullscreen" &&
            "w-full aspect-video mx-auto mt-8 max-w-6xl rounded-2xl overflow-hidden relative"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <VideoPlaybackOverlay videoMode={videoMode} />
        </div>

        {videoMode === "fullscreen" && !isMobile && <FullscreenPlayerControls />}
      </motion.div>

      {videoMode === "fullscreen" && (
        <AnimatePresence>
          <motion.div
            key="fullscreen-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute inset-0 z-70 bg-black/80 backdrop-blur-xl pointer-events-none"
          >
          </motion.div>
        </AnimatePresence>
      )}
    </>
  );

  return createPortal(content, hostElement ?? document.body);
}
