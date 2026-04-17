"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import type { DesktopWindowRole } from "@/lib/desktop/types";
import { isDesktopBridgePresent, isElectronUserAgent } from "@/lib/desktop/runtime";

interface DesktopRuntimeContextValue {
  /** Electron shell (UA) or preload bridge — use for routing / “am I in the desktop app?”. */
  isDesktopApp: boolean;
  /** Preload injected `window.youtubeMuseDesktop` — required for IPC (mini player, player sync). */
  hasDesktopBridge: boolean;
  windowRole: DesktopWindowRole;
  miniPlayerVisible: boolean;
  openMiniPlayer: () => Promise<void>;
  closeMiniPlayer: () => Promise<void>;
  toggleMiniPlayer: () => Promise<void>;
  isCompact: boolean;
  toggleCompact: () => Promise<void>;
}

const DesktopRuntimeContext =
  React.createContext<DesktopRuntimeContextValue | null>(null);

const noopAsync = async () => {};

export function DesktopRuntimeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [hasDesktopBridge, setHasDesktopBridge] = React.useState(false);
  const [electronShell, setElectronShell] = React.useState(false);
  const [miniPlayerVisible, setMiniPlayerVisible] = React.useState(false);
  const [isCompact, setIsCompact] = React.useState(false);

  React.useLayoutEffect(() => {
    setHasDesktopBridge(isDesktopBridgePresent());
    setElectronShell(isElectronUserAgent());
  }, []);

  const isDesktopApp = hasDesktopBridge || electronShell;

  const windowRole: DesktopWindowRole = !isDesktopApp
    ? "browser"
    : pathname.startsWith("/desktop/mini-player")
      ? "desktop-mini-player"
      : "desktop-main";

  React.useEffect(() => {
    if (!hasDesktopBridge) {
      setMiniPlayerVisible(false);
      return;
    }

    void window.youtubeMuseDesktop?.miniPlayer
      .isVisible()
      .then((visible) => setMiniPlayerVisible(visible));

    return window.youtubeMuseDesktop?.miniPlayer.onVisibilityChange((visible) => {
      setMiniPlayerVisible(visible);
    });
  }, [hasDesktopBridge]);

  React.useEffect(() => {
    if (!hasDesktopBridge) {
      setIsCompact(false);
      return;
    }
    void window.youtubeMuseDesktop?.mainWindow
      .isCompact()
      .then((compact) => setIsCompact(compact));
    return window.youtubeMuseDesktop?.mainWindow.onCompactChange((compact) => {
      setIsCompact(compact);
    });
  }, [hasDesktopBridge]);

  const value = React.useMemo<DesktopRuntimeContextValue>(
    () => ({
      isDesktopApp,
      hasDesktopBridge,
      windowRole,
      miniPlayerVisible,
      openMiniPlayer: hasDesktopBridge
        ? () => window.youtubeMuseDesktop!.miniPlayer.open()
        : noopAsync,
      closeMiniPlayer: hasDesktopBridge
        ? () => window.youtubeMuseDesktop!.miniPlayer.close()
        : noopAsync,
      toggleMiniPlayer: hasDesktopBridge
        ? () => window.youtubeMuseDesktop!.miniPlayer.toggle()
        : noopAsync,
      isCompact,
      toggleCompact: hasDesktopBridge
        ? () => window.youtubeMuseDesktop!.mainWindow.toggleCompact()
        : noopAsync,
    }),
    [isDesktopApp, hasDesktopBridge, miniPlayerVisible, isCompact, windowRole],
  );

  return (
    <DesktopRuntimeContext.Provider value={value}>
      {children}
    </DesktopRuntimeContext.Provider>
  );
}

export function useDesktopRuntime() {
  const context = React.useContext(DesktopRuntimeContext);
  if (!context) {
    throw new Error(
      "useDesktopRuntime must be used within a DesktopRuntimeProvider",
    );
  }
  return context;
}
