<script lang="ts" setup>
import type { Display } from "electron";
import { DateTime } from "luxon";

defineProps<{ screen: Display }>();

const now = useNow();
</script>

<template>
  <div
    class="screen"
    :style="{
      top: `${screen.bounds.y}px`,
      left: `${screen.bounds.x}px`,
      width: `${screen.bounds.width}px`,
      height: `${screen.bounds.height}px`,
    }"
  >
    <div class="absolute top-0 left-0 w-full h-full flex flex-col p-24">
      <div class="flex flex-col gap-2 mt-auto">
        <h2 class="text-3xl text-brand-muted font-medium">
          {{ DateTime.fromJSDate(now).toFormat("EEE d. MMMM") }}
        </h2>
        <h1 class="text-8xl font-semibold">
          {{ DateTime.fromJSDate(now).toFormat("hh:mm a") }}
        </h1>
      </div>
    </div>

    <img src="/img/wp/wallpaper01.png" class="object-cover w-full h-full pointer-events-none" />
  </div>
</template>

<style scoped>
.screen {
  @apply absolute;
}
</style>
