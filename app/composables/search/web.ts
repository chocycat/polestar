import axios from "axios";
import SearchItemWiki from "~/components/Search/Item/Wiki.vue";
import SearchItemWikiLang from "~/components/Search/Item/WikiLang.vue";

export const useWebSearch = (
	query: MaybeRef<string>,
	fetch?: ComputedRef<boolean>,
): Ref<SearchResult[]> => {
	query = toRef(query);

	const results = ref<SearchResult[]>([]);

	const ac = ref<AbortController | null>(null);
	watch(query, async () => {
		if (ac.value) {
			ac.value.abort();
		}

		if (fetch && !fetch.value) {
			results.value = [];
			return;
		}

		if (!query.value.trim() || query.value.length < 3) {
			results.value = [];
			return;
		}

		ac.value = new AbortController();
		const signal = ac.value.signal;

		try {
			// check if the query has a wikipedia page
			const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
				query.value,
			)}&limit=1&format=json`;
			const { data: search } = await axios.get<
				[string, string[], string[], string[]]
			>(searchUrl, { signal });
			if (!search) {
				results.value = [];
				return;
			}

			const title = search[1][0];
			if (!title || title.length === 0) {
				results.value = [];
				return;
			}

			// fetch summary
			const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
				title,
			)}`;
			const { data: summary } = await axios.get<{
				title: string;
				description: string;
				extract: string;
				thumbnail?: { source: string; width: string; height: string };
			}>(summaryUrl, { signal });
			if (!summary) return;
			if (summary.extract.includes("may refer to:")) {
				results.value = [];
				return;
			}

			results.value = [
				{
					id: `builtin/wikipedia+${btoa(summary.title)}`,
					component: h(SearchItemWiki, {
						title: summary.title,
						description: summary.description,
						thumbnail: summary.thumbnail,
						extract: summary.extract,
						url: search[3][0]!,
					}),
				},
			];

			// check if other languages exist
			const languages = ["simple", "hu"];
			languages.forEach(async (l) => {
				const summaryUrl = `https://${l}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
					title,
				)}`;
				try {
					if (
						results.value.some(
							(x) => x.id === `builtin/wikipedia+${btoa(summary.title)}+${l}`,
						)
					)
						throw "exists";

					const { data } = await axios.get<{ title: string }>(summaryUrl, {
						validateStatus: () => true,
						signal,
					});
					if (!data || !data?.title) return;

					results.value.push({
						id: `builtin/wikipedia+${btoa(summary.title)}+${l}`,
						component: h(SearchItemWikiLang, {
							title: data.title,
							language: l,
							url: `https://${l}.wikipedia.org/wiki/${data.title}`,
						}),
					});
				} catch {}
			});
		} catch {
			results.value = [];
		}
	});

	return results;
};
