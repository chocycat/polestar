<script lang="ts" setup>
defineProps<{
	keybinds: { type: "text" | "icon"; icon: string; label: string }[];
}>();
</script>

<template>
  <div class="flex items-center gap-2">
    <div v-for="bind in keybinds" :key="bind.label" class="bind">
      <Icon v-if="bind.type === 'icon'" :name="bind.icon" class="icon" />
      <span v-else class="icon">{{ bind.icon }}</span>

      <label>{{ bind.label  }}</label>
    </div>
  </div>
</template>

<style scoped>
.bind {
  @apply flex items-center gap-1 text-brand-subtle;

  > .icon, > label {
    @apply text-xs;
  }
}
</style>