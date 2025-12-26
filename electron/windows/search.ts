import { BrowserWindow } from "electron";
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
			devTools: process.env.NODE_ENV === "development",
			webSecurity: false,
			nodeIntegration: true,
		},
	});

	win.center();
	win.removeMenu();
	win.loadURL((process.env.VITE_DEV_SERVER_URL as string) + "/search");

	win.webContents.openDevTools({ mode: "detach" });

	if (process.env.NODE_ENV === "production") {
		win.on("blur", () => {
			win.webContents.send("hide");
		});
	}

	WINDOWS[Window.Search] = win;

	return win;
}
