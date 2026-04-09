import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(desktopRoot, "..", "..");
const webRoot = path.resolve(repoRoot, "apps", "web");
const distRoot = path.resolve(desktopRoot, "dist");
const bundledAppRoot = path.join(distRoot, "app");
const bundledWebRoot = path.join(distRoot, "web");

const requiredPaths = [
  path.join(desktopRoot, ".electron-build", "main.js"),
  path.join(desktopRoot, ".electron-build", "preload.js"),
  path.join(webRoot, ".next", "standalone"),
  path.join(webRoot, ".next", "static"),
  path.join(webRoot, "public"),
];

for (const requiredPath of requiredPaths) {
  if (!existsSync(requiredPath)) {
    throw new Error(`Missing build artifact: ${requiredPath}. Run the web build first.`);
  }
}

rmSync(distRoot, { recursive: true, force: true });
mkdirSync(bundledAppRoot, { recursive: true });
mkdirSync(bundledWebRoot, { recursive: true });

cpSync(path.join(desktopRoot, ".electron-build", "main.js"), path.join(bundledAppRoot, "main.js"));
cpSync(
  path.join(desktopRoot, ".electron-build", "preload.js"),
  path.join(bundledAppRoot, "preload.js"),
);
cpSync(
  path.join(webRoot, ".next", "standalone"),
  path.join(bundledWebRoot, ".next", "standalone"),
  { recursive: true },
);
cpSync(path.join(webRoot, ".next", "static"), path.join(bundledWebRoot, ".next", "static"), {
  recursive: true,
});
cpSync(path.join(webRoot, "public"), path.join(bundledWebRoot, "public"), { recursive: true });

writeFileSync(
  path.join(bundledAppRoot, "package.json"),
  JSON.stringify(
    {
      name: "@youtube-muse/desktop-bundle",
      private: true,
      main: "main.js",
    },
    null,
    2,
  ),
);

writeFileSync(
  path.join(distRoot, "README.txt"),
  [
    "Desktop bundle created.",
    "",
    "From apps/desktop, run:",
    "  bunx electron dist/app",
    "",
    "The bundle includes the built Next standalone server under dist/web.",
  ].join("\n"),
);

console.log(`Bundled desktop app into ${distRoot}`);
