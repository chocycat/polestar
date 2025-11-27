<script lang="ts" setup>
const emit = defineEmits<{ close: [] }>();
defineProps<{ notification: DesktopNotification }>();
</script>

<template>
  <div
    class="notification group"
    :data-has-action="notification.actions && notification.actions.length > 0"
  >
    <div class="relative p-2 flex self-stretch">
      <div class="flex gap-1.5 w-fit self-center">
        <div
          v-if="notification.image"
          class="relative image w-auto h-10 w-10 min-h-10 min-w-10 aspect-square unskew"
        >
          <img
            :src="notification.image"
            :alt="notification.summary"
            class="w-full h-full object-cover rounded-full"
          />

          <div v-if="notification.app_name === 'discord'"  class="imageMarker bg-#5865f2">
            <Icon name="ri:discord-fill" class="text-[9px]" />
          </div>
          <div v-if="notification.app_name === 'Signal'"  class="imageMarker bg-#3b45fd">
            <img src="/img/signal.svg" class="w-9px h-9px" />
          </div>
        </div>
        <div class="flex flex-col ml-1">
          <p
            class="font-medium unskew line-clamp-1"
            v-html="notification.summary"
          />
          <span
            class="text-brand-muted unskew line-clamp-2 group-hover:line-clamp-0"
            v-html="notification.body || notification.app_name"
          />
        </div>
      </div>
    </div>

    <Button
      class="close !scale-100 aspect-auto flex justify-center items-center self-stretch !px-2.5 rounded-l-none text-brand-subtle hover:text-brand-text opacity-0 group-hover:opacity-100 hover:bg-brand-subtle/20 bg-transparent"
      @click="emit('close')"
    >
      <Icon name="ri:close-fill" class="unskew text-lg" />
    </Button>
  </div>
</template>

<style scoped>
.notification {
  @apply transition-colors flex justify-between min-h-60px text-sm rounded-md bg-brand-border min-w-fit w-full text-left z-1;

  &.notification-move:not(&.notification-enter-active):not(&.notification-leave-active) {
    @apply transition-all;
  }

  &[data-has-action="true"] {
    @apply hover:bg-brand-inactive;
  }
}

.imageMarker {
  @apply absolute bottom-0 right-0 w-3.5 h-3.5 flex justify-center items-center rounded-full outline outline-2.5 outline-brand-border group-hover:outline-brand-inactive transition-all;
}
</style>
