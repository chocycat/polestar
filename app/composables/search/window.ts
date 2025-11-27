import { sortBy } from "es-toolkit";
import FuzzySearch from "fuzzy-search";
import SearchItemWindow from "~/components/Search/Item/Window.vue";

export const ICON_OVERRIDES: Record<string, string> = {
  Signal: "signal-desktop",
  Code: "vscode",
  obs: "com.obsproject.Studio",
};

export const useWindowSearch = (
  query: MaybeRef<string>
): ComputedRef<SearchResult[]> => {
  query = toRef(query);

  const { clients } = storeToRefs(useAwesome());

  const apps = computed(() =>
    sortBy(clients.value, [(x) => -x.last_focused]).filter(
      (x) => !x.name.startsWith("polestar::")
    )
  );
  const searcher = new FuzzySearch(apps.value, ["name", "class"]);

  return computed<SearchResult[]>(() => {
    searcher.haystack = apps.value;

    return searcher.search(query.value).map((x) => ({
      id: `builtin/window+${x.id}`,
      component: h(SearchItemWindow, { client: x }),
    }));
  });
};
