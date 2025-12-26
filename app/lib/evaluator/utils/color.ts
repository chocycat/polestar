import type { ColorValue } from "../types";

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
	hex = hex.replace("#", "");

	if (hex.length === 3) {
		hex = hex
			.split("")
			.map((c) => c + c)
			.join("");
	}

	const r = parseInt(hex.substring(0, 2), 16);
	const g = parseInt(hex.substring(2, 4), 16);
	const b = parseInt(hex.substring(4, 6), 16);

	return { r, g, b };
}

export function rgbToHex(r: number, g: number, b: number): string {
	const toHex = (n: number) => {
		const hex = Math.round(n).toString(16);
		return hex.length === 1 ? "0" + hex : hex;
	};
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function rgbToHsl(
	r: number,
	g: number,
	b: number,
): { h: number; s: number; l: number } {
	r /= 255;
	g /= 255;
	b /= 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0,
		s = 0;
	const l = (max + min) / 2;

	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

		switch (max) {
			case r:
				h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
				break;
			case g:
				h = ((b - r) / d + 2) / 6;
				break;
			case b:
				h = ((r - g) / d + 4) / 6;
				break;
		}
	}

	return {
		h: Math.round(h * 360),
		s: Math.round(s * 100),
		l: Math.round(l * 100),
	};
}

export function hslToRgb(
	h: number,
	s: number,
	l: number,
): { r: number; g: number; b: number } {
	h /= 360;
	s /= 100;
	l /= 100;

	let r, g, b;

	if (s === 0) {
		r = g = b = l;
	} else {
		const hue2rgb = (p: number, q: number, t: number) => {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		};

		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;

		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}

	return {
		r: Math.round(r * 255),
		g: Math.round(g * 255),
		b: Math.round(b * 255),
	};
}

export function generateColorName(h: number, s: number, l: number): string {
	if (s < 10) {
		if (l < 10) return "Black";
		if (l < 25) return "Very Dark Gray";
		if (l < 40) return "Dark Gray";
		if (l < 60) return "Gray";
		if (l < 75) return "Light Gray";
		if (l < 90) return "Very Light Gray";
		return "White";
	}

	let hueName = "";
	if (h < 15 || h >= 345) hueName = "Red";
	else if (h < 45) hueName = "Orange";
	else if (h < 70) hueName = "Yellow";
	else if (h < 150) hueName = "Green";
	else if (h < 200) hueName = "Cyan";
	else if (h < 260) hueName = "Blue";
	else if (h < 290) hueName = "Purple";
	else if (h < 330) hueName = "Magenta";
	else hueName = "Pink";

	let satMod = "";
	if (s < 30) satMod = "Grayish ";
	else if (s < 50) satMod = "Muted ";
	else if (s > 90) satMod = "Vivid ";

	let lightMod = "";
	if (l < 20) lightMod = "Very Dark ";
	else if (l < 35) lightMod = "Dark ";
	else if (l > 80) lightMod = "Very Light ";
	else if (l > 65) lightMod = "Light ";

	return `${lightMod}${satMod}${hueName}`.trim();
}

export function createColorValue(r: number, g: number, b: number): ColorValue {
	const hsl = rgbToHsl(r, g, b);
	return {
		r,
		g,
		b,
		hex: rgbToHex(r, g, b),
		rgb: `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`,
		hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
		name: generateColorName(hsl.h, hsl.s, hsl.l),
	};
}
