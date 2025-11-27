<script lang="ts" setup>
import { debounce } from 'es-toolkit';

const { request } = useWindowHeight();

const { id } = defineProps<{ id: string }>();

const root = ref<HTMLElement>();
let cb: () => void;

function update() {
  nextTick(() => {
    if (root.value) {
      cb?.();
      cb = request(id, root.value.clientHeight, false);
    }
  })
}

onMounted(() => {
  nextTick(() => {
    update();
  })
})

onUnmounted(() => {
  cb?.();
});

defineExpose({ update });
</script>

<template>
  <div ref="root" class="expander">
    <slot :update="update" />
  </div>
</template>
