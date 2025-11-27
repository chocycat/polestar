import { exec, execSync, spawn } from "node:child_process";
import { BrowserWindow, ipcMain, IpcMainEvent } from "electron";
import { Window, WINDOWS } from "./windows";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { closeNotification, invokeAction } from "./notification";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import ini from "ini";
import { clipboard } from "electron";
import { search } from "./dictionary";

let cpuPrevIdle = 0,
  cpuPrevTotal = 0;

const homeDir = homedir();
const xdgDataDirs = process.env.XDG_DATA_DIRS || "/usr/local/share:/usr/share";
const iconCache = new Map();

export function registerEvents() {
  ipcMain.on("window/expandHeight", (ev: IpcMainEvent, height: number) => {
    const win = BrowserWindow.fromWebContents(ev.sender);
    win?.setContentSize(win.getSize()[0], height);
  });

  ipcMain.on("window/hide", (ev: IpcMainEvent) => {
    BrowserWindow.fromWebContents(ev.sender)?.hide();
  });

  ipcMain.on("cmd", (_, cmd: string) => {
    exec(cmd);
  });

  ipcMain.on("spawn", (_, cmd: string, args: string[]) => {
    const child = spawn(cmd, args ?? [], {
      detached: true,
      stdio: "ignore",
      shell: true,
      env: {
        ...process.env,
      },
    });
    child.unref();
  });

  ipcMain.on("notification/invokeAction", (_, id: number, actionId: number) => {
    invokeAction(id, actionId);
  });

  ipcMain.on("notification/close", (_, id: number, reason: number) => {
    closeNotification(id, reason);
  });

  ipcMain.on("setIgnoreMouseEvents", (ev: IpcMainEvent, state) => {
    BrowserWindow.fromWebContents(ev.sender)?.setIgnoreMouseEvents(
      state,
      state === true ? { forward: true } : undefined
    );
  });

  ipcMain.on("audio-stats", () => {
    updateAudioStats();
  });

  ipcMain.on("clipboard/write", (_, data: string) => {
    clipboard.writeText(data);
  });

  ipcMain.handle("system-stats", () => {
    const cpu = readFileSync("/proc/stat", "utf8").split("\n")[0].split(/\s+/);
    const idle = parseInt(cpu[4], 10);
    const total = cpu
      .slice(1, 8)
      .reduce((acc, val) => acc + parseInt(val, 10), 0);

    const idleDiff = idle - cpuPrevIdle;
    const totalDiff = total - cpuPrevTotal;

    cpuPrevIdle = idle;
    cpuPrevTotal = total;

    const mem = readFileSync("/proc/meminfo", "utf8").split("\n");
    const totalMem = parseInt(mem[0].split(/\s+/)[1], 10);
    const available = parseInt(mem[2].split(/\s+/)[1], 10);

    return {
      cpu: 100 * (1 - idleDiff / totalDiff),
      mem: ((totalMem - available) / totalMem) * 100,
      disk: parseInt(
        execSync("df / | tail -1 | awk '{print $5}'").toString(),
        10
      ),
    };
  });

  const pactl = spawn("pactl", ["subscribe"]);
  pactl.stdout.on("data", (data) => {
    const ev = data.toString();

    if (ev.includes("sink") || ev.includes("source")) {
      updateAudioStats();
    }
  });

  updateAudioStats();

  ipcMain.handle('dictionary', async (_, word: string, limit?: number) => {
    return search(word, limit)
  })

  ipcMain.handle('xdg/resolveIcon', async (_, name: string, size?: number) => {
    return await resolveIcon(name, size);
  })

  ipcMain.handle("xdg/apps", async () => {
    const apps = new Map();

    const dirs = [
      join(homeDir, ".local/share/applications"),
      ...xdgDataDirs.split(":").map((d) => join(d, "applications")),
    ].filter((x) => existsSync(x) && statSync(x).isDirectory());

    async function scanDir(dir: string) {
      try {
        const files = readdirSync(dir);
        for await (const f of files) {
          if (f.endsWith(".desktop")) {
            const path = join(dir, f);
            const appId = basename(f, ".desktop");

            try {
              const entry = await parse(path);
              if (entry && isValid(entry)) {
                if (!apps.has(appId) || dir.includes(".local")) {
                  apps.set(appId, {
                    ...entry,
                    id: appId,
                    path,
                  });
                }
              }
            } catch (e) {
              console.log(f, e);
            }
          }
        }
      } catch {}
    }

    async function parse(path: string) {
      const content = readFileSync(path, "utf8");
      const parsed = ini.parse(content);

      const entry = parsed["Desktop Entry"];
      if (!entry) {
        throw "no entry found";
      }

      return {
        id: v(entry, "Id"),
        name: v(entry, "Name"),
        genericName: v(entry, "GenericName"),
        exec: entry.Exec,
        icon: await resolveIcon(entry.Icon),
        type: entry.Type,
        hidden: entry.Hidden,
        noDisplay: entry.NoDisplay,
        tryExec: entry.TryExec,
        keywords: parseList(entry.Keywords || ""),
        actions: parseActions(parsed, entry.Actions),
      };
    }

    function v(entry: any, k: string) {
      const locale = process.env.LANG || process.env.LC_ALL || "en";
      const langCode = locale.split(".")[0];
      const shortLang = langCode.split("_")[0];

      if (entry[`${k}[${langCode}]`]) {
        return entry[`${k}[${langCode}]`];
      }

      if (entry[`${k}[${shortLang}]`]) {
        return entry[`${k}[${shortLang}]`];
      }

      return entry[k];
    }

    function parseList(val: string) {
      if (!val) return [];
      return val.split(";").filter((x) => x.trim() !== "");
    }

    function parseActions(parsed: any, str: string) {
      const actions: any[] = [];
      const ids = parseList(str);

      for (const id of ids) {
        const section = parsed[`Desktop Action ${id}`];
        if (section) {
          actions.push({
            id,
            name: v(section, "Name"),
            exec: section.Exec,
            icon: section.Icon,
          });
        }
      }

      return actions;
    }

    function isValid(entry: any) {
      if (entry.hidden || entry.noDisplay) return false;
      if (entry.type !== "Application") return false;
      if (!entry.name || !entry.exec) return false;
      if (entry.tryExec && !commandExists(entry.tryExec)) return false;
      return true;
    }

    function commandExists(cmd: string) {
      try {
        execSync(`which ${cmd}`, { stdio: "ignore" });
        return true;
      } catch {
        return false;
      }
    }

    for (const dir of dirs) {
      await scanDir(dir);
    }

    return Array.from(apps.values());
  });
}

