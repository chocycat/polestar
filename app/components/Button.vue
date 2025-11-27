<template>
  <button
    class="px-4 py-2 rounded-md bg-brand-border hover:bg-brand-inactive font-medium"
  >
    <slot />
  </button>
</template>

<style scoped>
button {
  @apply transition;

  &:active {
    @apply brightness-85 scale-98;
  }
}
</style>
