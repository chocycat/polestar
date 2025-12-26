import { BrowserWindow } from "electron";
import { spawn } from "node:child_process";

export let available = true;

function setup() {
  const daemon = spawn("cbd");
  let buf = "";

  daemon.stdout.on("data", (data) => {
    buf += data.toString();

    const lines = buf.split("\n");
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
}

try {
  setup();
} catch {
  available = false;
}
