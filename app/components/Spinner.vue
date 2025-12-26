<script lang="ts" setup>
import { animate, createTimeline, eases, svg } from "animejs";

const {
	radius = 10,
	strokeWidth = 3,
	variant = "accent",
} = defineProps<{
	radius?: number;
	strokeWidth?: number;
	variant?: "accent" | "brand";
}>();

const rradius = computed(() => radius + strokeWidth);

const root = ref<HTMLElement>();
const spinner = ref<HTMLElement>();

onMounted(() => {
	if (!spinner.value || !root.value) return;

	animate(root.value, {
		rotate: 360,
		duration: 1500,
		loop: true,
		ease: "linear",
	});

	const drawable = svg.createDrawable(spinner.value);
	const tl = createTimeline({ loop: true });

	tl.add(drawable, {
		draw: ["0 0.01", "0 0.75"],
		duration: 750,
		ease: eases.inOutCubic,
	}).add(drawable, {
		draw: ["0 0.75", "0.99 1"],
		duration: 750,
		ease: eases.inOutCubic,
	});
});
</script>

<template>
  <svg
    ref="root"
    class="spinner"
    :viewBox="`0 0 ${rradius * 2} ${rradius * 2}`"
    :style="{ width: `${rradius * 2}px`, height: `${rradius * 2}px` }"
    :data-variant="variant"
  >
    <circle
      class="bg"
      :cx="rradius"
      :cy="rradius"
      :r="radius"
      fill="none"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
    />
    <circle
      ref="spinner"
      class="fg"
      :cx="rradius"
      :cy="rradius"
      :r="radius"
      fill="none"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
    />
  </svg>
</template>

<style lang="css" scoped>
.spinner {
  &[data-variant="accent"] {
    .bg {
      @apply stroke-accent/25;
    }

    .fg {
      @apply stroke-accent;
    }
  }

  &[data-variant="brand"] {
    .bg {
      @apply stroke-brand-background/30;
    }

    .fg {
      @apply stroke-brand-subtle;
    }
  }
}
</style>