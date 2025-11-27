import { BrowserWindow } from "electron";
import { spawn } from "node:child_process";

const daemon = spawn("cbd");
let buf = "";

daemon.stdout.on("data", (data) => {
  buf += data.toString();

  let lines = buf.split("\n");
  buf = lines.pop() || "";

  lines.forEach((line: string) => {
    try {
      const data = JSON.parse(line.trim());

      BrowserWindow.getAllWindows().forEach((w) =>
        w.webContents.send("clipboard", data)
      );
    } catch (e) {
      console.error("failed to parse notification:", e);
    }
  });
});
