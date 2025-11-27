<script lang="ts" setup>
import { onKeyDown } from "@vueuse/core";
import { animate, spring } from "animejs";
import type Scrollbar from "~/components/Scrollbar.vue";

const { items, selectionMode = { type: "list" } } = defineProps<{
  items: { id: string }[];
  selectionMode?: { type: "list" } | { type: "grid"; columns: number };
}>();

const resultsRef = ref<InstanceType<typeof Scrollbar>>();
const selection = ref<string | null>(null);
const selectionEl = ref<HTMLElement>();
const scroll = useScroll(() => resultsRef.value?.el);
const navDirection = ref<"up" | "down">("down");
const navStyle = ref<"normal" | "super">("normal");

watch(
  () => items,
  () => {
    selection.value = items[0]?.id || null;
  },
  { immediate: true }
);

watch(
  selection,
  () => {
    if (!resultsRef.value) return;

    nextTick(async () => {
      const selectedEl = resultsRef.value?.el?.querySelector<HTMLElement>(
        `[data-id="${selection.value}"]`
      );

      if (selectedEl) {
        // prevents the selection from slipping in case the TransitionGroup's
        // FLIP transition hasn't finished yet
        //
        // *probably* happens because the FLIP transition creates overflow
        // in some cases which would make the scrollTop larger than 0
        // even though we don't have scrollable content
        await new Promise<void>((resolve) => {
          const hasTransition =
            selectedEl!.classList.contains("searchResult-move");
          if (hasTransition) {
            selectedEl.addEventListener("transitionend", () => resolve(), {
              once: true,
            });
          } else {
            resolve();
          }
        });

        const ch = resultsRef.value!.el!.clientHeight;
        const sh = resultsRef.value!.el!.scrollHeight;

        const p = selectedEl.parentElement!.offsetTop;
        const et = selectedEl.offsetTop + p;
        const eh = selectedEl.offsetHeight;

        let scrollTop: number;
        // an item may be oversized, in these scenarios, we want to align it to
        // the top instead of centering it
        if (eh > ch) {
          const st = resultsRef.value!.el!.scrollTop;
          const eb = et + eh;
          const os = Math.max(et, st);
          const oe = Math.min(eb, st + ch);
          const v = Math.max(0, oe - os);
          const threshold = ch * 0.8;
          const offset = 32;

          if (v >= threshold) {
            scrollTop = st;
          } else {
            // during super navigations, it's better to get to just get to the top
            if (navDirection.value === "down" || navStyle.value === "super") {
              scrollTop = Math.min(Math.max(et - offset, 0), sh - ch);
            } else {
              scrollTop = Math.min(Math.max(eb - ch + offset, 0), sh - ch);
            }
          }
        } else {
          scrollTop = Math.min(Math.max(et - ch / 2 + eh / 2, 0), sh - ch);
        }

        resultsRef.value!.scrollTo(scrollTop);

        if (selectionEl.value) {
          const bounds = selectedEl.getBoundingClientRect();
          animate(selectionEl.value!, {
            top: {
              to: et - scrollTop,
              ease: spring({ duration: 150, bounce: 0.3 }),
            },
            left: {
              to: selectedEl.offsetLeft + selectedEl.parentElement!.offsetLeft,
              ease: spring({ duration: 150, bounce: 0.3 }),
            },
            width: bounds.width,
            height: bounds.height,
            ease: "outExpo",
            duration: 50,
          });
        }
      }
    });
  },
  { flush: "post", immediate: true }
);

onKeyDown(["ArrowDown", "ArrowUp"], (event) => {
  event.preventDefault();
  const index = items.findIndex((x) => x.id === selection.value) || 0;

  navStyle.value = event.shiftKey ? "super" : "normal";
  navDirection.value = event.key === "ArrowDown" ? "down" : "up";

  if (!event.shiftKey && resultsRef.value?.el) {
    const selectedEl = resultsRef.value.el.querySelector<HTMLElement>(
      `[data-id="${selection.value}"]`
    );

    if (selectedEl) {
      const container = resultsRef.value.el;
      const ch = container.clientHeight;
      const sh = container.scrollHeight;
      const eh = selectedEl.offsetHeight;

      if (eh > ch) {
        const p = selectedEl.parentElement!.offsetTop;
        const et = selectedEl.offsetTop + p;
        const eb = et + eh;

        const currentScroll = container.scrollTop;
        const vpb = currentScroll + ch;

        const step = ch * 0.8;
        const threshold = 20;

        let scrollTop: number | null = null;
        if (event.key === "ArrowDown") {
          const remainingBelow = eb - vpb;
          if (remainingBelow > threshold) {
            scrollTop = Math.min(currentScroll + step, sh - ch);
          }
        } else {
          const remainingAbove = currentScroll - et;
          if (remainingAbove > threshold) {
            scrollTop = Math.max(currentScroll - step, 0);
          }
        }

        if (scrollTop !== null) {
          resultsRef.value.scrollTo(scrollTop);

          const bounds = selectedEl.getBoundingClientRect();

          // copied from scrollbar for consistency
          animate(selectionEl.value!, {
            top: et - scrollTop,
            width: bounds.width,
            height: bounds.height,
            ease: "outExpo",
            duration: 300,
          });

          return;
        }
      }
    }
  }

  let n: number = index;
  if (selectionMode.type === "list") {
    n = index + (event.key === "ArrowDown" ? 1 : -1);
  } else if (selectionMode.type === "grid") {
    const inc =
      event.key === "ArrowDown"
        ? selectionMode.columns
        : -selectionMode.columns;
    n = Math.min(items.length - 1, index + inc);
  }
  if (items[n] !== undefined) {
    selection.value = items[n]?.id || null;
  }
});

onKeyDown(["ArrowLeft", "ArrowRight"], (event) => {
  if (selectionMode.type !== "grid") return;
  event.preventDefault();
  const index = items.findIndex((x) => x.id === selection.value) || 0;
  const n = index + (event.key === "ArrowRight" ? 1 : -1);
  if (items[n] !== undefined) {
    selection.value = items[n]?.id || null;
  }
});

defineExpose({
  scroll,
});
</script>

<template>
  <Scrollbar ref="resultsRef" :showBar="false" :allowScroll="false">
    <slot
      :selected="selection"
      :set-selected="(value: string) => selection = value"
    />

    <div
      v-if="selection"
      ref="selectionEl"
      class="selection absolute bg-brand-elevated top-0 min-h-0 h-48px left-0 z-0 w-full rounded-xl"
    />

    <div class="mb-4" />
  </Scrollbar>
</template>
