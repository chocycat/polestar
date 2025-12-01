import { spawn } from "node:child_process";
import { BrowserWindow } from "electron";
import { basename, dirname } from "node:path";
import { promises as fs } from "node:fs";
import { homedir } from "node:os";

interface YtDlpFormat {
  format_id: string;
  ext: string;
  vcodec?: string;
  acodec?: string;
  filesize?: number;
  filesize_approx?: number;
  tbr?: number;
  width?: number;
  height?: number;
  format_note?: string;
}

interface YtDlpInfo {
  id: string;
  title: string;
  formats: YtDlpFormat[];
  thumbnail?: string;
}

const AUTH_ARGS = [
  "--cookies-from-browser",
  "chrome:~/.config/net.imput.helium/",
];

export function getVideoInfo(url: string): Promise<YtDlpInfo> {
  return new Promise((resolve, reject) => {
    const process = spawn("yt-dlp", [...AUTH_ARGS, "-J", url]);

    let stdout = "";
    let stderr = "";

    process.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    process.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr));
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (e) {
        reject(new Error("failed to parse output"));
      }
    });
  });
}

export async function download(
  url: string,
  id: string,
  output: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const process = spawn("yt-dlp", [
      ...AUTH_ARGS,
      "--embed-thumbnail",
      "--embed-metadata",
      "--newline",
      "--progress-template",
      'download:{"status":"downloading","percent":"%(progress._percent_str)s"}',
      "-f",
      id,
      "-o",
      output,
      url,
    ]);

    let events = 0;
    process.stdout.on("data", (data) => {
      const line = data.toString().trim();
      if (line.startsWith("{")) {
        events++;
        // the first progress event is invalid
        if (events === 1) return;

        try {
          const progress = JSON.parse(line);

          BrowserWindow.getAllWindows().forEach((w) =>
            w.webContents.send("yt/progress", { url, id, progress })
          );
        } catch {}
      }
    });

    process.stderr.on("data", (data) => {
      console.log(data.toString());
    });

    process.on("close", (code) => {
      if (code !== 0) {
        reject(new Error("download failed"));
        return;
      }

      resolve();
    });
  });
}

export async function clean(path: string) {
  path = path.replace('~', homedir())

  const dir = dirname(path);
  const filename = basename(path);

  try {
    await fs.unlink(path);
  } catch {}

  try {
    const files = await fs.readdir(dir);
    const matches = files.filter((f) => f.startsWith(filename + "."));

    await Promise.all(
      matches.map((f) => fs.unlink(`${dir}/${f}`).catch(() => {}))
    );
  } catch {}
}
