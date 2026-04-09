const { app, BrowserWindow } = require("electron");
const { existsSync } = require("node:fs");
const { spawn } = require("node:child_process");
const net = require("node:net");
const path = require("node:path");

let nextServerProcess = null;

function findOpenPort() {
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

function waitForServer(url, timeoutMs = 15000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const attempt = () => {
      fetch(url)
        .then(() => resolve())
        .catch((error) => {
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

function getStandaloneEntrypoint() {
  const candidates = [
    path.join(process.resourcesPath, "app", "apps", "web", ".next", "standalone", "apps", "web", "server.js"),
    path.join(process.resourcesPath, "app", "apps", "web", ".next", "standalone", "server.js"),
    path.join(__dirname, "..", "web", ".next", "standalone", "apps", "web", "server.js"),
    path.join(__dirname, "..", "web", ".next", "standalone", "server.js"),
  ];

  return candidates.find((candidate) => existsSync(candidate));
}

async function ensureRendererUrl() {
  if (process.env.ELECTRON_RENDERER_URL) {
    return process.env.ELECTRON_RENDERER_URL;
  }

  const standaloneEntrypoint = getStandaloneEntrypoint();
  if (!standaloneEntrypoint) {
    throw new Error("Built Next standalone server not found. Run `bun run build` first.");
  }

  const port = await findOpenPort();
  const url = `http://127.0.0.1:${port}`;

  nextServerProcess = spawn(process.execPath, [standaloneEntrypoint], {
    cwd: path.dirname(standaloneEntrypoint),
    env: {
      ...process.env,
      HOSTNAME: "127.0.0.1",
      PORT: String(port),
      NODE_ENV: "production",
    },
    stdio: "inherit",
  });

  nextServerProcess.once("exit", () => {
    nextServerProcess = null;
  });

  await waitForServer(url);
  return url;
}

async function createMainWindow() {
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
