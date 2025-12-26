<script lang="ts" setup>
import { useAudioState } from "~/composables/audio";

const showAvatar = ref(true);

const { outputVolume, outputMuted, inputVolume, inputMuted } = storeToRefs(
	useAudioState(),
);
</script>

<template>
  <BarPopup id="barCentre" is="button" class="centre" skew="right">
    <div class="w-auto h-[50px] flex gap-3 items-center pl-3 pr-4">
      <div
        v-if="showAvatar"
        class="unskew rounded-full overflow-hidden w-6 h-6"
      >
        <img
          src="/img/avatar.png"
          class="object-cover"
          @error="showAvatar = false"
        />
      </div>

      <h2 class="font-medium unskew">chocycat</h2>
    </div>

    <template #content>
      <div class="flex flex-col gap-2 min-w-[300px]">
        <div class="flex flex-col gap-1">
          <div class="flex gap-1">
            <Slider
              v-model="outputVolume"
              label="Output Volume"
              class="w-full rounded-r"
            />

            <Button
              class="aspect-square w-fit rounded-l"
              @click="outputMuted = !outputMuted"
            >
              <div class="flex justify-center unskew">
                <Icon
                  :name="
                    outputMuted ? 'ri:volume-mute-fill' : 'ri:volume-up-fill'
                  "
                  class="text-[16px]"
                  :class="{ 'text-danger-light': outputMuted }"
                />
              </div>
            </Button>
          </div>
          <div class="flex gap-1">
            <Slider
              v-model="inputVolume"
              label="Input Volume"
              class="w-full rounded-r"
            />

            <Button
              class="w-fit rounded-l !px-3.75"
              @click="inputMuted = !inputMuted"
            >
              <div class="flex justify-center unskew">
                <Icon
                  :name="
                    inputMuted
                      ? 'material-symbols:mic-off-rounded'
                      : 'material-symbols:mic-rounded'
                  "
                  class="text-[18px]"
                  :class="{ 'text-danger-light': inputMuted }"
                />
              </div>
            </Button>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2">
          <Button class="col-span-2">
            <div class="flex items-center gap-2 unskew">
              <Icon
                name="ri:logout-circle-line"
                class="text-[14px] text-brand-subtle"
              />

              <span class="whitespace-nowrap">Sign out</span>
            </div>
          </Button>

          <Button class="col-span-1 bg-danger hover:bg-danger-light">
            <div class="flex justify-center unskew">
              <Icon name="ri:shut-down-line" class="text-brand-background" />
            </div>
          </Button>
        </div>
      </div>
    </template>
  </BarPopup>
</template>

<style scoped>
.centre {
  &:hover {
    @apply bg-brand-elevated;

    > .dropdown {
      @apply transition-colors bg-brand-border text-brand-text;
    }
  }

  &:deep(> div) {
    @apply h-full;
  }
}
</style>
