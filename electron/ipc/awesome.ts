import { createConnection } from "node:net";
import { WINDOWS } from "../windows";
import { BrowserWindow } from "electron";

export function startAwesomeIpc() {
  const client = createConnection("/tmp/awesome-ipc.sock");
  let buf = "";

  client.on("data", (data) => {
    buf += data.toString();

    let lines = buf.split("\n");
    buf = lines.pop() || "";

    lines.forEach((line) => {
      if (line.trim()) {
        BrowserWindow.getAllWindows().forEach((w) => {
          w.webContents.send("awesome-state", JSON.parse(line));
        });
      }
    });
  });
}
