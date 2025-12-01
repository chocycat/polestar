export interface Metadata {
  "mpris:artUrl"?: string;
  "mpris:trackid"?: string;
  "mpris:length": number;
  position: number;
  "xesam:album"?: string;
  "xesam:artist"?: string | string[];
  "xesam:title": string;
  "xesam:url": string;
}

export const useMusic = defineStore("music", () => {
  const metadata = ref<Metadata | null>();
  const bars = ref<number[]>([]);

  window.$electron.onEvent('music', (_, data: string) => {
    const channels = data.trim().split(';').filter((x) => x.length > 0).map((x) => Number(x));
    if (channels.length !== 12) return;
    bars.value = channels;
  })

  useIntervalFn(async () => {
    try {
      const output = await window.$electron.cmd("mpris metadata");

      if (!output.startsWith("{")) {
        metadata.value = null;
        return;
      }

      metadata.value = JSON.parse(output);
    } catch {
      metadata.value = null;
    }
  }, 500);

  return { metadata, bars };
});
