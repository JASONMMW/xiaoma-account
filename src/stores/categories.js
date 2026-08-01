import { defineStore } from 'pinia'
import { ref } from 'vue'

const api = window.electronAPI

export const useCategoriesStore = defineStore('categories', () => {
  const expenseCategories = ref([])
  const incomeCategories = ref([])
  const loading = ref(false)

  async function fetchCategories(type) {
    loading.value = true
    try {
      const data = await api.getCategories(type || null)
      if (!type || type === 'expense') {
        expenseCategories.value = await api.getCategories('expense')
      }
      if (!type || type === 'income') {
        incomeCategories.value = await api.getCategories('income')
      }
    } finally {
      loading.value = false
    }
  }

  async function addCategory(data) {
    const result = await api.addCategory(data)
    await fetchCategories(data.type)
    return result
  }

  async function updateCategory(id, data) {
    const result = await api.updateCategory(id, data)
    await fetchCategories(data.type)
    return result
  }

  async function deleteCategory(id, type) {
    const result = await api.deleteCategory(id)
    await fetchCategories(type)
    return result
  }

  // 根据一级分类ID获取二级分类列表
  function getSubCategories(parentId, type) {
    const categories = type === 'expense' ? expenseCategories.value : incomeCategories.value
    const parent = categories.find(c => c.id === parentId)
    return parent ? parent.children : []
  }

  // 根据二级分类ID获取完整信息（含一级分类）
  function getCategoryInfo(subId, type) {
    const categories = type === 'expense' ? expenseCategories.value : incomeCategories.value
    for (const parent of categories) {
      const child = parent.children.find(c => c.id === subId)
      if (child) {
        return {
          parent: { id: parent.id, name: parent.name, icon: parent.icon },
          child: { id: child.id, name: child.name, icon: child.icon }
        }
      }
    }
    return null
  }

  return {
    expenseCategories,
    incomeCategories,
    loading,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getSubCategories,
    getCategoryInfo
  }
})
