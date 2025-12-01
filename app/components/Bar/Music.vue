<script lang="ts" setup>
import BarPopup from "./Popup.vue";

const { metadata } = storeToRefs(useMusic());

const popup = ref<InstanceType<typeof BarPopup>>();
</script>

<template>
  <BarPopup
    v-if="metadata"
    ref="popup"
    id="barMusic"
    is="button"
    skew="right"
    class="music"
    :animate-width="false"
  >
    <div
      class="w-280px h-50px flex gap-2 translate-z-0"
    >
      <div
        v-if="metadata['mpris:artUrl']"
        class="bg absolute left-0 w-full h-50px z-0 overflow-hidden translate-z-0 isolate"
      >
        <div
          :style="{ '--url': `url('${metadata['mpris:artUrl']}')` }"
          class="cover overlay aspect-square object-cover w-full h-auto translate-z-0 -translate-y-10%"
        />
      </div>

      <div class="flex items-center z-2 text-sm h-full w-full pl-3 translate-z-0">
        <div
          class="flex flex-col gap-1 justify-center items-start w-full h-full"
        >
          <h2
            class="font-bold text-shadow-xl text-shadow-black leading-none unskew"
          >
            {{ metadata["xesam:title"] }}
          </h2>
          <template v-if="metadata['xesam:artist']">
            <div
              class="font-medium text-brand-muted text-xs text-shadow-xl text-shadow-black unskew"
            >
              {{
                typeof metadata["xesam:artist"] === "string"
                  ? metadata["xesam:artist"]
                  : metadata["xesam:artist"].join(" & ")
              }}
            </div>
          </template>
        </div>

        <BarMusicBars class="absolute bottom-0 right-3 z-1 h-80%" />
      </div>
    </div>

    <template #content>
      <div class="w-280px">xd</div>
    </template>
  </BarPopup>
</template>

<style scoped>
.music {
  .bg {
    > .cover {
      background-image: var(--url);
      background-size: cover;
      background-position: center;

      &.overlay::after {
        @apply absolute top-0 left-0 w-full h-full bg-brand-background/85;
        
        content: '';
      }
    }
  }

  &:deep(.content) {
    @apply !p-0;
  }
}
</style>
