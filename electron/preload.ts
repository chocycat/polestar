import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import config from "./config";

contextBridge.exposeInMainWorld("$electron", {
	createAbortSignal: () => {
		const id = crypto.randomUUID();
		return {
			id,
			abort: () => ipcRenderer.send("abort-signal", id),
			onAbort: (cb: () => void) => ipcRenderer.on(`abort-signal/${id}`, cb),
		};
	},
	onEvent: (ev: string, cb: (ev: IpcRendererEvent, ...args: any[]) => void) =>
		ipcRenderer.on(ev, cb),
	cmd: (cmd: string) => ipcRenderer.invoke("cmd", cmd),
	spawn: (cmd: string, args?: string[]) => ipcRenderer.send("spawn", cmd, args),
	screen: config.screen,
	hide: () => ipcRenderer.send("window/hide"),
	expandHeight: (height: number) =>
		ipcRenderer.send("window/expandHeight", height),
	pollAudioStats: () => ipcRenderer.send("audio-stats"),
	pollSystemStats: async () => await ipcRenderer.invoke("system-stats"),
	pollApps: async () => await ipcRenderer.invoke("xdg/apps"),
	dictionary: async (query: string, limit?: number) =>
		await ipcRenderer.invoke("dictionary", query, limit),
	resolveIcon: async (name: string, size?: number) =>
		await ipcRenderer.invoke("xdg/resolveIcon", name, size),
	getScreens: async () => await ipcRenderer.invoke("screens"),
	yt: {
		lookup: async (url: string) => await ipcRenderer.invoke("yt/lookup", url),
		download: async (
			url: string,
			id: string,
			output: string,
			audio: boolean,
			ac: string,
		) => await ipcRenderer.invoke("yt/download", url, id, output, audio, ac),
		clean: (output: string) => ipcRenderer.send("yt/cleanup", output),
	},
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
