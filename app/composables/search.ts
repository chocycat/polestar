import { type Tab } from "~/components/Search/Tab.vue";
import { useAppSearch } from "./search/apps";
import { useCalculator } from "./search/calculator";
import { useCommandSearch } from "./search/commands";
import { useWebSearch } from "./search/web";
import { useWindowSearch } from "./search/window";
import { useStorage } from "@vueuse/core";
import { useDictionary } from "./search/dictionary";
import { useClipboardSearch } from "./search/clipboard";
import SearchItemAction from "~/components/Search/Item/Action.vue";
import { useYtSearch } from "./search/yt";

export interface ApplicationEntry {
  id?: string;
  name: string;
  genericName?: string;
  exec: string;
  icon?: string;
  type?: string;
  hidden: boolean;
  noDisplay: boolean;
  tryExec?: string;
  keywords?: string[];
  actions: Array<{
    id: string;
    name: string;
    exec: string;
    icon?: string;
  }>;
}

export interface SearchResult {
  id: string;
  component: Component;
  hints?: Component;
}

export const useSearch = defineStore("search", () => {
  const apps = ref<ApplicationEntry[]>([]);
  const query = ref<string>("");
  const tab = ref<Tab>("Quick Search");
  const lastUsed = useStorage<Record<string, Date>>("search/lastUsed", {});

  const applications = useAppSearch(query, apps);
  const calculator = useCalculator(query);
  const commands = useCommandSearch(query);
  const windows = useWindowSearch(query);
  const dictionary = useDictionary(query);
  const clipboard = useClipboardSearch(query);
  const yt = useYtSearch(query);
  const web = useWebSearch(
    query,
    computed(() => {
      if (dictionary.value.length > 0 || calculator.value.length > 0)
        return false;
      return true;
    })
  );

  const results = computed<Record<string, SearchResult[]>>(() => {
    if (tab.value === "Quick Search") {
      return {
        YouTube: yt.value,
        Dictionary: dictionary.value,
        Calculator: calculator.value,
        Applications: applications.value,
        "Web Search": web.value,
        Commands: commands.value,
      } as Record<string, SearchResult[]>;
    } else if (tab.value === "Windows") {
      return {
        Windows: windows.value,
      };
    } else if (tab.value === "Clipboard") {
      const { clipboard: clipboardEntries } = storeToRefs(useClipboardStore());
      const actions: SearchResult[] = [
        clipboardEntries.value.length > 0
          ? {
              id: "builtin/clipboard+clearAll",
              component: h(SearchItemAction, {
                name: "Clear Clipboard History",
                icon: "ri:delete-bin-2-line",
                callback: () => {
                  clipboardEntries.value = [];
                },
                closeOnCallback: false,
                danger: true,
              }),
            }
          : undefined,
      ].filter((x) => !!x);

      return {
        Clipboard: clipboard.value,
        Actions: actions,
      };
    }

    return {};
  });

  onMounted(async () => {
    apps.value = await window.$electron.pollApps();
  });

  function trackUsage(id: string) {
    lastUsed.value[id] = new Date();
  }

  return { query, tab, results, trackUsage };
});
