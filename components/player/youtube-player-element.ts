"use client";

let cachedElement: HTMLDivElement | null = null;

export const setYouTubePlayerElement = (element: HTMLElement | null) => {
  if (!element) return;
  if (element instanceof HTMLDivElement) {
    cachedElement = element;
    return;
  }

  if (element instanceof HTMLIFrameElement) {
    const parent = element.parentElement;
    if (parent && parent instanceof HTMLDivElement) {
      cachedElement = parent;
    }
  }
};

export const ensureYouTubePlayerElement = () => {
  if (typeof document === "undefined") return null;

  if (cachedElement && document.body.contains(cachedElement)) {
    return cachedElement;
  }

  const existing = document.getElementById("youtube-player");
  if (existing && existing instanceof HTMLDivElement) {
    cachedElement = existing;
    return cachedElement;
  }

  if (existing && existing instanceof HTMLIFrameElement) {
    const parent = existing.parentElement;
    if (parent && parent instanceof HTMLDivElement) {
      cachedElement = parent;
      return cachedElement;
    }
  }

  const element = document.createElement("div");
  element.id = "youtube-player";
  element.className = "h-full w-full";
  document.body.appendChild(element);
  cachedElement = element;
  return element;
};

export type YouTubePlayerMode = "audio" | "video";

export const moveYouTubePlayerToHost = (
  host: HTMLElement | null,
  mode: YouTubePlayerMode
) => {
  if (!host) return;
  const element = ensureYouTubePlayerElement();
  if (!element) return;

  // Check if element is already in the correct host
  if (element.parentElement === host) {
    // Already in the right place, just update styles
    applyPlayerStyles(element, mode);
    return;
  }

  // Check for circular hierarchy (element contains host)
  if (element.contains(host)) {
    console.warn("Cannot move YouTube player: circular DOM hierarchy detected");
    return;
  }

  // Move element to new host
  try {
    host.appendChild(element);
    applyPlayerStyles(element, mode);
  } catch (error) {
    console.error("Failed to move YouTube player:", error);
  }
};

// Helper function to apply styles based on mode
function applyPlayerStyles(element: HTMLDivElement, mode: YouTubePlayerMode) {
  // Reset inline styles
  element.style.position = "";
  element.style.left = "";
  element.style.width = "";
  element.style.height = "";

  if (mode === "audio") {
    element.style.position = "absolute";
    element.style.left = "-9999px";
    element.style.width = "1px";
    element.style.height = "1px";
  } else {
    element.style.width = "100%";
    element.style.height = "100%";
  }
}
