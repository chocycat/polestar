import SearchItemCalculator from "~/components/Search/Item/Calculator.vue";
import { calculate, updateCurrencyRates } from "~/lib/evaluator/index";

export const useCalculator = (
  query: MaybeRef<string>
): ComputedRef<SearchResult[]> => {
  query = toRef(query);

  const calculator = computed(() => {
    try {
      const result = calculate(query.value, { discardUseless: true });
      if (!result) return [];

      return [
        {
          id: "builtin/calculator",
          component: h(SearchItemCalculator, { query: query.value, result }),
        },
      ];
    } catch {
      return [];
    }
  });

  watch(
    query,
    () => {
      updateCurrencyRates({ includeGraph: true, graphDays: 30 });
    },
    { immediate: true }
  );

  return calculator;
};
