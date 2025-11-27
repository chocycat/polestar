<script lang="ts" setup>
const wrapper = ref<HTMLElement>();
const input = ref<HTMLInputElement>();

const model = defineModel<string>();
const emit = defineEmits<{ blur: [event: Event] }>();

const { focused: isFocused } = useFocus(input);
const caretPosition = ref<number | null>(0);
const caretLeft = ref(0);
const showCaret = ref(false);

const caretStyle = computed(() => ({
  left: `${caretLeft.value}px`,
}));

const update = () => {
  if (!input.value) {
    showCaret.value = false;
    return;
  }

  const el = input.value;
  const pos = el.selectionStart;
  const epos = el.selectionEnd;
  if (pos === null || epos === null) {
    showCaret.value = false;
    return;
  }

  if (pos !== epos) {
    showCaret.value = false;
    return;
  }

  caretPosition.value = pos;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  const computed = window.getComputedStyle(el);

  const { fontSize, fontFamily, fontWeight, fontStyle, letterSpacing } =
    computed;
  ctx.font = [fontStyle, fontWeight, fontSize, fontFamily].join(" ");

  if (letterSpacing !== "normal") {
    ctx.letterSpacing = letterSpacing;
  }

  const textBefore = (model.value || "").substring(0, pos);
  const textWidth = ctx.measureText(textBefore).width;

  const paddingLeft = parseFloat(computed.paddingLeft);
  const paddingRight = parseFloat(computed.paddingRight);

  const scrollLeft = el.scrollLeft;
  let left = paddingLeft + textWidth - scrollLeft;
  const visibleWidth = el.clientWidth - paddingLeft - paddingRight;

  const minLeft = paddingLeft;
  const maxLeft = el.clientWidth - paddingRight - 1;

  left = Math.max(minLeft, Math.min(left, maxLeft));

  if (textWidth - scrollLeft < 0 || textWidth - scrollLeft > visibleWidth) {
    showCaret.value = false;
  } else if (isFocused.value && pos === epos) {
    showCaret.value = true;
  }

  caretLeft.value = left;
};

const delayedUpdate = () => {
  requestAnimationFrame(update);
};

onMounted(update);

watch(model, update);

defineOptions({
  inheritAttrs: false,
});

defineExpose({
  el: input,
  focus: () => input.value?.focus(),
});
</script>

<template>
  <div ref="wrapper" class="input w-full">
    <input
      ref="input"
      v-model="model"
      v-bind="$attrs"
      @keydown="delayedUpdate"
      @keyup="update"
      @input="update"
      @select="update"
      @selectionchange="update"
      @scroll="update"
      @mousedown="delayedUpdate"
      @mouseup="update"
      @blur="(ev) => emit('blur', ev)"
    />
    <div v-if="isFocused && showCaret" class="caret" :style="caretStyle" />
  </div>
</template>

<style scoped>
.input {
  @apply relative text-2xl;

  > input {
    @apply outline-none bg-transparent;

    caret-color: transparent;

    &::selection {
      @apply bg-accent/50;
    }

    &::placeholder {
      @apply text-brand-subtle;
    }
  }

  > .caret {
    @apply absolute top-[50%] h-8 -translate-y-[50%] -translate-x-[1px] pointer-events-none z-1 w-[2px] bg-accent rounded-full;
    @apply transition-all duration-50 ease-out;

    animation: 0.75s ease-in blink alternate infinite;
  }
}

@keyframes blink {
  from {
    opacity: 1;
  }
  to {
    opacity: 0.25;
  }
}
</style>