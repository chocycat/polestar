<script lang="ts" setup>
import { onKeyDown } from "@vueuse/core";

const { url, selected, extract } = defineProps<{
  url: string;
  title: string;
  description: string;
  extract: string;
  thumbnail?: { source: string; width: string; height: string };
  selected?: boolean;
}>();

onKeyDown("Enter", (ev) => {
  if (selected) {
    ev.preventDefault();
    window.$electron.spawn(`$BROWSER "${encodeURI(url)}"`);

    nextTick(() => {
      window.dispatchEvent(new Event("hide"));
    });
  }
});

const sentence = computed(() => {
  const sentences = extract.split(/(?<=[.!?])\s+/).filter((x) => x.trim());
  if (sentences.length === 0) return extract;
  
  let result = '';

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i]?.trim();

    if (i === 0) {
      result = sentence!;
      continue
    }

    const withNext = result + ' ' + sentence;
    if (withNext.length <= 128) {
      result = withNext;
    } else {
      break
    }
  }

  return result;
})
</script>

<template>
  <div class="p-3">
    <img
      v-if="thumbnail"
      :src="thumbnail.source"
      :style="{ aspectRatio: `${thumbnail.width} / ${thumbnail.height}` }"
      class="object-cover float-right h-18 rounded-xl ml-4 mb-4"
    />

    <h1 class="font-semibold mb-1">{{ title }}</h1>
    <p class="text-xs text-brand-subtle mb-1.5">{{ description }}</p>
    <p class="text-justify text-sm">{{ sentence }}</p>
  </div>
</template>
