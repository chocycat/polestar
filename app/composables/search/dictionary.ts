import SearchItemDictionary from '~/components/Search/Item/Dictionary.vue';

export const useDictionary = (query: MaybeRef<string>): Ref<SearchResult[]> => {
  query = toRef(query);

  const dictionary = ref<SearchResult[]>([]);
  
  watch(query, async () => {
    const match = query.value.match(/define\s?['"]?(.*?)['"]?$/)?.[1]?.trim().toLowerCase();

    if (!match || match.length < 3) {
      dictionary.value = [];
      return;
    }

    if (match) {
      let matches = (await window.$electron.dictionary(match, 6));

      const exacts = matches.filter((x) => x.title.toLowerCase() === match);
      if (exacts.length > 0) {
        matches = exacts;
      }

      dictionary.value = matches.map((x) => ({
        id: `${x.id}-${exacts.length > 0}`,
        component: h(SearchItemDictionary, { word: x, exact: exacts.length > 0, match })
      }));

      return;
    }

    dictionary.value = [];
  })

  return dictionary;
}