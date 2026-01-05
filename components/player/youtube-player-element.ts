"use client";

export const PLAYER_ELEMENT_ID = "youtube-player";
export const PLAYER_CONTAINER_ID = "youtube-player-container";

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

  const existing = document.getElementById(PLAYER_ELEMENT_ID);
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
  element.id = PLAYER_ELEMENT_ID;
  element.className = "h-full w-full";
  document.body.appendChild(element);
  cachedElement = element;
  return element;
};
