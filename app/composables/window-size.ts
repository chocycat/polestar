export const useWindowHeight = defineStore("window/height", () => {
  const locks = ref<Record<string, number>>({});

  watch(
    locks,
    () => {
      const values = Object.values(locks.value);
      const biggest = values.length > 0 ? Math.max(...values) : 0;
      window.$electron.expandHeight(Math.ceil(100 + biggest)); // base bar height
    },
    { deep: true }
  );

  function request(id: string, height: number, onUnmount = true) {
    const index = locks.value[id] = height - 1;

    if (onUnmount) {
      onUnmounted(() => {
        delete locks.value[id];
      });
    }

    return () => {
      delete locks.value[id];
    };
  }

  return { request };
});
