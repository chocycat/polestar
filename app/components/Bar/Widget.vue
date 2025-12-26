<script lang="ts" setup>
const { is = "div" } = defineProps<{
	is?: string | Component;
	skew: "right" | "left";
}>();
</script>

<template>
  <Component
    :is="is"
    class="widget flex bg-brand-surface justify-start items-center rounded-b-xl transform-origin-tc shadow-xl shadow-black/10 translate-z-0"
    :class="skew === 'left' ? 'skew-x-12' : '-skew-x-12'"
  >
    <div class="content w-fit transform-origin-b" :class="`skew-${skew}`">
      <slot />
    </div>
  </Component>
</template>

<style lang="css">
.widget {
  @apply transition-colors;

  .skew-left {
    .unskew {
      @apply -skew-x-12;
    }
  }

  .skew-right {
    .unskew {
      @apply skew-x-12;
    }
  }
}
</style>
