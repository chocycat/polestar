import { BrowserWindow } from "electron";
import config from "../config";
import { dockWindow } from "../xorg";
import { Window, WINDOWS } from "../windows";
import { join } from "node:path";

export async function createSearch() {
  const win = new BrowserWindow({
    title: Window.Search,
    transparent: true,
    resizable: false,
    width: 600,
    height: 500,
    webPreferences: {
      preload: join(import.meta.dirname, "preload.js"),
      devTools: true,
      nodeIntegration: true,
      webSecurity: false,
    },
  });

  win.center();
  win.removeMenu();
  //win.webContents.openDevTools({ mode: "detach" });
  win.loadURL(process.env.VITE_DEV_SERVER_URL as string + '/search');

  win.on('blur', () => {
    win.webContents.send('hide');
  })

  WINDOWS[Window.Search] = win;

  win.hide();

  return win;
}
