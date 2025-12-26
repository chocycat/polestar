export default defineNuxtConfig({
	devtools: { enabled: false },
	modules: [
		"nuxt-electron",
		"@unocss/nuxt",
		"@nuxt/eslint",
		"@nuxt/fonts",
		"@nuxt/icon",
		"@pinia/nuxt",
		"@vueuse/nuxt",
	],
	fonts: {
		providers: {
			bunny: false,
			googleicons: false,
			adobe: false,
			fontsource: false,
		},
		families: [{ name: "Figtree", weights: [400, 500, 600, 700] }],
	},
	electron: {
		build: [
			{
				entry: "electron/main.ts",
				onstart(args) {
					args.startup([".", "--open-dev-tools=true"]);
					args.reload();
				},
				vite: {
					build: {
						rollupOptions: {
							external: ["node:sqlite"],
						},
					},
				},
			},
			{
				entry: "electron/preload.ts",
				onstart(args) {
					args.reload();
				},
				vite: {
					build: {
						rollupOptions: {
							external: ["node:sqlite"],
						},
					},
				},
			},
		],
		renderer: {},
		disableDefaultOptions: true,
	},
	css: [
		"@unocss/reset/tailwind-compat.css",
		"~/assets/style.css",
		"~/assets/dictionary.css",
	],
	ssr: false,
	compatibilityDate: "2025-12-02",
});
