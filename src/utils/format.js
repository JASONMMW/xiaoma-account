/**
 * 金额格式化
 * @param {number} amount - 金额
 * @param {boolean} showSign - 是否显示正负号
 * @returns {string}
 */
export function formatAmount(amount, showSign = false) {
  const fixed = Number(amount).toFixed(2)
  if (showSign) {
    return amount >= 0 ? `+¥${fixed}` : `-¥${Math.abs(amount).toFixed(2)}`
  }
  return `¥${fixed}`
}

/**
 * 格式化支出金额（红色显示）
 * @param {number} amount
 * @returns {string}
 */
export function formatExpense(amount) {
  return `-¥${Number(Math.abs(amount)).toFixed(2)}`
}

/**
 * 格式化收入金额（绿色显示）
 * @param {number} amount
 * @returns {string}
 */
export function formatIncome(amount) {
  return `+¥${Number(amount).toFixed(2)}`
}

/**
 * 获取当前日期字符串 YYYY-MM-DD
 * @returns {string}
 */
export function getToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * 获取当前年月
 * @returns {{ year: number, month: number }}
 */
export function getCurrentYearMonth() {
  const d = new Date()
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

/**
 * 格式化日期为中文
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {string}
 */
export function formatDateCN(dateStr) {
  const d = new Date(dateStr)
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getMonth() + 1}月${d.getDate()}日 周${weekDays[d.getDay()]}`
}

/**
 * 月份选项列表
 * @returns {Array<{label: string, value: string}>}
 */
export function getMonthOptions() {
  const now = new Date()
  const options = []
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    options.push({
      label: `${d.getFullYear()}年${d.getMonth() + 1}月`,
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    })
  }
  return options
}
