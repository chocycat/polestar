import { animate, utils } from "animejs";

export const useScaleTransition = (
	{
		baseScale,
		blur,
		absolute,
	}: {
		baseScale?: number;
		blur?: string;
		absolute?: boolean;
	} = { baseScale: 0.25, blur: "32px", absolute: true },
) => {
	return {
		enter: (target: Element, onComplete: () => void) => {
			animate(target, {
				opacity: { from: 0, to: 1 },
				filter: { from: `blur(${blur})`, to: "blur(0px)" },
				scale: { from: 1 + baseScale!, to: 1 },
				duration: 250,
				ease: "outExpo",
				onComplete: (self) => {
					utils.cleanInlineStyles(self);
					onComplete();
				},
			});
		},
		leave: (target: Element, onComplete: () => void) => {
			animate(target, {
				...(absolute ? { position: "absolute" } : {}),
				opacity: 0,
				filter: `blur(${blur})`,
				scale: 1 - baseScale!,
				duration: 125,
				ease: "inExpo",
				onComplete: (self) => {
					utils.cleanInlineStyles(self);
					onComplete();
				},
			});
		},
	};
};
