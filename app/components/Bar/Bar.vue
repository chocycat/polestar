<script lang="ts" setup>
import { animate, createTimeline, JSAnimation, spring, stagger } from 'animejs';

const DEBUG = false;
const bar = ref<HTMLElement>();

const state = ref<'entering' | 'leaving' | 'none'>('none');
const anim = ref<JSAnimation | null>(null);
const { openWidget } = storeToRefs(useBar());

window.$electron.onEvent('show', show);

function show() {
  if (!bar.value) return;

  state.value = 'entering';
  animate(
    bar.value,
    {
      translateY: { from: '-100%', to: '0%' },
      rotateX: { from: '-60deg', to: '0deg' },
      scale: { from: 0.9, to: 1, ease: spring({ duration: 200, bounce: 0.4 }) },
      opacity: { from: 0, to: 1 },
      filter: { from: 'blur(8px)', to: 'blur(0px)' }, 
      duration: 200,
      ease: 'outExpo',
      onComplete: () => {
        state.value = 'none';
      }
    },
  );
}

function mouseEnter() {
  if (state.value === 'leaving') {
    anim.value?.cancel();
    show();
  }
}

function mouseLeave() {
  if (!bar.value) return;

  if (!DEBUG) {
    state.value = 'leaving';
    openWidget.value = null;
    anim.value = animate(
      bar.value,
      {
        translateY: '-100%',
        rotateX: '-60deg',
        scale: 0.9,
        opacity: 0,
        filter: 'blur(8px)', 
        duration: 150,
        ease: 'inExpo',
        onComplete: () => {
          window.$electron.hide();
        }
      },
    );
  }
}
</script>

<template>
  <div class="wrapper w-full h-100px perspective-1000px" @mouseenter="mouseEnter" @mouseleave="mouseLeave">
    <div ref="bar" class="relative flex justify-between w-75% mx-auto h-full max-h-[50%] px-4 origin-top-center">
      <div class="absolute top-0 left-0 flex justify-center w-full h-[80%]">
        <div
          class="root absolute top-0 left-0 w-[50%] h-full bg-brand-background rounded-bl-2xl skew-x-16 transform-origin-t"
        />
        <div
          class="root absolute top-0 right-0 w-[50%] h-full bg-brand-background rounded-br-2xl -skew-x-16 transform-origin-t"
        />
        <div class="absolute mx-auto w-25% h-full bg-brand-background transform-origin-t"></div>
      </div>

      <div class="w-full flex justify-start gap-2">
        <BarWorkspaces />
      </div>
      <div class="w-full flex justify-end gap-2">
        <BarClock />
        <BarNotifications />
        <BarCentre />
      </div>
    </div>
  </div>
</template>

<style lang="css">
.wrapper {
  @apply relative;
}

.root {
  @apply relative z-0 shadow-xl shadow-black/50;
  --un-shadow: var(--un-shadow-inset) 0 25px 32px -12px var(--un-shadow-color, rgb(0
          0 0 / 0.25));
}
</style>
