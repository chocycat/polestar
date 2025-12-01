<script lang="ts" setup>
const { bars } = storeToRefs(useMusic());
</script>

<template>
  <div class="bars flex gap-1px rotate-x-180">
    <div v-for="(bar, i) in bars" :key="i" class="bar" :style="{ height: `${bar}%` }" />
  </div>
</template>

<style scoped>
.bars {
  mask-image: linear-gradient(to bottom, transparent 0%, black 60%)
}

.bar {
  @apply w-6px bg-brand-text transition-all;
}
</style>