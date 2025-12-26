import SearchItemYouTube from "~/components/Search/Item/YouTube.vue";
import YouTubeFormatStatusDisplay from "~/components/Search/Item/YouTubeFormatStatusDisplay.vue";
import SearchItemYouTubeLink from "~/components/Search/Item/YouTubeLink.vue";
import YouTubeStatusDisplay from "~/components/Search/Item/YouTubeStatusDisplay.vue";

export interface YtDlpFormat {
	format_id: string;
	ext: string;
	vcodec?: string;
	acodec?: string;
	filesize?: number;
	filesize_approx?: number;
	tbr?: number;
	width?: number;
	height?: number;
	format_note?: string;
	resolution?: string;
}

export interface YtDlpInfo {
	id: string;
	title: string;
	artist?: string;
	formats: YtDlpFormat[];
	thumbnail?: string;
	duration_string?: string;
	like_count?: number;
	categories?: string[];
}

export interface Available {
	highest?: YtDlpFormat;
	base?: YtDlpFormat;
	audio?: YtDlpFormat;
}

const REGEX_URL =
	/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)/;
const REGEX =
	/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

function getFormats(info: YtDlpInfo): Available {
	const result: Available = {};

	const formats = info.formats
		.filter(
			(f) => f.ext === "mp4" && f.vcodec && f.vcodec !== "none" && f.height,
		)
		.sort((a, b) => (b.height || 0) - (a.height || 0));

	if (formats.length > 0) {
		result.highest = formats[0];

		if (result.highest?.height && result.highest.height > 720) {
			result.base = formats.find((f) => f.height === 720);
		}
	}

	const audioFormats = info.formats
		.filter(
			(f) =>
				f.acodec &&
				f.acodec !== "none" &&
				(!f.vcodec || f.vcodec === "none") &&
				(f.ext === "wav" || f.ext === "m4a" || f.ext === "webm"),
		)
		.sort((a, b) => (b.tbr || 0) - (a.tbr || 0));

	if (audioFormats.length > 0) {
		const wav = audioFormats.find((f) => f.ext === "wav");
		const mp3 = audioFormats.find((f) => f.ext === "mp3");

		result.audio = wav || mp3 || audioFormats[0];
	}

	return result;
}

export const useYtStore = defineStore("yt", () => {
	const downloads = ref<
		Record<
			string,
			{
				info: YtDlpInfo;
				formats: Record<
					string,
					YtDlpFormat & {
						percent?: number;
						ac?: { id: string; abort: () => Promise<void> };
					}
				>;
			}
		>
	>({});

	window.$electron.onEvent(
		"yt/progress",
		(
			_,
			{
				url,
				id,
				progress,
			}: {
				url: string;
				id: string;
				progress: { status: "downloading"; percent: string };
			},
		) => {
			const watchId = url.replace(REGEX_URL, "");
			if (!downloads.value[watchId] || !downloads.value[watchId].formats[id])
				return;

			const percent = parseFloat(progress.percent);

			// yt-dlp doesnt really report accurate percentage
			if ((downloads.value[watchId].formats[id].percent ?? 0) > percent) return;

			downloads.value[watchId].formats[id].percent = percent;
		},
	);

	async function download(info: YtDlpInfo, format: YtDlpFormat) {
		downloads.value[info.id] ||= { info, formats: {} };

		const url = `https://youtube.com/watch?v=${info.id}`;
		const outputDir =
			format.vcodec === "none" ? `~/media/music` : `~/media/videos`;
		const outputPath =
			format.vcodec === "none"
				? `${outputDir}/%(artist)s - %(track,title)s.%(ext)s`
				: `${outputDir}/%(title)s.%(ext)s`;
		2;
		const ac = window.$electron.createAbortSignal();

		const clear = () => {
			delete downloads.value[info.id]!.formats[format.format_id];

			if (Object.keys(downloads.value[info.id]!.formats).length === 0) {
				delete downloads.value[info.id];
			}
		};

		// clear instantly on abortion
		ac.onAbort(clear);

		downloads.value[info.id]!.formats[format.format_id] = {
			...format,
			percent: 0,
			ac,
		};

		await window.$electron.yt.download(
			url,
			format.format_id,
			outputPath,
			!format.vcodec || format.vcodec === "none",
			ac.id,
		);

		clear();
	}

	function cancel(info: YtDlpInfo, format: YtDlpFormat) {
		downloads.value[info.id]?.formats[format.format_id]?.ac?.abort();
	}

	return { downloads, download, cancel };
});

export const useYtSearch = (
	query: MaybeRef<string>,
): ComputedRef<SearchResult[]> => {
	query = toRef(query);

	const { downloads: _downloads } = storeToRefs(useYtStore());

	const results = ref<SearchResult[]>([]);
	const downloads = computed(() => {
		const results: SearchResult[] = [];

		for (const [id, { info, formats }] of Object.entries(_downloads.value)) {
			if (Object.values(formats).length === 0) continue;

			// add the display
			results.push({
				id: `builtin/ytStatus+${id}`,
				component: h(YouTubeStatusDisplay, { info }),
			});

			for (const format of Object.values(formats)) {
				// add the display
				results.push({
					id: `builtin/ytStatus+${id}+${format.format_id}`,
					component: h(YouTubeFormatStatusDisplay, { info, format }),
				});
			}
		}

		return results;
	});

	const ac = ref<AbortController | null>(null);
	watch(query, async () => {
		if (ac.value) {
			ac.value.abort();
		}

		if (!REGEX.test(query.value)) {
			results.value = [];
			return;
		}

		ac.value = new AbortController();
		const signal = ac.value.signal;

		const url = query.value.match(REGEX)![0];

		const info = ref<YtDlpInfo | null>(null);
		const formats = ref<Available | null>(null);
		const error = ref<string | null>(null);

		const updateResults = () => {
			if (signal.aborted) {
				return;
			}

			results.value = [
				{
					id: `builtin/yt-${url}+${!!info.value}+${error.value}`,
					component: h(SearchItemYouTube, {
						info: info.value,
						error: error.value,
					}),
				},
				...(formats.value
					? Object.values(formats.value).map((x) => ({
							id: `builtin/yt-${url}+${x.format_id}`,
							component: h(SearchItemYouTubeLink, {
								info: info.value!,
								format: x,
							}),
						}))
					: []),
			];
		};

		watch([info, formats, error], updateResults, { immediate: true });

		try {
			info.value = await window.$electron.yt.lookup(url);
			if (!info.value) throw "Video unavailable";
			formats.value = getFormats(info.value);
		} catch (e) {
			nextTick(() => {
				if ((e as Error).message.includes("unavailable")) {
					error.value = "yt-dlp is not installed.";
					return;
				}

				error.value = "Video is unavailable.";
			});
		}
	});

	return computed(() =>
		results.value.length > 0 ? results.value : downloads.value,
	);
};
