<template>
  <div class="record-item" @click="emit('click', record)">
    <div class="record-left">
      <span class="record-icon">{{ record.parent_icon || record.category_icon || '📌' }}</span>
      <div class="record-info">
        <span class="record-category">{{ record.parent_name }} · {{ record.category_name }}</span>
        <span v-if="record.note" class="record-note">{{ record.note }}</span>
      </div>
    </div>
    <div class="record-right">
      <span class="record-amount" :class="record.type === 'expense' ? 'amount-expense' : 'amount-income'">
        {{ record.type === 'expense' ? '-' : '+' }}¥{{ Math.abs(record.amount).toFixed(2) }}
      </span>
      <el-button
        type="danger"
        size="small"
        :icon="Delete"
        circle
        text
        @click.stop="handleDelete"
      />
    </div>
  </div>
</template>

<script setup>
import { Delete } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'

const props = defineProps({
  record: { type: Object, required: true }
})

const emit = defineEmits(['click', 'delete'])

function handleDelete() {
  ElMessageBox.confirm('确定删除这条记录吗？', '提示', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    emit('delete', props.record.id)
  }).catch(() => {})
}
</script>

<style scoped>
.record-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background 0.2s;
}

.record-item:last-child {
  border-bottom: none;
}

.record-item:hover {
  background: #fafafa;
  margin: 0 -8px;
  padding-left: 8px;
  padding-right: 8px;
  border-radius: 8px;
}

.record-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.record-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.record-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.record-category {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.record-note {
  font-size: 12px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-right {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.record-amount {
  font-size: 16px;
  font-weight: 600;
}
</style>
