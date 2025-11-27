import { OpenRouter } from "@openrouter/sdk";
import type { Message } from "@openrouter/sdk/models";
import { useStorage } from "@vueuse/core";

export interface Chat {
  id: string;
  title: string;
  messages: (Message & { id: string; loading?: "fetching" | "streaming" })[];
  model: string;
  updatedAt: Date;
  createdAt: Date;
}

const DEFAULT_MODEL = "google/gemini-2.0-flash-lite-001";
const DEFAULT_PROMPT: string | null = null;

export const useAiChat = defineStore("ai", () => {
  const { openrouterKey } = useSecrets();

  const chats = useStorage<Chat[]>("ai/chats", []);

  const openRouter = new OpenRouter({
    apiKey: openrouterKey,
  });

  function newChat(query: string, model?: string) {
    const id = crypto.randomUUID();
    const chat = ref<Chat>({
      id,
      title: query,
      messages: [
        {
          id: crypto.randomUUID(),
          role: "system",
          content: DEFAULT_PROMPT || "You are a general AI assistant.",
        },
        {
          id: crypto.randomUUID(),
          role: "user",
          content: query,
        },
      ],
      model: model || DEFAULT_MODEL,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    chats.value.push(chat.value);
    generateMessage(chat);
    return chat;
  }

  function getChat(id: string) {
    return chats.value.find((x) => x.id === id)!;
  }

  function updateChat(id: string, props: Partial<Chat>) {
    const index = chats.value.findIndex((x) => x.id === id);
    if (index === -1) return -1;

    chats.value[index] = { ...chats.value[index]!, ...props };
    return true;
  }

  async function addMessage(chat: Ref<Chat>, content: string) {
    chat.value.messages.push({
      id: crypto.randomUUID(),
      role: "user",
      content,
    });
    updateChat(chat.value.id, chat.value);
  }

  async function generateMessage(chat: Ref<Chat>) {
    /*const index =
      chat.value.messages.push({
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        loading: 'fetching',
      }) - 1;

    const stream = await openRouter.chat.send({
      model: chat.value.model,
      messages: chat.value.messages,
      stream: true,
    });

    chat.value.messages[index]!.loading = 'streaming';

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      if (!choice) continue;

      if (choice.delta?.content) {
        chat.value.messages[index]!.content += choice.delta.content;
        updateChat(chat.value.id, chat.value);
      }
    }

    delete chat.value.messages[index]!.loading;*/

    const index =
      chat.value.messages.push({
        id: crypto.randomUUID(),
        role: "assistant",
        content: "<reply here>",
      }) - 1;
    updateChat(chat.value.id, chat.value);
  }

  return { chats, newChat, getChat, addMessage, generateMessage };
});
