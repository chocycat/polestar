<script lang="ts" setup>
import type { ClipboardItem } from "#imports";
import { DateTime } from "luxon";

const { item } = defineProps<{ item: ClipboardItem }>();
const date = computed(() => DateTime.fromSeconds(item.timestamp));
const formattedDate = ref<string>(date.value.toLocaleString(DateTime.DATE_MED));

if (Math.abs(date.value.diffNow("hours").hours) < 24) {
  formattedDate.value = date.value.toRelative()!;
  useIntervalFn(() => {
    formattedDate.value = date.value.toRelative()!;
  }, 1000);
}
</script>

<template>
  <div class="clipboard">
    <div
      v-if="item.content?.type === 'text'"
      class="content line-clamp-3 whitespace-pre max-w-full"
    >
      {{ item.content.text.trim() }}
    </div>
    <div class="footer">
      <template v-if="item.content?.type === 'text'">
        {{ item.content.characters }}
        character{{ item.content.characters > 1 ? "s" : "" }} •
        {{ item.content.words }} word{{ item.content.words > 1 ? "s" : "" }}
        •
      </template>
      {{ formattedDate }}
    </div>
  </div>
</template>

<style scoped>
.clipboard {
  @apply p-3;

  .footer {
    @apply flex items-center gap-2 text-brand-subtle text-xs mt-1;
  }
}
</style>
