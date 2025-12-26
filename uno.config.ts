import { defineConfig, presetWind3, transformerDirectives } from "unocss";

export default defineConfig({
	presets: [presetWind3()],
	transformers: [transformerDirectives()],
	theme: {
		fontFamily: {
			sans: "Figtree, monospace",
		},
		duration: {
			DEFAULT: "150ms",
		},
		easing: {
			DEFAULT: "cubic-bezier(0.2, 0.0, 0, 1.0)",
			out: "cubic-bezier(0, 0, 0, 1)",
			in: "cubic-bezier(0.3, 0, 1, 1)",
		},
		colors: {
			brand: {
				background: "#141118",
				surface: "#1e1a24",
				elevated: "#27222f",
				border: "#3b3447",
				inactive: "#4f455f",
				subtle: "#a095b2",
				muted: "#cac4d4",
				text: "#f4f3f6",
			},
			accent: { DEFAULT: "#9e70d7", light: "#a980db" },
			danger: { DEFAULT: "#d77070", light: "#db8080" },
			success: { DEFAULT: "#70d783", light: "#80db90" },
			warning: { DEFAULT: "#d7d370", light: "#dbd880" },
		},
	},
});
