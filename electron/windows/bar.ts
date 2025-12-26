import { BrowserWindow, screen } from "electron";
import { dockWindow } from "../xorg";
import { Window, WINDOWS } from "../windows";
import { join } from "node:path";

export async function createBar() {
	const s = screen.getPrimaryDisplay();
	const bar = new BrowserWindow({
		title: Window.Bar,
		transparent: true,
		resizable: false,
		x: 0,
		y: 0,
		width: s.bounds.width,
		height: 75,
		minWidth: s.bounds.width,
		minHeight: 75,
		webPreferences: {
			preload: join(import.meta.dirname, "preload.js"),
			devTools: process.env.NODE_ENV === "development",
			webSecurity: false,
			nodeIntegration: true,
		},
	});

	bar.removeMenu();
	bar.loadURL((process.env.VITE_DEV_SERVER_URL as string) + "/bar");

	//bar.webContents.openDevTools({ mode: "detach" });

	WINDOWS[Window.Bar] = bar;

	dockWindow(Window.Bar, true);
	bar.hide();

	return bar;
}
