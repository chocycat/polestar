<script lang="ts" setup>
import { onKeyDown } from '@vueuse/core';
import type { YtDlpInfo } from '~/composables/search/yt';

const {info, selected} = defineProps<{ info: YtDlpInfo | null; error: string | null; selected?: boolean }>();

onKeyDown("Enter", (ev) => {
  if (selected && info) {
    ev.preventDefault();
    window.$electron.spawn(`$BROWSER "${encodeURI(`https://youtube.com/watch?v=${info.id}`)}"`);

    nextTick(() => {
      window.dispatchEvent(new Event("hide"));
    });
  }
});
</script>

<template>
  <div class="youtube">
    <div v-if="error" class="my-4 flex justify-center items-center w-full flex-col gap-2 text-brand-subtle text-sm">
      <Icon name="ri:error-warning-fill" />
      <span>{{ error }}</span>
    </div>
    <div v-else-if="info" class="flex items-center gap-3 h-16">
      <img v-if="info.thumbnail" class="thumbnail h-16 rounded-lg shadow-md shadow-brand-background/25" :src="info.thumbnail" />

      <div class="flex flex-col gap-1">
        <h2 class="font-medium text-brand-text line-clamp-1">{{ info.title }}</h2>
        <div class="flex items-center gap-1 text-xs text-brand-subtle">
          <template v-if="info.duration_string">
            <Icon name="ri:time-line" />
            {{ info.duration_string }} •
          </template>
          <template v-if="info.like_count">
            <Icon name="ri:thumb-up-line" />
            {{ info.like_count.toLocaleString() }} <span v-if="info.categories">•</span>
          </template>
          <template v-if="info.categories">
            <Icon v-if="info.categories[0] === 'Music'" name="ri:music-2-line" />
            <Icon v-else name="ri:film-line" />
            {{ info.categories[0] }}
          </template>
        </div>
      </div>
    </div>
    <div v-else class="flex justify-center items-center my-2 w-full">
      <Spinner variant="brand" />
    </div>
  </div>
</template>

<style scoped>
.youtube {
  @apply p-3;
}
</style>