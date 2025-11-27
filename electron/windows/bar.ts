import { BrowserWindow } from "electron";
import config from "../config";
import { dockWindow } from "../xorg";
import { Window, WINDOWS } from "../windows";
import { join } from "node:path";

export async function createBar() {
  const bar = new BrowserWindow({
    title: Window.Bar,
    transparent: true,
    resizable: false,
    x: 0,
    y: 0,
    width: config.bar.width,
    height: config.bar.height,
    minWidth: config.bar.width,
    minHeight: config.bar.height,
    webPreferences: {
      preload: join(import.meta.dirname, "preload.js"),
      devTools: true,
      nodeIntegration: true,
      webSecurity: false,
    },
  });

  bar.removeMenu();
  //bar.webContents.openDevTools({ mode: "detach" });
  bar.loadURL(process.env.VITE_DEV_SERVER_URL as string + '/bar');

  WINDOWS[Window.Bar] = bar;

  dockWindow(Window.Bar, true);
  bar.hide();

  return bar;
}
