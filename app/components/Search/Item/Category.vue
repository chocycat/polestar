<script lang="ts" setup>
import { animate, utils } from "animejs";

const props = defineProps<{
	name: string;
	items: SearchResult[];
	selected: string | null;
	setSelected: (val: string) => void;
}>();

function itemEnter(target: Element, onComplete: () => void) {
	nextTick(() => {
		nextTick(() => {
			animate(target, {
				opacity: { from: 0 },
				filter: { from: "blur(16px)" },
				scale: { from: 0.8 },
				duration: 250,
				ease: "outExpo",
				onComplete: (self) => {
					utils.cleanInlineStyles(self);
					onComplete();
				},
			});
		});
	});
}

function beforeLeave(target: Element) {
	const top = (target as HTMLElement).offsetTop;
	const left = (target as HTMLElement).offsetLeft;
	const { width, height } = (target as HTMLElement).getBoundingClientRect();

	(target as HTMLElement).style.setProperty("top", `${top}px`);
	(target as HTMLElement).style.setProperty("left", `${left}px`);
	(target as HTMLElement).style.setProperty("width", `${width}px`);
	(target as HTMLElement).style.setProperty("height", `${height}px`);
}

function itemLeave(target: Element, onComplete: () => void) {
	animate(target, {
		position: "absolute",
		zIndex: 0,
		filter: "blur(16px)",
		opacity: 0,
		scale: 0.8,
		duration: 250,
		ease: "outQuad",
		onComplete: (self) => {
			utils.cleanInlineStyles(self);
			onComplete();
		},
	});
}
</script>

<template>
  <TransitionGroup
    name="searchResult"
    :css="false"
    :appear="true"
    @enter="itemEnter"
    @leave="itemLeave"
    @before-leave="beforeLeave"
  >
    <Component
      v-for="item in items.slice().reverse()"
      :is="item.component"
      :key="item.id"
      class="searchResult relative z-1"
      :class="{ selected: selected === item.id }"
      :data-id="item.id"
      :selected="selected === item.id"
      :set-selected="setSelected"
    />
  </TransitionGroup>

  <Transition :appear="true" @enter="itemEnter" @leave="itemLeave">
    <h3
      v-if="items.length > 0"
      class="mt-4 mb-1 font-medium text-xs text-brand-subtle mx-3 z-1"
    >
      {{ name }}
    </h3>
  </Transition>
</template>

<style>
.searchResult-move {
  @apply transition-all;
}
</style>
