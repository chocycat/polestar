<script lang="ts" setup>
const {
  min = 0,
  max = 100,
  step = 1,
} = defineProps<{
  min?: number;
  max?: number;
  step?: number;
  label: string;
}>();

const model = defineModel<number>();

const track = ref<HTMLElement>();
const isDragging = ref(false);

const percentage = computed(() => {
  return (((model.value ?? 0) - min) / (max - min)) * 100;
});

const update = (e: MouseEvent) => {
  if (!track.value) return;

  const rect = track.value.getBoundingClientRect();
  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
  const percent = x / rect.width;

  const raw = min + percent * (max - min);
  const stepped = Math.round((raw - min) / step) * step + min;

  model.value = Math.max(min, Math.min(max, stepped));
};

const onMouseDown = (e: MouseEvent) => {
  isDragging.value = true;
  update(e);

  const onMouseMove = (e: MouseEvent) => update(e);
  const onMouseUp = () => {
    isDragging.value = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
};
</script>

<template>
  <div
    class="pl-3 pr-4 py-2.5 pb-3 flex flex-col gap-1.5 rounded-md bg-brand-border"
  >
    <div class="flex items-center justify-between w-full">
      <span class="text-xs font-medium text-brand-subtle unskew">{{
        label
      }}</span>

      <span
        class="text-xs unskew unskew unskew unskew unskew unskew unskew unskew unskew"
        >{{ Math.ceil(percentage) }}%</span
      >
    </div>

    <div
      ref="track"
      class="track unskew"
      :class="{ isDragging }"
      @mousedown="onMouseDown"
    >
      <div class="fill" :style="{ width: `${percentage}%` }" />
      <div class="thumb" :style="{ left: `${percentage}%` }" />
    </div>
  </div>
</template>

<style scoped>
.track {
  @apply relative w-full h-1.5 bg-brand-inactive rounded-full transition-all;

  > .fill {
    @apply absolute h-full bg-accent rounded-full pointer-events-none;
  }

  > .thumb {
    @apply absolute top-50% -translate-50% w-1 h-3 bg-accent outline outline-3 outline-brand-border rounded-full transition-colors,width;
  }

  &:hover,
  &.isDragging {
    > .fill,
    > .thumb {
      @apply bg-accent-light;
    }

    > .thumb {
      @apply w-1.5;
    }
  }
}
</style>
