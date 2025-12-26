<script lang="ts" setup>
import { onKeyDown } from "@vueuse/core";

const { url, selected } = defineProps<{
  title: string;
  language: string;
  url: string;
  selected?: boolean;
}>();

const { enter, leave } = useScaleTransition({
  baseScale: 0.75,
  blur: "8px",
  absolute: false,
});

const LANGUAGE_MAP: Record<string, string> = {
  simple: "Simple English",
  hu: "Hungarian",
};

onKeyDown("Enter", (ev) => {
  if (selected) {
    ev.preventDefault();
    window.$electron.spawn(`$BROWSER "${encodeURI(url)}"`);

    nextTick(() => {
      window.dispatchEvent(new Event("hide"));
    });
  }
});
</script>

<template>
  <div class="px-3 py-1.5 flex items-center gap-2">
    <div class="w-6 h-6 flex justify-center items-center text-brand-muted">
      <Icon name="ri:book-open-fill" />
    </div>

    <span class="text-sm">Open article in {{ LANGUAGE_MAP[language] }}</span>

    <Transition @enter="enter" @leave="leave">
      <div v-if="selected" class="h-4.5 text-[18px] ml-auto text-brand-subtle">
        <Icon name="ri:external-link-line" class="align-top" />
      </div>
    </Transition>
  </div>
</template>
