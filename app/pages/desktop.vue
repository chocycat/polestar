<script lang="ts" setup>
import type { Display } from "electron";

useHead({ title: "polestar::desktop" });

const screens = ref<Display[]>([]);

onMounted(async () => {
	screens.value = await window.$electron.getScreens();
});
</script>

<template>
  <div class="relative">
    <DesktopScreen v-for="screen in screens" :key="screen.id" :screen="screen" />
  </div>
</template>
