<script lang="ts" setup>
import { ResultType, type EvaluationResult } from "~/lib/evaluator/index";
import * as echarts from "echarts";
import { eases } from "animejs";
import { onKeyDown } from "@vueuse/core";

const { result, selected } = defineProps<{ query: string; result: EvaluationResult, selected?: boolean }>();

onKeyDown('Enter', (ev) => {
  if (selected) {
    ev.preventDefault();
    // TODO: we need to create some kind of system for popups/deciding which value to copy
    // for now, we'll default to reasonable ones
    if (result.type === ResultType.Color) {
      window.$electron.clipboard.write(result.color.hex);
    } else {
      window.$electron.clipboard.write(result.value)
    }
    
    nextTick(() => {
      window.dispatchEvent(new Event('hide'));
    })
  }
})

const graph = ref<HTMLCanvasElement>();
const header = computed(() => {
  switch (result.type) {
    case ResultType.Math:
      return { label: "Calculation", icon: "ri:calculator-fill" };
    case ResultType.Conversion:
      return {
        label: `Conversion • ${result.unit?.name}`,
        icon: "ri:swap-box-fill",
      };
    case ResultType.Currency:
      return {
        label: `Exchange • updated ${result.lastUpdated?.toRelative()}`,
        icon: "ri:token-swap-fill",
      };
    case ResultType.Time:
      return { label: "Time", icon: "ri:time-fill" };
    case ResultType.Date:
      return { label: "Date", icon: "ri:calendar-2-fill" };
    case ResultType.Color:
      return { label: "Color", icon: "ri:palette-fill" };
  }
});

onMounted(() => {
  refreshCanvas();
});

function refreshCanvas() {
  if (!graph.value || result.type !== ResultType.Currency || !result.graph) return;

  const values = Object.values(result.graph);
  const color = values[0]! > values[values.length - 1]! ? "#d77070" : "#70d783";
  const chart = echarts.init(graph.value);
  chart.setOption({
    grid: {
      left: 0,
      right: 24,
      top: 24,
      bottom: 24,
    },
    xAxis: {
      type: "time",
      show: false,
    },
    yAxis: {
      type: "value",
      show: false,
      scale: true,
    },
    series: [
      {
        type: "line",
        smooth: true,
        symbol: "none",
        lineStyle: {
          color,
          width: 4,
        },
        areaStyle: {
          opacity: 0,
        },
        data: Object.entries(result.graph),
        animationDuration: 1000,
        animationEasing: eases.inOutCubic,
      },
    ],
  });
}
</script>

<template>
  <div class="calculator">
    <div
      class="text-brand-subtle text-xs font-semibold flex items-center gap-1.5"
    >
      <Icon :name="header.icon" />
      <span>{{ header.label }}</span>
    </div>
    <div
      v-if="result.type === ResultType.Color"
      class="flex items-center gap-4 mt-3 mb-2"
    >
      <div
        class="preview outline outline-4 w-12 h-12 rounded-full"
        :style="{ backgroundColor: result.color.hex, outlineColor: result.color.hex + '80' }"
      />

      <div class="flex flex-col">
        <span class="font-semibold text-sm mb-1">{{
          result.color.name
        }}</span>
        <div class="flex gap-1.5 items-center text-xs">
          <span>{{ result.color.hex }}</span>
          •
          <span>{{ result.color.rgb }}</span>
          •
          <span>{{ result.color.hsl }}</span>
        </div>
      </div>
    </div>
    <div
      v-else-if="result.type === 'currency'"
      class="text-2xl font-medium text-brand-text"
    >
      <p>{{ result.value as string }}</p>
      <canvas
        ref="graph"
        class="absolute right-0 top-0 h-full w-28 pointer-events-none"
      />
    </div>
    <div v-else class="text-2xl font-medium text-brand-text">
      {{ result.value as string }}
    </div>
  </div>
</template>

<style scoped>
.calculator {
  @apply relative flex flex-col gap-1 px-4 py-3;
}
</style>
