import { Display } from "electron";

export interface Electron {
	createAbortSignal: () => {
		id: string;
		abort: () => Promise<void>;
		onAbort: (cb) => void;
	};
	onEvent: <T = unknown>(ev: string, cb: (...args: T) => void) => void;
	cmd: (str: string) => Promise<string>;
	spawn: (cmd: string, args?: string[]) => void;
	screen: number;
	expandHeight: (height: number) => void;
	hide: () => void;
	pollAudioStats: () => void;
	pollSystemStats: () => Promise<{ cpu: number; mem: number; disk: number }>;
	pollApps: () => Promise<ApplicationEntry[]>;
	dictionary: (
		query: string,
		limit?: number,
	) => Promise<
		{ id: string; title: string; entry: string; distance: string }[]
	>;
	resolveIcon: (name: string, size?: number) => Promise<string | null>;
	getScreens: () => Promise<Display[]>;
	yt: {
		lookup: (url: string) => Promise<YtDlpInfo>;
		download: (
			url: string,
			id: string,
			output: string,
			audio: boolean,
			ac: string,
		) => Promise<void>;
		clean: (output: string) => Promise<void>;
	};
	clipboard: {
		write: (data: string) => void;
	};
	notification: {
		invokeAction: (id: number, actionId: number) => void;
		close: (id: number, reason: number) => void;
	};
	setIgnoreMouseEvents: (state: boolean) => void;
}

declare global {
	interface Window {
		$electron: Electron;
	}
}
