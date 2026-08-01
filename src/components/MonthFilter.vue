<template>
  <div class="month-filter">
    <el-icon class="arrow-btn" @click="prevMonth"><ArrowLeft /></el-icon>
    <span class="month-text">{{ displayText }}</span>
    <el-icon class="arrow-btn" @click="nextMonth"><ArrowRight /></el-icon>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getCurrentYearMonth } from '@/utils/format'

const props = defineProps({
  year: { type: Number, required: true },
  month: { type: Number, required: true }
})

const emit = defineEmits(['update:year', 'update:month', 'change'])

const displayText = computed(() => `${props.year}年${props.month}月`)

function prevMonth() {
  let y = props.year, m = props.month - 1
  if (m < 1) { m = 12; y-- }
  emit('update:year', y)
  emit('update:month', m)
  emit('change', y, m)
}

function nextMonth() {
  const { year: cy, month: cm } = getCurrentYearMonth()
  if (props.year === cy && props.month === cm) return // 不能超过当前月

  let y = props.year, m = props.month + 1
  if (m > 12) { m = 1; y++ }
  if (y > cy || (y === cy && m > cm)) return
  emit('update:year', y)
  emit('update:month', m)
  emit('change', y, m)
}
</script>

<style scoped>
.month-filter {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 8px 0;
}

.month-text {
  font-size: 17px;
  font-weight: 700;
  min-width: 100px;
  text-align: center;
}

.arrow-btn {
  font-size: 20px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.2s;
}

.arrow-btn:hover {
  color: var(--color-primary);
}
</style>
