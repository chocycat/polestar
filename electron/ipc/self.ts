import { existsSync, unlinkSync } from "fs";
import { createServer, Server } from "net";
import readline from "readline";
import { Window, WINDOWS } from "../windows";
import { screen } from 'electron';

const PATH = "/tmp/polestar.sock";
let server: Server;

export function startIpc() {
  if (existsSync(PATH)) unlinkSync(PATH);

  server = createServer((s) => {
    const rl = readline.createInterface({ input: s, crlfDelay: Infinity });

    rl.on("line", (l) => {
      if (l.trim()) {
        if (l.startsWith('show-bar')) {
          const screenArg = parseInt(l.split('/')[1]);
          const bar = WINDOWS[Window.Bar];

          const displays = screen.getAllDisplays();
          const scr = displays[screenArg];
          if (scr) {
            if (!bar.isVisible()) {
              bar.webContents.send("show");
              bar.webContents.send("set-screen", screenArg);
              bar.setPosition(scr.bounds.x, scr.bounds.y);
              bar.show();
            }
          }

          return;
        }

        switch(l) {
          case 'toggle-search': {
            const search = WINDOWS[Window.Search];
            if (!search.isVisible()) {
              search.webContents.send("show");
              search.show();
            } else {
              search.webContents.send("hide");
            }
            break;
          }
        }
      }
    });
  });

  server.listen(PATH);
}