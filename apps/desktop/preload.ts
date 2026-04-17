import { contextBridge, ipcRenderer } from "electron";
import { DESKTOP_IPC_CHANNELS } from "./ipc";

try {
  contextBridge.exposeInMainWorld("youtubeMuseDesktop", {
    miniPlayer: {
      open: () => ipcRenderer.invoke(DESKTOP_IPC_CHANNELS.miniPlayerOpen),
      close: () => ipcRenderer.invoke(DESKTOP_IPC_CHANNELS.miniPlayerClose),
      toggle: () => ipcRenderer.invoke(DESKTOP_IPC_CHANNELS.miniPlayerToggle),
      isVisible: () => ipcRenderer.invoke(DESKTOP_IPC_CHANNELS.miniPlayerIsVisible),
      onVisibilityChange: (callback: (visible: boolean) => void) => {
        const listener = (_event: unknown, visible: boolean) => callback(visible);
        ipcRenderer.on(DESKTOP_IPC_CHANNELS.miniPlayerVisibilityChanged, listener);
        return () => {
          ipcRenderer.removeListener(
            DESKTOP_IPC_CHANNELS.miniPlayerVisibilityChanged,
            listener,
          );
        };
      },
    },
    mainWindow: {
      toggleCompact: () => ipcRenderer.invoke(DESKTOP_IPC_CHANNELS.mainWindowCompactToggle),
      isCompact: () => ipcRenderer.invoke(DESKTOP_IPC_CHANNELS.mainWindowIsCompact),
      onCompactChange: (callback: (isCompact: boolean) => void) => {
        const listener = (_event: unknown, isCompact: boolean) => callback(isCompact);
        ipcRenderer.on(DESKTOP_IPC_CHANNELS.mainWindowCompactChanged, listener);
        return () => {
          ipcRenderer.removeListener(DESKTOP_IPC_CHANNELS.mainWindowCompactChanged, listener);
        };
      },
    },
    player: {
      publishState: (state: unknown) =>
        ipcRenderer.send(DESKTOP_IPC_CHANNELS.playerStatePublish, state),
      getState: () => ipcRenderer.invoke(DESKTOP_IPC_CHANNELS.playerStateGet),
      sendCommand: (command: unknown) =>
        ipcRenderer.send(DESKTOP_IPC_CHANNELS.playerCommandSend, command),
      onState: (callback: (state: unknown) => void) => {
        const listener = (_event: unknown, state: unknown) => callback(state);
        ipcRenderer.on(DESKTOP_IPC_CHANNELS.playerStateUpdated, listener);
        return () => {
          ipcRenderer.removeListener(DESKTOP_IPC_CHANNELS.playerStateUpdated, listener);
        };
      },
      onCommand: (callback: (command: unknown) => void) => {
        const listener = (_event: unknown, command: unknown) => callback(command);
        ipcRenderer.on(DESKTOP_IPC_CHANNELS.playerCommandReceived, listener);
        return () => {
          ipcRenderer.removeListener(
            DESKTOP_IPC_CHANNELS.playerCommandReceived,
            listener,
          );
        };
      },
    },
  });
} catch (error) {
  console.error("[youtube-muse] preload: failed to expose youtubeMuseDesktop", error);
}
