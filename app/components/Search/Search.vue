<script lang="ts" setup>
import { onKeyDown } from "@vueuse/core";
import { animate, JSAnimation, spring, utils } from "animejs";
import SearchInput from "./Input.vue";
import SearchItemRenderer from "./Item/Renderer.vue";

const { query, tab, results } = storeToRefs(useSearch());

const search = ref<HTMLElement>();
const searchInput = ref<InstanceType<typeof SearchInput>>();
const renderer = ref<InstanceType<typeof SearchItemRenderer>>();
const selfHiding = ref<boolean>(false);
const state = ref<"entering" | "leaving" | "none">("none");
const winAnim = ref<JSAnimation | null>(null);
const heightAnim = ref<JSAnimation | null>(null);
const widthAnim = ref<JSAnimation | null>(null);

window.$electron.onEvent("show", show);
window.$electron.onEvent("hide", () => {
  // if we're the origin of the hide, just return
  // this will fire due to the blur event
  if (selfHiding.value) return;

  // this event might be triggered while we're leaving. in that case,
  // it's supposed to be a toggle, so we should execute 'show'
  state.value === "leaving" ? show() : hide();
});
window.addEventListener("hide", () => {
  // happens internally
  selfHiding.value = true;
  hide();
});
window.addEventListener("clear-query", () => {
  query.value = "";
});

watch(
  results,
  () => {
    if (!search.value) return;

    const { height } = search.value.getBoundingClientRect();
    if (heightAnim.value) {
      utils.cleanInlineStyles(heightAnim.value);
      heightAnim.value.cancel();
      heightAnim.value = null;
    }

    nextTick(() => {
      // we need a nested one here because SearchItemCategory transitions are delayed by a tick
      nextTick(() => {
        if (!search.value) return;

        heightAnim.value = animate(search.value, {
          height: { from: height, to: search.value.offsetHeight },
          ease: spring({ bounce: 0.25, duration: 150 }),
          onComplete: utils.cleanInlineStyles,
        });
      });
    });
  },
  { deep: true, immediate: true, flush: "pre" }
);

watch(
  tab,
  () => {
    if (!search.value) return;

    const { width } = search.value.getBoundingClientRect();
    if (widthAnim.value) {
      utils.cleanInlineStyles(widthAnim.value);
      widthAnim.value.cancel();
      widthAnim.value = null;
    }

    nextTick(() => {
      if (!search.value) return;

      widthAnim.value = animate(search.value, {
        width: { from: width, to: search.value.offsetWidth },
        ease: spring({ bounce: 0.25, duration: 150 }),
        onComplete: utils.cleanInlineStyles,
      });
    });
  },
  { flush: "pre" }
);

onKeyDown("Escape", (ev) => {
  ev.preventDefault();

  if (query.value.length > 0) {
    query.value = "";
    return;
  }

  hide();
});

function show() {
  if (!search.value) return;

  if (state.value === "leaving") {
    winAnim.value?.cancel();
  }

  searchInput.value?.focus();
  state.value = "entering";
  winAnim.value = animate(search.value, {
    scale: { from: 0.9, to: 1, ease: spring({ duration: 250, bounce: 0.4 }) },
    opacity: { from: 0, to: 1 },
    filter: { from: "blur(32px)", to: "blur(0px)" },
    duration: 250,
    ease: "outExpo",
    onComplete: (self) => {
      state.value = "none";
    },
  });
}

function hide() {
  if (!search.value) return;

  query.value = "";
  tab.value = "Quick Search";
  state.value = "leaving";

  winAnim.value = animate(search.value, {
    scale: 0.9,
    opacity: 0,
    filter: "blur(16px)",
    duration: 200,
    ease: "outExpo",
    onComplete: () => {
      selfHiding.value = false;
      window.$electron.hide();
    },
  });
}

function onBlur(ev: Event) {
  setTimeout(() => {
    (ev.target as HTMLInputElement).focus();
  }, 0);
}
</script>

<template>
  <div class="w-full flex-1 flex justify-center">
    <div
      ref="search"
      class="flex flex-col relative h-full max-w-full max-h-screen bg-brand-background rounded-2xl my-8 pb-0 min-h-128px shadow-xl overflow-hidden w-450px"
    >
      <div class="bar flex flex-col z-10 mx-4 pt-4 bg-brand-background rounded-b-xl">
        <SearchTab v-model="tab" class="px-3 mb-3" />
        <label
          for="searchInput"
          class="flex items-center gap-3 p-4 bg-brand-elevated rounded-xl shadow-xl"
        >
          <Icon
            name="ri:search-2-line"
            class="text-xl text-brand-subtle"
          />

          <SearchInput
            v-model="query"
            ref="searchInput"
            id="searchInput"
            placeholder="Search..."
            autofocus
            autocapitalize="off"
            autocorrect="off"
            spellcheck="false"
            class="w-full"
            @blur="onBlur"
          />
        </label>
      </div>

      <div class="px-4">
        <SearchItemRenderer
          ref="renderer"
          class="flex flex-col gap-4 max-h-312px max-w-418px"
          :items="Object.values(results).flat()"
        >
          <template #default="{ selected, setSelected }">
            <div class="flex flex-col-reverse">
              <SearchItemCategory
                v-for="[category, items] in Object.entries(results)
                  .slice()
                  .reverse()"
                :key="category"
                :name="category"
                :items="items"
                :selected="selected"
                :set-selected="setSelected"
              />
            </div>
          </template>
        </SearchItemRenderer>
      </div>
    </div>
  </div>
</template>
