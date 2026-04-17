import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { app, BrowserWindow, globalShortcut, ipcMain, screen } from "electron";
import { DESKTOP_IPC_CHANNELS } from "./ipc";

const APP_DISPLAY_NAME = "YouTube Muse";

let nextServerProcess: ChildProcess | null = null;
let mainWindow: BrowserWindow | null = null;
let miniPlayerWindow: BrowserWindow | null = null;
let isQuitting = false;
let latestPlayerState: unknown = null;
let mainWindowNormalBounds: Electron.Rectangle | null = null;
let isMainWindowCompact = false;

const MAIN_WINDOW_COMPACT = { width: 480, height: 400 };
const ANIMATION_DURATION_MS = 300;

function animateWindowBounds(
  win: BrowserWindow,
  target: { width: number; height: number; x?: number; y?: number },
  duration = ANIMATION_DURATION_MS,
) {
  const current = win.getBounds();
  const bounds = {
    x: target.x ?? current.x,
    y: target.y ?? current.y,
    width: target.width,
    height: target.height,
  };

  if (process.platform === "darwin") {
    win.setBounds(bounds, true);
    return;
  }

  const startTime = Date.now();
  const tick = setInterval(() => {
    const t = Math.min((Date.now() - startTime) / duration, 1);
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    win.setBounds({
      x: Math.round(current.x + (bounds.x - current.x) * ease),
      y: Math.round(current.y + (bounds.y - current.y) * ease),
      width: Math.round(current.width + (bounds.width - current.width) * ease),
      height: Math.round(current.height + (bounds.height - current.height) * ease),
    });
    if (t >= 1) clearInterval(tick);
  }, 16);
}

function findOpenPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close(() => reject(new Error("Failed to find an open port.")));
        return;
      }

      const { port } = address;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(port);
      });
    });
  });
}

function waitForServer(url: string, timeoutMs = 15_000): Promise<void> {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const attempt = () => {
      fetch(url)
        .then(() => resolve())
        .catch((error: unknown) => {
          if (Date.now() - startedAt > timeoutMs) {
            reject(error);
            return;
          }

          setTimeout(attempt, 250);
        });
    };

    attempt();
  });
}

function getStandaloneEntrypoint(): string | undefined {
  const candidates = [
    path.join(
      process.resourcesPath,
      "app",
      "apps",
      "web",
      ".next",
      "standalone",
      "apps",
      "web",
      "server.js",
    ),
    path.join(process.resourcesPath, "app", "apps", "web", ".next", "standalone", "server.js"),
    path.join(__dirname, "..", "web", ".next", "standalone", "apps", "web", "server.js"),
    path.join(__dirname, "..", "web", ".next", "standalone", "server.js"),
  ];

  return candidates.find((candidate) => existsSync(candidate));
}

async function ensureRendererUrl(): Promise<string> {
  if (process.env.ELECTRON_RENDERER_URL) {
    return process.env.ELECTRON_RENDERER_URL;
  }

  const standaloneEntrypoint = getStandaloneEntrypoint();
  if (!standaloneEntrypoint) {
    throw new Error("Built Next standalone server not found. Run `bun run build` first.");
  }

  const port = await findOpenPort();
  const url = `http://127.0.0.1:${port}`;

  const serverProcess = spawn(process.execPath, [standaloneEntrypoint], {
    cwd: path.dirname(standaloneEntrypoint),
    env: {
      ...process.env,
      HOSTNAME: "127.0.0.1",
      PORT: String(port),
      NODE_ENV: "production",
    },
    stdio: "inherit",
  });

  serverProcess.once("exit", () => {
    nextServerProcess = null;
  });
  nextServerProcess = serverProcess;

  await waitForServer(url);
  return url;
}

async function createMainWindow(): Promise<void> {
  const rendererUrl = await ensureRendererUrl();

  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 760,
    backgroundColor: "#09090b",
    title: APP_DISPLAY_NAME,
    frame: false,
    transparent: true,
    autoHideMenuBar: true,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 24, y: 30 },
    webPreferences: {
      preload: path.resolve(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      // Sandboxed preload cannot reliably expose the bridge in all Electron setups; keep nodeIntegration false.
      sandbox: false,
    },
  });

  await window.loadURL(rendererUrl);
  mainWindow = window;

  window.on("closed", () => {
    mainWindow = null;
    if (miniPlayerWindow && !miniPlayerWindow.isDestroyed()) {
      miniPlayerWindow.destroy();
      miniPlayerWindow = null;
    }
  });
}

