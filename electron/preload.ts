import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import config from "./config";

contextBridge.exposeInMainWorld("$electron", {
  onEvent: (ev: string, cb: (ev: IpcRendererEvent, ...args: any[]) => void) =>
    ipcRenderer.on(ev, cb),
  cmd: (cmd: string) => ipcRenderer.send("cmd", cmd),
  spawn: (cmd: string, args?: string[]) => ipcRenderer.send("spawn", cmd, args),
  screen: config.screen,
  hide: () => ipcRenderer.send("window/hide"),
  expandHeight: (height: number) =>
    ipcRenderer.send("window/expandHeight", height),
  pollAudioStats: () => ipcRenderer.send("audio-stats"),
  pollSystemStats: async () => await ipcRenderer.invoke("system-stats"),
  pollApps: async () => await ipcRenderer.invoke("xdg/apps"),
  dictionary: async (query: string, limit?: number) => await ipcRenderer.invoke('dictionary', query, limit),
  resolveIcon: async (name: string, size?: number) => await ipcRenderer.invoke("xdg/resolveIcon", name, size),
  clipboard: {
    write: (data: string) => ipcRenderer.send("clipboard/write", data),
  },
  notification: {
    invokeAction: (id: number, actionId: number) =>
      ipcRenderer.send("notification/invokeAction", id, actionId),
    close: (id: number, reason: number) =>
      ipcRenderer.send("notification/close", id, reason),
  },
  setIgnoreMouseEvents: (state: boolean) =>
    ipcRenderer.send("setIgnoreMouseEvents", state),
});
