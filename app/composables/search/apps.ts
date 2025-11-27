import type { ApplicationEntry, SearchResult } from "../search";
import SearchItemAction from "~/components/Search/Item/Action.vue";
import FuzzySearch from "fuzzy-search";
import KeybindHint from "~/components/Search/Item/KeybindHint.vue";

export const useAppSearch = (
  query: MaybeRef<string>,
  apps: MaybeRef<ApplicationEntry[]>
): ComputedRef<SearchResult[]> => {
  query = toRef(query);
  apps = toRef(apps);

  const searcher = new FuzzySearch(
    apps.value,
    ["name", "genericName", "type", "keywords"],
    { sort: true }
  );

  const applications = computed(() => {
    searcher.haystack = apps.value;

    return searcher.search(query.value).map((x) => ({
      id: `${x.name}`,
      component: h(SearchItemAction, {
        name: x.name,
        icon: x.icon,
        iconType: "image",
        callback: () => {
          const [command, ...args] = x.exec
            .replace(/%[a-zA-Z]/g, "")
            .trim()
            .split(/\s+/);
          if (!command) return;
          window.$electron.spawn(command, args);
        },
        hintIcon: "ri:external-link-line",
      }),
    }));
  });

  return applications;
};
