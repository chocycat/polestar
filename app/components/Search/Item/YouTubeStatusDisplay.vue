<script lang="ts" setup>
import { onKeyDown } from "@vueuse/core";
import type { YtDlpInfo } from "~/composables/search/yt";

const { info, selected } = defineProps<{
  info: YtDlpInfo;
  selected?: boolean;
}>();

onKeyDown("Enter", (ev) => {
  if (selected && info) {
    ev.preventDefault();
    window.$electron.spawn(
      `$BROWSER "${encodeURI(`https://youtube.com/watch?v=${info.id}`)}"`
    );
  }
});
</script>

<template>
  <div class="videoStatus">
    <div class="flex items-center gap-3 h-8">
      <img
        v-if="info.thumbnail"
        class="thumbnail h-8 rounded-lg shadow-md shadow-brand-background/25"
        :src="info.thumbnail"
      />
      <h2 class="font-medium text-brand-text line-clamp-1 text-sm">{{ info.title }}</h2>
    </div>
  </div>
</template>

<style scoped>
.videoStatus {
  @apply p-3;
}
</style>
