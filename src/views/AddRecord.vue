<template>
  <div class="add-record-page">
    <!-- 收支切换 -->
    <div class="type-switch">
      <div
        class="switch-btn"
        :class="{ 'switch-btn--expense': form.type === 'expense', 'switch-btn--active': form.type === 'expense' }"
        @click="switchType('expense')"
      >支出</div>
      <div
        class="switch-btn"
        :class="{ 'switch-btn--income': form.type === 'income', 'switch-btn--active': form.type === 'income' }"
        @click="switchType('income')"
      >收入</div>
    </div>

    <!-- 金额输入 -->
    <div class="amount-section card">
      <div class="amount-label">金额</div>
      <div class="amount-input-wrapper">
        <span class="currency-symbol">¥</span>
        <input
          ref="amountInput"
          v-model="amountStr"
          type="text"
          class="amount-input"
          placeholder="0.00"
          @input="onAmountInput"
          @focus="onAmountFocus"
        />
      </div>
    </div>

    <!-- 分类选择 -->
    <div class="card">
      <div class="section-label">分类</div>
      <CategoryPicker
        ref="categoryPickerRef"
        v-model="form.category_id"
        :type="form.type"
      />
    </div>

    <!-- 日期选择 -->
    <div class="card">
      <div class="section-label">日期</div>
      <el-date-picker
        v-model="form.date"
        type="date"
        placeholder="选择日期"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        class="date-picker-full"
      />
    </div>

    <!-- 备注 -->
    <div class="card">
      <div class="section-label">备注</div>
      <el-input
        v-model="form.note"
        placeholder="添加备注（可选）"
        maxlength="50"
        show-word-limit
        clearable
      />
    </div>

    <!-- 提交按钮 -->
    <div class="submit-section">
      <el-button
        type="primary"
        size="large"
        class="submit-btn"
        :class="form.type === 'expense' ? 'submit-btn--expense' : 'submit-btn--income'"
        :disabled="!canSubmit"
        @click="handleSubmit"
      >
        记一笔
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useRecordsStore } from '@/stores/records'
import { getToday } from '@/utils/format'
import CategoryPicker from '@/components/CategoryPicker.vue'

const recordsStore = useRecordsStore()
const categoryPickerRef = ref(null)
const amountInput = ref(null)

const amountStr = ref('')
const form = reactive({
  type: 'expense',
  amount: 0,
  category_id: null,
  date: getToday(),
  note: ''
})

const canSubmit = computed(() => {
  return form.amount > 0 && form.amount <= 999999999.99 && form.category_id !== null && form.date
})

function switchType(type) {
  if (form.type === type) return
  form.type = type
  form.category_id = null
  nextTick(() => {
    amountInput.value?.focus()
  })
}

function onAmountInput(e) {
  let val = e.target.value

  // 只允许数字和小数点
  val = val.replace(/[^\d.]/g, '')

  // 只允许一个小数点
  const parts = val.split('.')
  if (parts.length > 2) {
    val = parts[0] + '.' + parts.slice(1).join('')
  }

  // 小数点后最多两位
  if (parts.length === 2 && parts[1].length > 2) {
    val = parts[0] + '.' + parts[1].slice(0, 2)
  }

  // 限制整数部分最大9位
  if (parts[0].length > 9) {
    parts[0] = parts[0].slice(0, 9)
    val = parts.length === 2 ? parts[0] + '.' + parts[1] : parts[0]
  }

  amountStr.value = val
  form.amount = parseFloat(val) || 0
}

function onAmountFocus() {
  if (amountStr.value === '0') {
    amountStr.value = ''
  }
}

async function handleSubmit() {
  if (!canSubmit.value) return

  try {
    await recordsStore.addRecord({ ...form })
    ElMessage.success('记账成功！')
    resetForm()
    amountInput.value?.focus()
  } catch (err) {
    ElMessage.error('保存失败: ' + err.message)
  }
}

function resetForm() {
  amountStr.value = ''
  form.amount = 0
  form.category_id = null
  form.date = getToday()
  form.note = ''
  categoryPickerRef.value?.reset()
}

onMounted(() => {
  nextTick(() => {
    amountInput.value?.focus()
  })
})
</script>

<style scoped>
.add-record-page {
  padding-bottom: 20px;
}

.type-switch {
  display: flex;
  margin: 16px;
  background: var(--card-bg);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: var(--shadow);
}

.switch-btn {
  flex: 1;
  text-align: center;
  padding: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-secondary);
}

.switch-btn--active {
  color: #fff;
}

.switch-btn--expense.switch-btn--active {
  background: var(--color-expense);
}

.switch-btn--income.switch-btn--active {
  background: var(--color-income);
}

.amount-section {
  text-align: center;
  padding: 20px 16px;
}

.amount-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.amount-input-wrapper {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.currency-symbol {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}

.amount-input {
  width: 200px;
  border: none;
  outline: none;
  font-size: 40px;
  font-weight: 700;
  text-align: center;
  background: transparent;
  color: var(--text-primary);
  font-family: inherit;
}

.amount-input::placeholder {
  color: var(--text-placeholder);
}

.section-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.date-picker-full {
  width: 100%;
}

.submit-section {
  padding: 16px;
}

.submit-btn {
  width: 100%;
  height: 48px;
  font-size: 17px;
  font-weight: 600;
  border-radius: 12px;
}

.submit-btn--expense {
  --el-button-bg-color: var(--color-expense);
  --el-button-border-color: var(--color-expense);
  --el-button-hover-bg-color: #f78989;
  --el-button-hover-border-color: #f78989;
  --el-button-active-bg-color: #e04545;
  --el-button-active-border-color: #e04545;
}

.submit-btn--income {
  --el-button-bg-color: var(--color-income);
  --el-button-border-color: var(--color-income);
  --el-button-hover-bg-color: #85ce61;
  --el-button-hover-border-color: #85ce61;
  --el-button-active-bg-color: #529b2e;
  --el-button-active-border-color: #529b2e;
}
</style>