async function createMiniPlayerWindow(): Promise<BrowserWindow> {
  if (miniPlayerWindow && !miniPlayerWindow.isDestroyed()) {
    return miniPlayerWindow;
  }

  const rendererUrl = await ensureRendererUrl();
  const window = new BrowserWindow({
    width: 420,
    height: 82,
    minWidth: 320,
    minHeight: 82,
    maxHeight: 82,
    maxWidth: 640,
    show: false,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: true,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    backgroundColor: "#00000000",
    title: "YouTube Muse Mini Player",
    webPreferences: {
      preload: path.resolve(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  await window.loadURL(`${rendererUrl}/desktop/mini-player`);

  window.on("close", (event) => {
    if (isQuitting || mainWindow === null) {
      return;
    }
    event.preventDefault();
    window.hide();
    broadcastMiniPlayerVisibility();
  });

  window.on("show", () => broadcastMiniPlayerVisibility());
  window.on("hide", () => broadcastMiniPlayerVisibility());
  window.on("closed", () => {
    miniPlayerWindow = null;
    broadcastMiniPlayerVisibility();
  });

  miniPlayerWindow = window;
  return window;
}

function broadcastMiniPlayerVisibility() {
  const visible = !!miniPlayerWindow && !miniPlayerWindow.isDestroyed() && miniPlayerWindow.isVisible();
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) {
      window.webContents.send(
        DESKTOP_IPC_CHANNELS.miniPlayerVisibilityChanged,
        visible,
      );
    }
  }
}

function broadcastMainWindowCompact() {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(DESKTOP_IPC_CHANNELS.mainWindowCompactChanged, isMainWindowCompact);
    }
  }
}

function toggleMainWindowCompact() {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  if (!isMainWindowCompact) {
    mainWindowNormalBounds = mainWindow.getBounds();
    const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
    mainWindow.setMinimumSize(MAIN_WINDOW_COMPACT.width, MAIN_WINDOW_COMPACT.height);
    animateWindowBounds(mainWindow, {
      ...MAIN_WINDOW_COMPACT,
      x: sw - MAIN_WINDOW_COMPACT.width - 20,
      y: sh - MAIN_WINDOW_COMPACT.height - 20,
    });
    isMainWindowCompact = true;
  } else {
    if (mainWindowNormalBounds) {
      const restored = mainWindowNormalBounds;
      mainWindowNormalBounds = null;
      animateWindowBounds(mainWindow, restored);
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.setMinimumSize(1100, 760);
        }
      }, ANIMATION_DURATION_MS + 50);
    }
    isMainWindowCompact = false;
  }

  broadcastMainWindowCompact();
}

async function showMiniPlayerWindow() {
  const window = await createMiniPlayerWindow();
  if (!window.isVisible()) {
    window.show();
  }
  window.focus();
  if (latestPlayerState !== null) {
    window.webContents.send(DESKTOP_IPC_CHANNELS.playerStateUpdated, latestPlayerState);
  }
  broadcastMiniPlayerVisibility();
}

function hideMiniPlayerWindow() {
  if (!miniPlayerWindow || miniPlayerWindow.isDestroyed()) {
    return;
  }
  miniPlayerWindow.hide();
  broadcastMiniPlayerVisibility();
}

function toggleMiniPlayerWindow() {
  if (!miniPlayerWindow || miniPlayerWindow.isDestroyed() || !miniPlayerWindow.isVisible()) {
    void showMiniPlayerWindow();
    return;
  }
  hideMiniPlayerWindow();
}

function registerIpcHandlers() {
  ipcMain.handle(DESKTOP_IPC_CHANNELS.miniPlayerOpen, async () => {
    await showMiniPlayerWindow();
  });

  ipcMain.handle(DESKTOP_IPC_CHANNELS.miniPlayerClose, () => {
    hideMiniPlayerWindow();
  });

  ipcMain.handle(DESKTOP_IPC_CHANNELS.miniPlayerToggle, () => {
    toggleMiniPlayerWindow();
  });

  ipcMain.handle(DESKTOP_IPC_CHANNELS.miniPlayerIsVisible, () => {
    return !!miniPlayerWindow && !miniPlayerWindow.isDestroyed() && miniPlayerWindow.isVisible();
  });

  ipcMain.handle(DESKTOP_IPC_CHANNELS.mainWindowCompactToggle, () => {
    toggleMainWindowCompact();
  });

  ipcMain.handle(DESKTOP_IPC_CHANNELS.mainWindowIsCompact, () => isMainWindowCompact);

  ipcMain.on(DESKTOP_IPC_CHANNELS.playerStatePublish, (_event, state) => {
    latestPlayerState = state;
    if (miniPlayerWindow && !miniPlayerWindow.isDestroyed()) {
      miniPlayerWindow.webContents.send(DESKTOP_IPC_CHANNELS.playerStateUpdated, state);
    }
  });

  ipcMain.handle(DESKTOP_IPC_CHANNELS.playerStateGet, () => latestPlayerState);

  ipcMain.on(DESKTOP_IPC_CHANNELS.playerCommandSend, (_event, command) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(DESKTOP_IPC_CHANNELS.playerCommandReceived, command);
    }
  });
}

app.whenReady().then(async () => {
  registerIpcHandlers();
  await createMainWindow();

  globalShortcut.register("CommandOrControl+M", () => {
    toggleMainWindowCompact();
  });

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  isQuitting = true;
  globalShortcut.unregisterAll();
  if (nextServerProcess) {
    nextServerProcess.kill();
    nextServerProcess = null;
  }
});
