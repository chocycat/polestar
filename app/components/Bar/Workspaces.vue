<script lang="ts" setup>
const { workspaces: _workspaces, activeScreen } = storeToRefs(useAwesome());
const workspaces = computed(() =>
  _workspaces.value.filter((x) => x.screen === activeScreen.value)
);

function select(workspace: Workspace) {
  window.$electron.cmd(
    `echo "__goto_tag(${workspace.screen}, ${workspace.index})" | awesome-client`
  );
}
</script>

<template>
  <BarWidget class="px-4 h-50px" skew="left">
    <div class="flex items-center h-full unskew">
      <button
        v-for="workspace in workspaces"
        :key="workspace.name"
        class="workspace h-full bg-transparent flex items-center px-2 gap-4 min-w-fit"
        @click="select(workspace)"
      >
        <div
          class="diamond aspect-square w-2 h-2 transition-all rounded-sm outline outline-1 outline-brand-inactive/0 outline-offset-0"
          :class="{
            '!bg-brand-muted rotate-45 outline-offset-2 !outline-brand-muted':
              workspace.selected,
            'bg-brand-border': workspace.clients.length > 0,
            '!outline-brand-border': workspace.clients.length === 0,
          }"
        />
      </button>
    </div>
  </BarWidget>
</template>

<style scoped>
button.workspace {
  &:hover > .diamond {
    @apply outline-offset-2 outline-brand-inactive bg-brand-border;
  }
}
</style>
