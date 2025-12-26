<script lang="ts" setup>
import { isObject, onKeyDown, onKeyUp } from "@vueuse/core";
import { animate, eases, type JSAnimation } from "animejs";

const {
	iconType = "font",
	selected,
	callback,
	closeOnCallback = true,
	danger,
} = defineProps<{
	name: string;
	iconType?: "image" | "font";
	icon?: string;
	callback: () => void;
	hintIcon?: string;
	selected?: boolean;
	danger?: boolean;
	closeOnCallback?: boolean;
}>();
const { enter, leave } = useScaleTransition({
	baseScale: 0.75,
	blur: "8px",
	absolute: false,
});

const progress = ref(0);

const holdAnimation = ref<JSAnimation | null>(null);
const fallOffAnimation = ref<JSAnimation | null>(null);
let isHolding = false;

onKeyDown("Enter", (ev) => {
	if (selected) {
		ev.preventDefault();
		if (danger) {
			if (isHolding) return;
			isHolding = true;

			if (fallOffAnimation.value) fallOffAnimation.value.pause();

			holdAnimation.value = animate(progress, {
				value: 1,
				duration: 1500,
				ease: "inCubic",
				onComplete: execute,
			});
		} else {
			execute();
		}
	}
});

onKeyUp("Enter", (ev) => {
	if (danger) {
		if (holdAnimation.value) holdAnimation.value.pause();

		fallOffAnimation.value = animate(progress, {
			value: 0,
			duration: 400,
			ease: "outExpo",
		});

		isHolding = false;
	}
});

function execute() {
	callback();

	if (closeOnCallback) {
		nextTick(() => {
			window.dispatchEvent(new Event("hide"));
		});
	}
}
</script>

<template>
  <div class="action">
    <div
      v-if="danger && progress > 0"
      class="progress"
      :style="{ width: `${progress * 100}%` }"
    />

    <div class="flex items-center gap-2 w-full">
      <template v-if="icon">
        <div
          v-if="iconType === 'image'"
          class="w-6 h-6 rounded flex justify-center items-center"
        >
          <img :src="icon" class="w-full h-full" />
        </div>
        <div
          v-else-if="iconType === 'font'"
          class="w-6 h-6 flex justify-center items-center text-brand-muted"
          :class="{ '!text-red': danger }"
        >
          <Icon :name="icon" class="text-lg" />
        </div>
      </template>
      <span class="name z-1" :class="{ '!text-red': danger }">{{ name }}</span>

      <Transition @enter="enter" @leave="leave">
        <div
          v-if="hintIcon && selected"
          class="h-4.5 text-[18px] ml-auto text-brand-subtle"
        >
          <Icon :name="hintIcon" class="align-top" />
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.action {
  @apply relative p-3 bg-transparent flex items-center gap-2 overflow-hidden rounded-xl;

  > .flex > .name {
    @apply text-brand-text;
  }

  > .progress {
    @apply absolute top-0 left-0 w-full h-full bg-brand-inactive/50 z-0;
  }
}
</style>
