<template>
  <div class="bill-list-page">
    <!-- 月份筛选 -->
    <div class="filter-section">
      <MonthFilter
        v-model:year="filterYear"
        v-model:month="filterMonth"
        @change="onMonthChange"
      />
    </div>

    <!-- 汇总卡片 -->
    <div class="summary-row">
      <div class="summary-item summary-item--expense">
        <span class="summary-label">支出</span>
        <span class="summary-value amount-expense">¥{{ recordsStore.summary.expenseTotal.toFixed(2) }}</span>
      </div>
      <div class="summary-item summary-item--income">
        <span class="summary-label">收入</span>
        <span class="summary-value amount-income">¥{{ recordsStore.summary.incomeTotal.toFixed(2) }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">结余</span>
        <span class="summary-value" :class="balance >= 0 ? 'amount-income' : 'amount-expense'">
          ¥{{ balance.toFixed(2) }}
        </span>
      </div>
    </div>

    <!-- 类型筛选 -->
    <div class="type-filter">
      <el-radio-group v-model="typeFilter" size="small" @change="onTypeFilterChange">
        <el-radio-button value="">全部</el-radio-button>
        <el-radio-button value="expense">支出</el-radio-button>
        <el-radio-button value="income">收入</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 账单列表 -->
    <div v-if="recordsStore.loading" class="loading-state">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
      <p>加载中...</p>
    </div>

    <div v-else-if="sortedDates.length === 0" class="empty-state">
      <span class="empty-icon">📝</span>
      <p>暂无记录</p>
      <p class="empty-hint">去记一笔吧~</p>
    </div>

    <div v-else class="bill-list">
      <div v-for="date in sortedDates" :key="date" class="date-group card">
        <div class="date-header">
          <span class="date-text">{{ formatDateCN(date) }}</span>
          <span class="date-total amount-expense">
            支出 ¥{{ dateExpenseTotal(date).toFixed(2) }}
          </span>
        </div>
        <RecordItem
          v-for="record in recordsStore.groupedRecords[date]"
          :key="record.id"
          :record="record"
          @delete="onDeleteRecord"
        />
      </div>
    </div>

    <!-- 导出按钮 -->
    <div v-if="sortedDates.length > 0" class="export-section">
      <el-button @click="handleExport" :icon="Download" size="small">
        导出 CSV
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading, Download } from '@element-plus/icons-vue'
import { useRecordsStore } from '@/stores/records'
import { formatDateCN, getCurrentYearMonth } from '@/utils/format'
import MonthFilter from '@/components/MonthFilter.vue'
import RecordItem from '@/components/RecordItem.vue'

const recordsStore = useRecordsStore()
const api = window.electronAPI

const { year, month } = getCurrentYearMonth()
const filterYear = ref(year)
const filterMonth = ref(month)
const typeFilter = ref('')

const balance = computed(() => {
  return recordsStore.summary.incomeTotal - recordsStore.summary.expenseTotal
})

const sortedDates = computed(() => recordsStore.getSortedDates())

function dateExpenseTotal(date) {
  return recordsStore.groupedRecords[date]
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0)
}

async function onMonthChange(y, m) {
  await recordsStore.setMonth(y, m)
}

async function onTypeFilterChange(val) {
  await recordsStore.setTypeFilter(val || null)
}

async function onDeleteRecord(id) {
  try {
    await recordsStore.deleteRecord(id)
    ElMessage.success('已删除')
  } catch (err) {
    ElMessage.error('删除失败')
  }
}

async function handleExport() {
  try {
    const result = await api.exportCSV(filterYear.value, filterMonth.value)
    if (result.success) {
      ElMessage.success('导出成功！')
    }
  } catch (err) {
    ElMessage.error('导出失败')
  }
}

onMounted(async () => {
  await recordsStore.setMonth(filterYear.value, filterMonth.value)
})
</script>

<style scoped>
.bill-list-page {
  padding-bottom: 20px;
}

.filter-section {
  padding: 8px 16px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
}

.summary-row {
  display: flex;
  padding: 12px 16px;
  gap: 8px;
}

.summary-item {
  flex: 1;
  background: var(--card-bg);
  border-radius: 10px;
  padding: 12px;
  text-align: center;
  box-shadow: var(--shadow);
}

.summary-label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.summary-value {
  font-size: 16px;
  font-weight: 700;
}

.type-filter {
  padding: 0 16px 8px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-hint {
  font-size: 13px;
  color: var(--text-placeholder);
  margin-top: 4px;
}

.date-group {
  padding: 12px 16px;
}

.date-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.date-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.date-total {
  font-size: 12px;
}

.export-section {
  text-align: center;
  padding: 16px;
}
</style>
