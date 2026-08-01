<template>
  <div class="stats-page">
    <!-- 月份筛选 -->
    <div class="filter-section">
      <MonthFilter
        v-model:year="filterYear"
        v-model:month="filterMonth"
        @change="onMonthChange"
      />
    </div>

    <!-- 收支概览 -->
    <div class="overview-row">
      <div class="overview-card overview-card--expense">
        <span class="overview-label">总支出</span>
        <span class="overview-value amount-expense">¥{{ monthSummary.expenseTotal.toFixed(2) }}</span>
      </div>
      <div class="overview-card overview-card--income">
        <span class="overview-label">总收入</span>
        <span class="overview-value amount-income">¥{{ monthSummary.incomeTotal.toFixed(2) }}</span>
      </div>
    </div>

    <!-- 支出分类饼图 -->
    <div class="card">
      <div class="chart-title">支出分类占比</div>
      <PieChart v-if="expenseStats.length > 0" :data="expenseStats" height="260px" />
      <div v-else class="chart-empty">暂无支出数据</div>
    </div>

    <!-- 月度趋势 -->
    <div class="card">
      <div class="chart-title">{{ filterYear }}年收支趋势</div>
      <LineChart :data="trendExpense" type="expense" height="220px" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getCurrentYearMonth } from '@/utils/format'
import MonthFilter from '@/components/MonthFilter.vue'
import PieChart from '@/components/PieChart.vue'
import LineChart from '@/components/LineChart.vue'

const api = window.electronAPI

const { year, month } = getCurrentYearMonth()
const filterYear = ref(year)
const filterMonth = ref(month)

const monthSummary = reactive({ expenseTotal: 0, incomeTotal: 0 })
const expenseStats = ref([])
const trendExpense = ref([])

async function loadMonthData() {
  // 加载月度汇总
  const summary = await api.getMonthSummary(filterYear.value, filterMonth.value)
  Object.assign(monthSummary, summary)

  // 加载支出分类统计
  expenseStats.value = await api.getCategoryStats(filterYear.value, filterMonth.value, 'expense')

  // 加载年度趋势
  trendExpense.value = await api.getMonthTrend(filterYear.value, 'expense')
}

async function onMonthChange(y, m) {
  await loadMonthData()
}

onMounted(loadMonthData)
</script>

<style scoped>
.stats-page {
  padding-bottom: 20px;
}

.filter-section {
  padding: 8px 16px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
}

.overview-row {
  display: flex;
  padding: 12px 16px;
  gap: 12px;
}

.overview-card {
  flex: 1;
  background: var(--card-bg);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  box-shadow: var(--shadow);
}

.overview-label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.overview-value {
  font-size: 22px;
  font-weight: 700;
}

.chart-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--text-placeholder);
  font-size: 14px;
}
</style>
