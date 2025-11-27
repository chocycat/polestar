<script lang="ts" setup>
import { animate, JSAnimation } from "animejs";

const { delta = undefined, showBar: _showBar = null, allowScroll = true } = defineProps<{
  delta?: number;
  showBar?: boolean;
  allowScroll?: boolean;
}>();

const scrollContainer = ref<HTMLElement>();
const scrollTrack = ref<HTMLElement>();

const { height: containerHeight } = useElementSize(scrollContainer);
const scrollTop = ref(0);
const contentHeight = ref(0);
const currentAnimation = ref<JSAnimation | null>(null);

const thumbHeight = computed(() => {
  if (contentHeight.value <= containerHeight.value) return 0;
  return (containerHeight.value / contentHeight.value) * containerHeight.value;
});

const thumbPosition = computed(() => {
  const maxScroll = contentHeight.value - containerHeight.value;
  if (maxScroll <= 0) return 0;
  return (
    (scrollTop.value / maxScroll) * (containerHeight.value - thumbHeight.value)
  );
});

const showScrollbar = computed(() =>
  _showBar === null ? contentHeight.value > containerHeight.value : _showBar
);

const updateContentHeight = () => {
  if (!scrollContainer.value) return;
  contentHeight.value = scrollContainer.value.scrollHeight;
};

const updateScrollTop = () => {
  if (!scrollContainer.value) return;
  scrollTop.value = scrollContainer.value.scrollTop;
};

useMutationObserver(scrollContainer, updateContentHeight, {
  childList: true,
  subtree: true,
  attributes: true,
});

useEventListener(scrollContainer, "scroll", updateScrollTop);
useEventListener(window, "resize", updateContentHeight);

watchEffect(updateContentHeight);

const startDrag = (startY: number, startScrollTop: number) => {
  if (!scrollContainer.value) return;

  if (currentAnimation.value) {
    currentAnimation.value.pause();
  }

  const onMouseMove = (e: MouseEvent) => {
    if (!scrollContainer.value) return;

    const deltaY = e.clientY - startY;
    const maxScroll = contentHeight.value - containerHeight.value;
    const scrollAmount =
      (deltaY / (containerHeight.value - thumbHeight.value)) * maxScroll;
    const targetScroll = Math.max(
      0,
      Math.min(maxScroll, startScrollTop + scrollAmount)
    );

    scrollContainer.value.scrollTop = targetScroll;
  };

  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
};

const onThumbMouseDown = (e: MouseEvent) => {
  if (!scrollContainer.value) return;

  e.preventDefault();
  startDrag(e.clientY, scrollContainer.value.scrollTop);
};

const onTrackMouseDown = (e: MouseEvent) => {
  if (!scrollTrack.value || !scrollContainer.value) return;

  const trackRect = scrollTrack.value.getBoundingClientRect();
  const clickY = e.clientY - trackRect.top;
  const maxScroll = contentHeight.value - containerHeight.value;

  let targetScroll = (clickY / containerHeight.value) * maxScroll;

  const thumbCenter = thumbHeight.value / 2;
  targetScroll =
    ((clickY - thumbCenter) / (containerHeight.value - thumbHeight.value)) *
    maxScroll;
  targetScroll = Math.max(0, Math.min(maxScroll, targetScroll));

  scrollContainer.value.scrollTop = targetScroll;

  e.preventDefault();
  startDrag(e.clientY, targetScroll);
};

let wheelTimeout;
useEventListener(
  scrollContainer,
  "wheel",
  (e) => {
    if (!scrollContainer.value) return;

    e.preventDefault();

    if (!allowScroll) return;

    clearTimeout(wheelTimeout);

    const d = delta ? (e.deltaY < 0 ? -delta : delta) : e.deltaY;
    const maxScroll = contentHeight.value - containerHeight.value;
    const targetScroll = Math.max(
      0,
      Math.min(maxScroll, scrollContainer.value.scrollTop + d)
    );

    if (currentAnimation.value) {
      currentAnimation.value.pause();
    }

    currentAnimation.value = animate(scrollContainer.value, {
      scrollTop: targetScroll,
      ease: "outExpo",
      duration: 300,
    });
  },
  { passive: false }
);

defineExpose({
  el: scrollContainer,
  scrollTo: (target: number) => {
    if (!scrollContainer.value) return;
    currentAnimation.value = animate(scrollContainer.value, {
      scrollTop: target,
      ease: "outExpo",
      duration: 300,
    });
  },
})
</script>

<template>
  <div class="scrollbar-wrapper" :class="{ 'pr-4': showScrollbar }">
    <div ref="scrollContainer" class="scroll-content">
      <slot />
    </div>

    <div
      v-if="showScrollbar"
      ref="scrollTrack"
      class="scroll-track"
      @mousedown="onTrackMouseDown"
    >
      <div
        class="scroll-thumb"
        :style="{
          height: thumbHeight + 'px',
          transform: `translateY(${thumbPosition}px)`,
        }"
        @mousedown.stop="onThumbMouseDown"
      />
    </div>
  </div>
</template>

<style scoped>
.scrollbar-wrapper {
  @apply relative flex gap-2;
}

.scroll-content {
  @apply flex-1 overflow-y-auto;
}

.scroll-content::-webkit-scrollbar {
  @apply hidden;
}

.scroll-track {
  @apply absolute top-0 right-0 w-2.5 h-full bg-brand-border rounded z-10;
}

.scroll-thumb {
  @apply w-full bg-brand-inactive/50 rounded transition-colors;
}

.scroll-thumb:hover {
  @apply bg-brand-inactive;
}
</style>
