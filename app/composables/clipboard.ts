import { useStorage } from "@vueuse/core";
import { Buffer } from "buffer/";

export interface ClipboardItem {
  id: string;
  content: ClipboardContent;
  contentType: string;
  mimeTypes: string[];
  timestamp: number;
}

export interface ClipboardContentText {
  type: "text";
  text: string;
  characters: number;
  words: number;
}

export interface ClipboardContentImage {
  type: "image";
  src: string;
  dimensions: string;
  size: string;
}

export type ClipboardContent =
  | ClipboardContentText
  | ClipboardContentImage
  | null;

export const useClipboardStore = defineStore("clipboard", () => {
  const clipboard = useStorage<ClipboardItem[]>("clipboard", []);

  window.$electron.onEvent(
    "clipboard",
    async (
      _,
      {
        content: _content,
        content_type,
        mime_types,
        timestamp,
      }: {
        content: string;
        content_type: string;
        mime_types: string[];
        timestamp: number;
      }
    ) => {
      let content: ClipboardContent = null;
      if (content_type.toLowerCase().includes("string")) {
        const text = Buffer.from(_content, "base64").toString();
        content = {
          type: "text",
          text,
          characters: text.length,
          words: text.split(" ").length,
        };
      } else if (content_type.toLowerCase().includes("image/")) {
        const src = `data:${content_type};base64,${_content}`;
        const padding = (_content.match(/=/g) || []).length;
        const rawSize = (_content.length * 3) / 4 - padding;
        const size = (() => {
          if (rawSize === 0) return '0 B';

          const units = ['B', 'KB', 'MB', 'GB', 'TB'];
          const k = 1024;
          const i = Math.floor(Math.log(rawSize) / Math.log(k));
          const size = rawSize / Math.pow(k, i);

          return size.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
          }) + ' ' + units[i];
        })();

        const dimensions = await new Promise<string>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(`${img.naturalWidth}x${img.naturalHeight}`);
          img.src = src;
        });

        content = {
          type: 'image',
          src,
          dimensions,
          size,
        }
      }

      if (content === null) return;

      clipboard.value.push({
        id: crypto.randomUUID(),
        content,
        contentType: content_type,
        mimeTypes: mime_types,
        timestamp,
      });
    }
  );

  return { clipboard };
});
