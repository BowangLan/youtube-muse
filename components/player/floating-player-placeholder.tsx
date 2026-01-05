"use client";

import * as React from "react";
import { useYouTubePlayerInstanceStore } from "@/lib/store/youtube-player-instance-store";
import { useIsMobile } from "@/hooks/use-mobile";

export function FloatingPlayerPlaceholder() {
  const videoMode = useYouTubePlayerInstanceStore((state) => state.videoMode);
  const isMobile = useIsMobile();
  const [dimensions, setDimensions] = React.useState({
    width: 360,
    height: 202,
  });

  React.useEffect(() => {
    if (isMobile || videoMode !== "floating") {
      return;
    }

    const updateDimensions = () => {
      const anchor = document.querySelector(
        '[data-video-anchor="mini-player-cover"]'
      ) as HTMLElement | null;

      if (anchor) {
        const rect = anchor.getBoundingClientRect();
        if (rect.width && rect.height) {
          setDimensions({
            width: rect.width,
            height: rect.height,
          });
        }
      }
    };

    updateDimensions();

    const handleScroll = () => updateDimensions();
    const handleResize = () => updateDimensions();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    let observer: ResizeObserver | null = null;
    const anchor = document.querySelector(
      '[data-video-anchor="mini-player-cover"]'
    ) as HTMLElement | null;

    if (anchor && "ResizeObserver" in window) {
      observer = new ResizeObserver(() => updateDimensions());
      observer.observe(anchor);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      if (observer) observer.disconnect();
    };
  }, [isMobile, videoMode]);

  // Only show placeholder when video mode is "floating" and not on mobile
  if (videoMode !== "floating" || isMobile) {
    return null;
  }

  return (
    <div
      style={{
        width: dimensions.width,
        height: dimensions.height,
      }}
    ></div>
  );
}
