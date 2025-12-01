<script lang="ts" setup>
import { onKeyDown } from '@vueuse/core';
import { useYtStore, type YtDlpFormat, type YtDlpInfo } from '~/composables/search/yt';

const {selected, info, format} = defineProps<{ info: YtDlpInfo, format: YtDlpFormat; selected?: boolean }>();
const { enter, leave } = useScaleTransition({ baseScale: 0.75, blur: '8px', absolute: false });
const { download } = useYtStore();
const { query } = storeToRefs(useSearch());

onKeyDown("Enter", async (ev) => {
  if (selected) {
    ev.preventDefault();

    download(info, format);
    query.value = '';
  }
});
</script>

<template>
  <div class="youtubeLink">
    <div class="w-6 h-6 flex justify-center items-center text-brand-muted">
      <Icon :name="format.vcodec === 'none' ? 'ri:music-fill' : 'ri:film-line'" />
    </div>

    <span class="text-sm">
      Download {{ format.vcodec === 'none' ? 'audio' : 'video' }}
      <span v-if="format.vcodec !== 'none'" class="text-xs text-brand-muted ml-1">{{ format.height }}p</span>
    </span>

    <Transition @enter="enter" @leave="leave">
      <div v-if="selected" class="h-4.5 text-[18px] ml-auto text-brand-subtle ">
        <Icon name="ri:download-2-line" class="align-top" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.youtubeLink {
  @apply px-3 py-1.5 flex items-center gap-2;
}
</style>