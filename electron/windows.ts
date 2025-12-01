import { BrowserWindow } from "electron";

export const enum Window {
  Bar = "polestar::bar",
  Search = "polestar::search",
  Desktop = "polestar::desktop",
}

export const WINDOWS: Record<string, BrowserWindow> = {};
