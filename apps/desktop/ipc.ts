export const DESKTOP_IPC_CHANNELS = {
  miniPlayerOpen: "desktop:mini-player-open",
  miniPlayerClose: "desktop:mini-player-close",
  miniPlayerToggle: "desktop:mini-player-toggle",
  miniPlayerIsVisible: "desktop:mini-player-is-visible",
  miniPlayerVisibilityChanged: "desktop:mini-player-visibility-changed",
  playerStatePublish: "desktop:player-state-publish",
  playerStateUpdated: "desktop:player-state-updated",
  playerStateGet: "desktop:player-state-get",
  playerCommandSend: "desktop:player-command-send",
  playerCommandReceived: "desktop:player-command-received",
} as const;

