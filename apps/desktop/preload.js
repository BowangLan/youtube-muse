const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("youtubeMuseDesktop", {
  platform: process.platform,
});
