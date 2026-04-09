import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("youtubeMuseDesktop", {
  platform: process.platform,
});
