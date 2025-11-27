<script lang="ts" setup>
import { onKeyDown } from '@vueuse/core';
import type { Client } from '~/composables/awesome';
import { ICON_OVERRIDES } from '~/composables/search/window';

const { client, selected } = defineProps<{ client: Client; selected?: boolean }>();
const { enter, leave } = useScaleTransition({ baseScale: 0.75, blur: '8px', absolute: false });

const icon = ref<string | null>(null);

onBeforeMount(async () => {
  icon.value = await window.$electron.resolveIcon(ICON_OVERRIDES[client.class] ?? client.class);
  icon.value ??= await window.$electron.resolveIcon(client.class.toLowerCase());
})

onKeyDown('Enter', (ev) => {
  if (selected) {
    ev.preventDefault();
    window.$electron.cmd(`echo "__goto_client(${client.id})" | awesome-client`)
    
    nextTick(() => {
      window.dispatchEvent(new Event('hide'));
    })
  }
})
</script>

<template>
  <div class="p-3 flex items-center gap-2">
    <template v-if="icon">
      <div v-if="icon" class="w-6 h-6 min-w-6 min-h-6 rounded flex justify-center items-center">
        <img  :src="icon" class="w-full h-full" />
      </div>
      <div v-else class="w-6 h-6 min-w-6 min-h-6 flex justify-center items-center text-brand-muted">
        <Icon name="ri:window-2-fill" class="text-lg" />
      </div>
    </template>

    <span class="name line-clamp-1">{{ client.name }}</span>

    <Transition @enter="enter" @leave="leave">
      <div v-if="selected" class="h-4.5 text-[18px] ml-auto text-brand-subtle ">
        <Icon name="ri:arrow-right-line" class="align-top" />
      </div>
    </Transition>
  </div>
</template>