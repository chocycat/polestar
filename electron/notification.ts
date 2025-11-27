import { BrowserWindow } from "electron";
import { spawn } from "node:child_process";

const daemon = spawn("./scripts/notifications.rb");
let buf = "";

daemon.stdout.on("data", (data) => {
  buf += data.toString();

  let lines = buf.split("\n");
  buf = lines.pop() || "";

  lines.forEach((line: string) => {
    try {
      const notif = JSON.parse(line.trim());

      if (notif.type === "notification") {
        BrowserWindow.getAllWindows().forEach((w) =>
          w.webContents.send("notification", notif)
        );
      } else if (notif.type === "close") {
        BrowserWindow.getAllWindows().forEach((w) =>
          w.webContents.send("close-notification", notif.id)
        );
      }
    } catch (e) {
      console.error("failed to parse notification:", e);
    }
  });
});

export function invokeAction(id: number, actionId: number) {
  daemon.stdin.write(
    JSON.stringify({ type: "action", id, action_id: actionId }) + "\n"
  );
}

export function closeNotification(id: number, reason: number) {
  daemon.stdin.write(JSON.stringify({ type: "closed", id, reason }) + "\n");
}
