export type DesktopWindowRole =
  | "browser"
  | "desktop-main"
  | "desktop-mini-player";

export interface DesktopPlayerTrack {
  id: string;
  title: string;
  author: string;
  authorUrl: string;
  thumbnailUrl: string;
}

export interface DesktopPlayerSnapshot {
  track: DesktopPlayerTrack | null;
  isPlaying: boolean;
  isLoadingNewVideo: boolean;
  apiReady: boolean;
  pendingPlayState: boolean | null;
  currentTime: number;
  duration: number;
  volume: number;
  canPlayNext: boolean;
  canPlayPrevious: boolean;
}

export type DesktopPlayerCommand =
  | { type: "toggle-play" }
  | { type: "play" }
  | { type: "pause" }
  | { type: "next" }
  | { type: "previous" }
  | { type: "seek"; seconds: number }
  | { type: "set-volume"; volume: number };

/** Injected only by Electron preload (`contextBridge`); presence on `window` means desktop app. */
export interface YouTubeMuseDesktopBridge {
  miniPlayer: {
    open: () => Promise<void>;
    close: () => Promise<void>;
    toggle: () => Promise<void>;
    isVisible: () => Promise<boolean>;
    onVisibilityChange: (callback: (visible: boolean) => void) => () => void;
  };
  mainWindow: {
    toggleCompact: () => Promise<void>;
    isCompact: () => Promise<boolean>;
    onCompactChange: (callback: (isCompact: boolean) => void) => () => void;
  };
  player: {
    publishState: (state: DesktopPlayerSnapshot) => void;
    getState: () => Promise<DesktopPlayerSnapshot | null>;
    sendCommand: (command: DesktopPlayerCommand) => void;
    onState: (callback: (state: DesktopPlayerSnapshot) => void) => () => void;
    onCommand: (callback: (command: DesktopPlayerCommand) => void) => () => void;
  };
}

