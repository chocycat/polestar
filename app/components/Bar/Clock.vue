<script lang="ts" setup>
import { DateTime } from "luxon";

const now = useNow();
</script>

<template>
  <BarWidget is="button" skew="right" class="px-4 hover:bg-brand-elevated h-[50px]">
    <div class="w-full h-full flex gap-3 justify-start items-center text-left">
      <div class="clock unskew">
        <div
          class="hand hours"
          :style="{ rotate: `${(now.getHours() / 12) * 360 + 90}deg` }"
        />
        <div
          class="hand minutes"
          :style="{ rotate: `${(now.getMinutes() / 60) * 360 + 90}deg` }"
        />
        <div
          class="hand seconds"
          :style="{ rotate: `${(now.getSeconds() / 60) * 360 + 90}deg` }"
        />
      </div>

      <div class="flex flex-col">
        <h2 class="font-bold text-brand-text text-sm unskew">
          {{ DateTime.fromJSDate(now).toFormat("hh:mm a") }}
        </h2>
        <h3 class="font-medium text-brand-muted text-xs unskew">
          {{ DateTime.fromJSDate(now).toFormat("EEE d. MMMM") }}
        </h3>
      </div>
    </div>
  </BarWidget>
</template>

<style scoped>
.clock {
  @apply relative w-7 h-7 aspect-square rounded-full border-1 border-brand-muted;

  > .hand {
    @apply absolute top-50% right-50% rounded-full;
    @apply transition-all;

    transform-origin: 100%;

    &.hours {
      @apply h-2px w-30% bg-brand-subtle z-1;
    }

    &.minutes {
      @apply h-2px w-40% bg-brand-muted z-2;
    }

    &.seconds {
      @apply h-2px w-45% bg-accent-light z-3;
    }
  }
}
</style>
