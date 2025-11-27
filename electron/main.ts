import { app } from "electron";
import { createBar } from "./windows/bar";
import { createSearch } from "./windows/search";
import { registerEvents, updateAudioStats } from "./events";
import { startAwesomeIpc } from "./ipc/awesome";
import { startIpc } from './ipc/self';
import "./notification";
import "./clipboard";

function main() {
  app.whenReady().then(async () => {
    registerEvents();

    const bar = await createBar();
    const search = await createSearch();

    startAwesomeIpc();
    startIpc();
  });
}

main();
