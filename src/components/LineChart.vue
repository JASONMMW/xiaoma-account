<template>
  <div ref="chartRef" class="line-chart"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: { type: Array, default: () => [] }, // [{ month, total }]
  type: { type: String, default: 'expense' }, // 'expense' | 'income'
  height: { type: String, default: '240px' }
})

const chartRef = ref(null)
let chart = null

const colorMap = { expense: '#F56C6C', income: '#67C23A' }

function initChart() {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)

  const color = colorMap[props.type] || colorMap.expense

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const d = params[0]
        return `${d.axisValue}月: ¥${d.value.toFixed(2)}`
      }
    },
    grid: {
      left: 12,
      right: 16,
      top: 12,
      bottom: 8
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      axisLabel: { fontSize: 10 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 10,
        formatter: (v) => v >= 10000 ? `${(v / 10000).toFixed(1)}万` : v
      },
      splitLine: { lineStyle: { color: '#f0f0f0' } }
    },
    series: [{
      type: 'line',
      data: [],
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      lineStyle: { color, width: 2 },
      itemStyle: { color },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: color + '33' },
          { offset: 1, color: color + '05' }
        ])
      }
    }]
  })
}

function updateChart() {
  if (!chart || !props.data.length) return
  chart.setOption({
    series: [{
      data: props.data.map(d => d.total)
    }]
  })
}

onMounted(() => {
  initChart()
  updateChart()
})

onBeforeUnmount(() => {
  chart?.dispose()
  chart = null
})

watch(() => props.data, updateChart, { deep: true })
</script>

<style scoped>
.line-chart {
  width: 100%;
  height: v-bind(height);
}
</style>
