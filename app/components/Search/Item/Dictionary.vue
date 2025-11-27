<script lang="ts" setup>
import { onKeyDown } from "@vueuse/core";

const { query } = storeToRefs(useSearch());

const { word, exact, selected, setSelected, match } = defineProps<{
  word: { title: string; entry: string };
  exact?: boolean;
  selected?: boolean;
  setSelected?: (val: string) => void;
  match: string;
}>();

onKeyDown("Enter", (ev) => {
  if (selected) {
    ev.preventDefault();

    if (!exact) {
      query.value = `define ${word.title}`;
    } else {
      window.$electron.clipboard.write(word.title);

      nextTick(() => {
        window.dispatchEvent(new Event("hide"));
      });
    }
  }
});

function handleClick(ev: MouseEvent) {
  const target = (ev.target as HTMLElement).closest("a");
  if (!target) return;

  const href = target.getAttribute("href");
  if (!href || !href.startsWith("x-dictionary:")) return;

  ev.preventDefault();

  const parts = href.split(":");
  if (parts.length >= 3) {
    const id = parts[2]!;
    const title = parts[4]!;

    // we are looking at the word we are searching for right now
    // this might mean its referring to a different meaning instead
    if (title === match && exact) {
      setSelected?.(`${id}-${exact}`);
      return;
    }

    if (title.length > 0) {
      query.value = `define ${title}`;
    }
  }
}
</script>

<template>
  <div v-if="exact" class="dictionary flex-col">
    <div class="dictionaryWord" v-html="word.entry" @click="handleClick" />
  </div>
  <div v-else class="dictionary items-center gap-2">
    <div class="title">{{ word.title }}</div>
    <div class="description" v-html="word.entry" />
  </div>
</template>

<style scoped>
.dictionary {
  @apply p-3 flex;

  > .title {
    @apply text-brand-text font-medium text-sm min-w-fit;
  }

  > .description {
    @apply text-brand-subtle line-clamp-1 text-sm;
  }
}
</style>
