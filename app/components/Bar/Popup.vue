<script lang="ts" setup>
import { animate, spring, utils } from "animejs";
import BarExpander from "./Expander.vue";

const { id, is = "div" } = defineProps<{
  is?: string | Component;
  id: string;
  skew: "right" | "left";
}>();
const { openWidget } = storeToRefs(useBar());

const content = ref<InstanceType<typeof BarExpander>>();
const isOpen = computed(() => openWidget.value === id);

function enter(target: Element, onComplete: () => void) {
  nextTick(() => {
    animate(target, {
      width: {
        from: 0,
        ease: spring({ bounce: 0.15, duration: 200 }),
      },
      height: { from: 0 },
      opacity: { from: 0 },
      filter: { from: "blur(32px)" },
      scale: { from: 0.75 },
      paddingBottom: { from: 0 },
      duration: 250,
      ease: "outExpo",
      onComplete: (self) => {
        utils.cleanInlineStyles(self);
        onComplete();
      },
    });
  });
}

function leave(target: Element, onComplete: () => void) {
  animate(target, {
    width: { to: 0, duration: 500 },
    height: { to: 0 },
    opacity: { to: 0 },
    filter: { to: "blur(32px)" },
    scale: { to: 0.75 },
    paddingBottom: { to: 0 },
    duration: 250,
    ease: "outExpo",
    onComplete: (self) => {
      utils.cleanInlineStyles(self);
      onComplete();
    },
  });
}

defineExpose({ update: computed(() => content.value?.update) });
</script>

<template>
  <BarWidget
    :is="is"
    :skew="skew"
    class="popup min-h-fit h-fit overflow-hidden"
    :class="{ isOpen, '!bg-brand-elevated': isOpen }"
  >
    <div class="header" @click="openWidget = openWidget === id ? null : id">
      <slot :open="isOpen" />
    </div>

    <Transition @enter="enter" @leave="leave">
      <div
        v-if="isOpen"
        class="content flex justify-end items-end w-full min-w-0 h-full min-h-0 px-2 pb-2"
      >
        <BarExpander
          :id="id"
          ref="content"
          class="flex justify-end items-end w-full h-full min-w-fit min-h-fit"
        >
          <template #default="{ update }">
            <div class="relative">
              <slot name="content" :open="isOpen" :id="id" :update="update" />
            </div>
          </template>
        </BarExpander>
      </div>
    </Transition>
  </BarWidget>
</template>

<style scoped>
.popup {
  @apply transition hover:bg-brand-elevated;

  &:has(.header:active) {
    @apply brightness-80 -translate-y-0.5 scale-99;
  }
}

.open {
  @apply min-h-fit;
}

.header {
  @apply h-[50px];
}
</style>
