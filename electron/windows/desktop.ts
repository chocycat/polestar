import { BrowserWindow, screen } from "electron";
import { join } from "node:path";
import { Window, WINDOWS } from "../windows";

export async function createDesktop() {
  const screens = screen.getAllDisplays();

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const s of screens) {
    const { x, y, width, height } = s.bounds;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  }

  const win = new BrowserWindow({
    title: Window.Desktop,
    transparent: true,
    resizable: false,
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    type: 'desktop',
    webPreferences: {
      preload: join(import.meta.dirname, "preload.js"),
      devTools: true,
      nodeIntegration: true,
      webSecurity: false,
    },
  });

  win.removeMenu();
  win.webContents.openDevTools({ mode: "detach" });
  win.loadURL(process.env.VITE_DEV_SERVER_URL as string + '/desktop');

  WINDOWS[Window.Desktop] = win;

  return win;
}
