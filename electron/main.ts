import { app } from "electron";
import { createBar } from "./windows/bar";
import { createSearch } from "./windows/search";
import { createDesktop } from "./windows/desktop";
import { registerEvents } from "./events";
import { startAwesomeIpc } from "./ipc/awesome";
import { startIpc } from "./ipc/self";
import config from "../config";
import "./notification";
import "./clipboard";

function main() {
	app.whenReady().then(async () => {
		registerEvents();

		if (config.desktop.enabled) await createDesktop();
		if (config.bar.enabled) await createBar();
		if (config.search.enabled) await createSearch();

		startAwesomeIpc();
		startIpc();
	});
}

main();
