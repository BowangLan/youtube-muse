/** True when Electron preload exposed `window.youtubeMuseDesktop` (IPC available). */
export function isDesktopBridgePresent(): boolean {
  return typeof window !== "undefined" && window.youtubeMuseDesktop != null;
}

/**
 * True when the renderer is Electron’s Chromium (not a normal browser tab).
 * Use together with {@link isDesktopBridgePresent}: shell vs preload/IPC readiness.
 */
export function isElectronUserAgent(): boolean {
  if (typeof navigator === "undefined") return false;
  return /\bElectron\/\d+\b/i.test(navigator.userAgent);
}
