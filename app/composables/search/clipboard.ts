import type { ClipboardItem } from "#imports";
import { sortBy } from "es-toolkit";
import FuzzySearch from "fuzzy-search";
import SearchItemClipboard from "~/components/Search/Item/Clipboard.vue";

export const useClipboardSearch = (
  query: MaybeRef<string>
): ComputedRef<SearchResult[]> => {
  query = toRef(query);

  const { clipboard: _clipboard } = storeToRefs(useClipboardStore());
  const clipboard = computed(
    () =>
      _clipboard.value.map((x) => {
        if (x.content?.type === "text") {
          (x as ClipboardItem & { contentString?: string }).contentString = x.content.text;
        }
        return x;
      })
  );
  const searcher = new FuzzySearch(clipboard.value, ["contentString"]);

  return computed(() => {
    searcher.haystack = clipboard.value;

    return sortBy(searcher.search(query.value), [(x) => -x.timestamp]).map((x) => ({
      id: x.id,
      component: h(SearchItemClipboard, { item: x }),
    }));
  });
};
