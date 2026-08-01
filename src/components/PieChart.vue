<template>
  <div ref="chartRef" class="pie-chart"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: { type: Array, default: () => [] }, // [{ name, icon, total }]
  height: { type: String, default: '260px' }
})

const chartRef = ref(null)
let chart = null

function initChart() {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        return `${params.data.icon || ''} ${params.name}: ¥${params.value.toFixed(2)} (${params.percent}%)`
      }
    },
    series: [{
      type: 'pie',
      radius: ['55%', '80%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 6,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      data: []
    }],
    color: [
      '#5470C6', '#91CC75', '#FAC858', '#EE6666', '#73C0DE',
      '#3BA272', '#FC8452', '#9A60B4', '#EA7CCC', '#48C9B0',
      '#F8A35C', '#A78BFA', '#FB7185'
    ]
  }

  chart.setOption(option)
}

function updateChart() {
  if (!chart) return
  const data = props.data
    .filter(d => d.total > 0)
    .map(d => ({
      name: d.name,
      value: d.total,
      icon: d.icon
    }))

  chart.setOption({
    series: [{
      data
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
watch(() => props.height, (h) => {
  chartRef.value && (chartRef.value.style.height = h)
  chart?.resize()
})
</script>

<style scoped>
.pie-chart {
  width: 100%;
  height: v-bind(height);
}
</style>
