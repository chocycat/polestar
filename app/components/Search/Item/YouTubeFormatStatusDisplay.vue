<script lang="ts" setup>
import { onKeyDown } from "@vueuse/core";
import { animate, type JSAnimation } from "animejs";
import {
	useYtStore,
	type YtDlpFormat,
	type YtDlpInfo,
} from "~/composables/search/yt";

const { info, format, selected } = defineProps<{
	info: YtDlpInfo;
	format: YtDlpFormat & { percent?: number };
	selected?: boolean;
}>();
const { enter, leave } = useScaleTransition({
	baseScale: 0.75,
	blur: "8px",
	absolute: false,
});
const { cancel } = useYtStore();

const progressEl = ref<HTMLElement>();

let anim: JSAnimation;
watch(
	() => format.percent,
	() => {
		if (!progressEl.value) return;

		if (anim) anim.pause();
		anim = animate(progressEl.value, {
			width: `${format.percent}%`,
			duration: 150,
			ease: "outExpo",
		});
	},
);

onKeyDown("Enter", (ev) => {
	if (selected && info) {
		ev.preventDefault();
		cancel(info, format);
	}
});
</script>

<template>
  <div class="formatStatus">
    <div ref="progressEl" class="progress" />

    <div class="w-6 h-6 flex justify-center items-center text-brand-muted">
      <Spinner variant="accent" :radius="8" />
    </div>

    <span class="text-sm">
      Downloading {{ format.vcodec === "none" ? "audio" : "video" }}...
      <span
        v-if="format.vcodec !== 'none'"
        class="text-xs text-brand-muted ml-1"
        >{{ format.height }}p</span
      >
    </span>

    <Transition @enter="enter" @leave="leave">
      <div v-if="selected" class="h-4.5 text-[18px] ml-auto text-brand-subtle">
        <Icon name="ri:close-fill" class="align-top" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.formatStatus {
  @apply relative px-3 py-1.5 flex items-center gap-2 rounded-xl overflow-hidden my-1 last:mb-0;

  > .progress {
    @apply absolute top-0 left-0 w-0 h-full bg-accent-light/20 z-0;
  }
}
</style>
