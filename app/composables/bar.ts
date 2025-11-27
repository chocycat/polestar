export const useBar = defineStore('ui/bar', () => {
  const openWidget = ref<string | null>(null);

  return {openWidget};
})