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
}

export type ClipboardContent =
  | ClipboardContentText
  | ClipboardContentImage
  | null;

export const useClipboardStore = defineStore("clipboard", () => {
  const clipboard = useStorage<ClipboardItem[]>("clipboard", []);

  window.$electron.onEvent(
    "clipboard",
    (
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
      }

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
