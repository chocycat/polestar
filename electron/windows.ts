import { BrowserWindow } from "electron";

export const enum Window {
  Bar = "polestar::bar",
  Search = "polestar::search",
}

export const WINDOWS: Record<string, BrowserWindow> = {};
