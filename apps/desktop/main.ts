import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { app, BrowserWindow } from "electron";

let nextServerProcess: ChildProcess | null = null;

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
    title: "YouTube Muse",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  await window.loadURL(rendererUrl);
}

app.whenReady().then(async () => {
  await createMainWindow();

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
  if (nextServerProcess) {
    nextServerProcess.kill();
    nextServerProcess = null;
  }
});
