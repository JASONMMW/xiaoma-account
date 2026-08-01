import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

const api = window.electronAPI

export const useRecordsStore = defineStore('records', () => {
  const records = ref([])
  const groupedRecords = ref({})
  const total = ref(0)
  const loading = ref(false)

  // 当前筛选条件
  const filter = reactive({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    type: null, // 'expense' | 'income' | null
    page: 1,
    pageSize: 100
  })

  // 当月汇总
  const summary = ref({ expenseTotal: 0, incomeTotal: 0 })

  async function fetchRecords(params = {}) {
    loading.value = true
    try {
      const queryParams = {
        year: params.year ?? filter.year,
        month: params.month ?? filter.month,
        type: params.type ?? filter.type,
        page: params.page ?? filter.page,
        pageSize: params.pageSize ?? filter.pageSize
      }
      Object.assign(filter, queryParams)

      const data = await api.getRecords(queryParams)
      records.value = data.records
      groupedRecords.value = data.grouped
      total.value = data.total
    } finally {
      loading.value = false
    }
  }

  async function addRecord(data) {
    const result = await api.addRecord(data)
    await fetchSummary()
    await fetchRecords()
    return result
  }

  async function deleteRecord(id) {
    const result = await api.deleteRecord(id)
    await fetchSummary()
    await fetchRecords()
    return result
  }

  async function fetchSummary() {
    const data = await api.getMonthSummary(filter.year, filter.month)
    summary.value = data
  }

  // 切换月份
  async function setMonth(year, month) {
    filter.year = year
    filter.month = month
    await fetchRecords({ year, month })
    await fetchSummary()
  }

  // 切换类型筛选
  async function setTypeFilter(type) {
    filter.type = type
    await fetchRecords({ type })
  }

  // 获取日期分组排序后的键
  function getSortedDates() {
    return Object.keys(groupedRecords.value).sort((a, b) => b.localeCompare(a))
  }

  return {
    records,
    groupedRecords,
    total,
    loading,
    filter,
    summary,
    fetchRecords,
    addRecord,
    deleteRecord,
    fetchSummary,
    setMonth,
    setTypeFilter,
    getSortedDates
  }
})
