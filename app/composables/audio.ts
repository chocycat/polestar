export interface AudioState {
  outputVolume: number;
  outputMuted: boolean;
  inputVolume: number;
  inputMuted: boolean;
}

export const useAudioState = defineStore("audioStats", () => {
  const outputVolume = ref<number>(0);
  const outputMuted = ref<boolean>(false);
  const inputVolume = ref<number>(0);
  const inputMuted = ref<boolean>(false);

  window.$electron.onEvent("audio-stats", (_, state: AudioState) => {
    outputVolume.value = state.outputVolume;
    outputMuted.value = state.outputMuted;
    inputVolume.value = state.inputVolume;
    inputMuted.value = state.inputMuted;
  });

  watch(outputVolume, (_, o) => {
    if (o === outputVolume.value) return;
    updateOutputVolume();
  });

  watch(outputMuted, (_, o) => {
    if (o === outputMuted.value) return;
    window.$electron.cmd(
      `pactl set-sink-mute @DEFAULT_SINK@ ${outputMuted.value}`
    );
  });

  watch(inputVolume, (_, o) => {
    if (o === inputVolume.value) return;
    updateInputVolume();
  });

  watch(inputMuted, (_, o) => {
    if (o === inputMuted.value) return;
    window.$electron.cmd(
      `pactl set-source-mute @DEFAULT_SOURCE@ ${inputMuted.value}`
    );
  });

  const updateOutputVolume = useDebounceFn(() => {
    window.$electron.cmd(
      `pactl set-sink-volume @DEFAULT_SINK@ ${outputVolume.value}%`
    );
  }, 50);
  const updateInputVolume = useDebounceFn(() => {
    window.$electron.cmd(
      `pactl set-source-volume @DEFAULT_SOURCE@ ${inputVolume.value}%`
    );
  }, 50);

  return { outputVolume, outputMuted, inputVolume, inputMuted };
});
