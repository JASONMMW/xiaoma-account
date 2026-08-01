<template>
  <div class="category-picker">
    <!-- 一级分类 -->
    <div class="parent-cats">
      <div
        v-for="cat in parentCategories"
        :key="cat.id"
        class="cat-item"
        :class="{ 'cat-item--active': selectedParent?.id === cat.id }"
        @click="selectParent(cat)"
      >
        <span class="cat-icon">{{ cat.icon }}</span>
        <span class="cat-name">{{ cat.name }}</span>
      </div>
    </div>

    <!-- 二级分类 -->
    <div v-if="selectedParent" class="child-cats">
      <div
        v-for="child in selectedParent.children"
        :key="child.id"
        class="cat-item cat-item--child"
        :class="{ 'cat-item--active': selectedChild?.id === child.id }"
        @click="selectChild(child)"
      >
        <span class="cat-name">{{ child.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useCategoriesStore } from '@/stores/categories'

const props = defineProps({
  type: { type: String, default: 'expense' }, // 'expense' | 'income'
  modelValue: { type: Number, default: null }  // 二级分类ID
})

const emit = defineEmits(['update:modelValue'])

const categoriesStore = useCategoriesStore()

const selectedParent = ref(null)
const selectedChild = ref(null)

const parentCategories = computed(() => {
  return props.type === 'expense'
    ? categoriesStore.expenseCategories
    : categoriesStore.incomeCategories
})

function selectParent(cat) {
  selectedParent.value = cat
  // 自动选中第一个子分类
  if (cat.children && cat.children.length > 0) {
    selectChild(cat.children[0])
  }
}

function selectChild(child) {
  selectedChild.value = child
  emit('update:modelValue', child.id)
}

// 如果传入了 modelValue（编辑场景），自动定位
function initFromValue() {
  if (props.modelValue) {
    const info = categoriesStore.getCategoryInfo(props.modelValue, props.type)
    if (info) {
      selectedParent.value = parentCategories.value.find(c => c.id === info.parent.id)
      selectedChild.value = selectedParent.value?.children.find(c => c.id === info.child.id)
    }
  }
}

onMounted(initFromValue)
watch(() => props.modelValue, initFromValue)
watch(parentCategories, initFromValue)

// 暴露方法
defineExpose({ reset })
function reset() {
  selectedParent.value = null
  selectedChild.value = null
}
</script>

<style scoped>
.parent-cats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.child-cats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.cat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border-radius: 20px;
  background: var(--bg-color);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
  user-select: none;
}

.cat-item:hover {
  background: #ecf5ff;
  color: var(--color-primary);
}

.cat-item--active {
  background: #ecf5ff;
  color: var(--color-primary);
  font-weight: 600;
  box-shadow: 0 0 0 1px var(--color-primary);
}

.cat-icon {
  font-size: 16px;
}
</style>
