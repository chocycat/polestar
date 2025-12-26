import { defineStore } from "pinia";

export interface Client {
	id: string;
	name: string;
	class: string;
	pid: number;
	focused: boolean;
	last_focused: number;
	urgent: boolean;
	fullscreen: boolean;
	geometry: { x: number; y: number; width: number; height: number };
}

export interface Workspace {
	name: string;
	index: number;
	screen: number;
	selected: boolean;
	urgent: boolean;
	clients: string[];
}

export interface Screen {
	index: number;
	focused: boolean;
}

export const useAwesome = defineStore("awesome", () => {
	const clients = ref<Client[]>([]);
	const workspaces = ref<Workspace[]>([]);
	const screens = ref<Screen[]>([]);
	const activeScreen = ref<number | undefined>(0);

	window.$electron.onEvent("awesome-state", (_, state: any) => {
		clients.value = state.clients
			.filter((x: Client) => !x.name.startsWith("polestar::"))
			.sort((a: Client, b: Client) => b.last_focused - a.last_focused);
		workspaces.value = state.workspaces;
		screens.value = state.screens;
	});

	window.$electron.onEvent("set-screen", (_, index: number) => {
		// we need to add one to the index to account for lua
		activeScreen.value = index + 1;
	});

	return { clients, workspaces, screens, activeScreen };
});
