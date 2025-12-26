import FuzzySearch from "fuzzy-search";
import SearchItemAction from "~/components/Search/Item/Action.vue";

const SEARCH_URL = (query: string) => `https://duckduckgo.com/?q=${query}`;

export const useCommandSearch = (
	query: MaybeRef<string>,
): ComputedRef<SearchResult[]> => {
	query = toRef(query);

	const searchable: Array<{ name: string } & SearchResult> = [];
	const permanent = computed(
		() =>
			[
				query.value.length > 0
					? {
							id: "builtin/ai",
							component: h(SearchItemAction, {
								name: `Ask AI “${query.value}”`,
								icon: "ri:chat-ai-3-line",
								callback: () => {
									console.log("TODO");
								},
								hintIcon: "ri:external-link-line",
							}),
						}
					: undefined,
				query.value.length > 0
					? {
							id: "builtin/web-search",
							component: h(SearchItemAction, {
								name: `Search “${query.value}” on the web`,
								icon: "ri:global-fill",
								callback: () => {
									window.$electron.spawn(
										`$BROWSER "${SEARCH_URL(encodeURIComponent(query.value)).replace(/"/g, '\\"')}"`,
									);
								},
								hintIcon: "ri:external-link-line",
							}),
						}
					: undefined,
			].filter((x) => !!x) as SearchResult[],
	);

	const searcher = new FuzzySearch(searchable, ["name"], { sort: true });

	return computed(() => [...searcher.search(query.value), ...permanent.value]);
};
