import type { BrowserWindow } from "electron";

export enum Window {
	Bar = "polestar::bar",
	Search = "polestar::search",
	Desktop = "polestar::desktop",
}

export const WINDOWS: Record<string, BrowserWindow> = {};