export function updateAudioStats() {
  const outputVolume = parseInt(
    execSync("pactl get-sink-volume @DEFAULT_SINK@")
      .toString()
      .match(/(\d+)%/g)?.[0] ?? "0",
    10
  );
  const outputMuted = execSync("pactl get-sink-mute @DEFAULT_SINK@")
    .toString()
    .includes("yes");
  const inputVolume = parseInt(
    execSync("pactl get-source-volume @DEFAULT_SOURCE@")
      .toString()
      .match(/(\d+)%/g)?.[0] ?? "0",
    10
  );
  const inputMuted = execSync("pactl get-source-mute @DEFAULT_SOURCE@")
    .toString()
    .includes("yes");

  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send("audio-stats", {
      outputVolume,
      outputMuted,
      inputVolume,
      inputMuted,
    });
  });
}

async function resolveIcon(iconValue: string, size = 48) {
  if (!iconValue) return null;

  const key = `${iconValue}-${size}`;
  if (iconCache.has(key)) return iconCache.get(key);

  let resolvedPath: string | null = null;
  if (iconValue.startsWith("/")) {
    resolvedPath = resolveAbsolute(iconValue);
  } else if (iconValue.includes("/")) {
    resolvedPath = null;
  } else {
    resolvedPath = await resolveIconName(iconValue, size);
  }

  const result = resolvedPath ? `file://${resolvedPath}` : null;
  iconCache.set(key, result);

  return result;

  function resolveAbsolute(p: string) {
    try {
      if (existsSync(p) && statSync(p).isFile()) {
        return p;
      }
    } catch {}
    return null;
  }

  async function resolveIconName(iconName: string, size: number) {
    const directories = [
      join(homeDir, ".local/share/icons"),
      join(homeDir, ".icons"),
      ...xdgDataDirs.split(":").map((d) => join(d, "icons")),
      "/usr/share/icons",
      "/usr/local/share/icons",
    ].filter((d) => {
      try {
        return existsSync(d) && statSync(d).isDirectory();
      } catch {
        return false;
      }
    });

    const currentTheme = process.env.ICON_THEME || "Adwaita";
    const extensions = [".svg", ".png"];
    const categories = [
      "apps",
      "actions",
      "devices",
      "emblems",
      "emotes",
      "mimetypes",
      "places",
      "status",
    ];

    let iconPath = await searchInTheme(
      directories,
      currentTheme,
      iconName,
      size,
      extensions,
      categories
    );

    if (!iconPath)
      iconPath = await searchInTheme(
        directories,
        "hicolor",
        iconName,
        size,
        extensions,
        categories
      );

    if (!iconPath) iconPath = await searchInPixmaps(iconName, extensions);

    return iconPath;
  }

  async function searchInTheme(
    dirs: string[],
    themeName: string,
    iconName: string,
    size: number,
    extensions: string[],
    categories: string[]
  ) {
    const sizes = [16, 22, 24, 32, 48, 64, 96, 128, 256].sort((a, b) => {
      const distA = Math.abs(a - size);
      const distB = Math.abs(b - size);
      return distA - distB;
    });

    for (const iconDir of dirs) {
      const themeDir = join(iconDir, themeName);
      if (!existsSync(themeDir)) continue;

      for (const category of categories) {
        const scalable = join(themeDir, "scalable", category);
        const svgPath = join(scalable, `${iconName}.svg`);
        if (existsSync(svgPath)) return svgPath;
      }

      for (const size of sizes) {
        for (const category of categories) {
          const sizeDir = join(themeDir, `${size}x${size}`, category);

          for (const ext of extensions) {
            const iconPath = join(sizeDir, `${iconName}${ext}`);
            if (existsSync(iconPath)) return iconPath;
          }
        }
      }
    }

    return null;
  }

  async function searchInPixmaps(iconName: string, extensions: string[]) {
    const pixmapDirs = ["/usr/share/pixmaps", "/usr/local/share/pixmaps"];

    for (const pixmapDir of pixmapDirs) {
      if (!existsSync(pixmapDir)) continue;

      for (const ext of extensions) {
        const iconPath = join(pixmapDir, `${iconName}${ext}`);
        if (existsSync(iconPath)) return iconPath;
      }
    }

    return null;
  }
}
