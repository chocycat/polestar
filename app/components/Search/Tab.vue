<script lang="ts" setup>
import { onKeyDown } from "@vueuse/core";
import { animate, JSAnimation, spring } from "animejs";

export type Tab = "Quick Search" | "Windows" | "Clipboard";

const TABS: Tab[] = ["Quick Search", "Windows", "Clipboard"];
const ICON_MAP: Record<Tab, string> = {
  'Quick Search': 'ri:search-fill',
  'Windows': 'ri:window-2-fill',
  'Clipboard': 'ri:clipboard-fill',
}

const tab = defineModel<Tab>();

const root = ref<HTMLElement>();
const line = ref<HTMLElement>();
const anim = ref<JSAnimation | null>(null);

watch(tab, () => nextTick(update), { immediate: true, flush: "post" });

onMounted(() => {
  update();
});

onKeyDown("ArrowRight", (ev) => {
  if (ev.shiftKey) {
    const currIndex = TABS.findIndex((x) => x === tab.value);
    if (currIndex === -1) return;
    const nextIndex = currIndex + 1 === TABS.length ? 0 : currIndex + 1;
    tab.value = TABS[nextIndex];
  }
});

onKeyDown("ArrowLeft", (ev) => {
  if (ev.shiftKey) {
    const currIndex = TABS.findIndex((x) => x === tab.value);
    if (currIndex === -1) return;
    const prevIndex = currIndex - 1 < 0 ? TABS.length - 1 : currIndex - 1;
    tab.value = TABS[prevIndex];
  }
});

function update() {
  const activeEl = document.querySelector(`.tab[data-tab="${tab.value}"]`);

  nextTick(() => {
    if (!activeEl || !line.value || !root.value) return;

    const bounds = activeEl.getBoundingClientRect();
    const rootBounds = root.value.getBoundingClientRect();

    anim.value?.cancel();
    anim.value = animate(line.value, {
      width: bounds.width,
      left: {
        to: bounds.left - rootBounds.left,
        ease: spring({ bounce: 0.3, duration: 200 }),
      },
      duration: 200,
      ease: "outExpo",
      onComplete: () => {
        anim.value = null;
      },
    });
  });
}

</script>

<template>
  <div ref="root" class="tabs">
    <div
      v-for="t in TABS"
      class="tab"
      :class="{ selected: tab === t }"
      :data-tab="t"
      @click="tab = t"
    >
      <Icon v-if="ICON_MAP[t]" :name="ICON_MAP[t]" />
      {{ t }}
    </div>

    <div ref="line" class="line" />
  </div>
</template>

<style scoped>
.tabs {
  @apply relative flex items-center font-medium gap-4 pb-1.5;

  > .tab {
    @apply flex items-center gap-1.5 transition leading-relaxed text-brand-subtle hover:text-brand-muted;

    &.selected {
      @apply text-brand-text;
    }
  }

  > .line {
    @apply absolute bottom-0 left-0 h-0.5 bg-accent rounded-full;
  }
}
</style>
