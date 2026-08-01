<template>
  <div class="settings-page">
    <!-- 分类管理 -->
    <div class="section">
      <h3 class="section-title">分类管理</h3>

      <!-- Tab 支出/收入 -->
      <el-tabs v-model="catType" @tab-change="onCatTypeChange">
        <el-tab-pane label="支出分类" name="expense" />
        <el-tab-pane label="收入分类" name="income" />
      </el-tabs>

      <div class="category-list">
        <div v-for="parent in currentCategories" :key="parent.id" class="parent-cat">
          <div class="parent-header">
            <span class="parent-info">
              <span class="parent-icon">{{ parent.icon }}</span>
              <span class="parent-name">{{ parent.name }}</span>
              <el-tag size="small" type="info">{{ parent.children.length }}个子分类</el-tag>
            </span>
            <el-button
              v-if="!parent.is_preset"
              type="danger"
              size="small"
              text
              :icon="Delete"
              @click="onDeleteCategory(parent.id, parent.name)"
            />
          </div>

          <div class="children-list">
            <div v-for="child in parent.children" :key="child.id" class="child-item">
              <span class="child-name">{{ child.name }}</span>
              <div class="child-actions">
                <el-button
                  type="primary"
                  size="small"
                  text
                  :icon="Edit"
                  @click="showEditDialog(child)"
                />
                <el-button
                  v-if="!child.is_preset"
                  type="danger"
                  size="small"
                  text
                  :icon="Delete"
                  @click="onDeleteCategory(child.id, child.name)"
                />
              </div>
            </div>

            <!-- 添加二级分类 -->
            <div class="add-child">
              <el-button
                size="small"
                :icon="Plus"
                text
                type="primary"
                @click="showAddChildDialog(parent)"
              >
                添加子分类
              </el-button>
            </div>
          </div>
        </div>

        <!-- 添加一级分类 -->
        <el-button
          :icon="Plus"
          type="primary"
          plain
          size="small"
          class="add-parent-btn"
          @click="showAddParentDialog"
        >
          添加一级分类
        </el-button>
      </div>
    </div>

    <!-- 数据管理 -->
    <div class="section">
      <h3 class="section-title">数据管理</h3>
      <div class="data-actions">
        <el-button :icon="Upload" @click="handleBackup" plain>备份数据</el-button>
        <el-button :icon="Download" @click="handleRestore" plain>恢复数据</el-button>
        <el-button :icon="Document" @click="handleExportAll" plain>导出 CSV</el-button>
      </div>
    </div>

    <!-- 关于 -->
    <div class="section">
      <h3 class="section-title">关于</h3>
      <div class="about-info">
        <p>🐴 小马记账 v1.0.0</p>
        <p class="about-desc">一款简洁的个人记账桌面应用</p>
        <p class="about-db" @click="handleShowDbPath">数据库位置: 点击查看</p>
      </div>
    </div>

    <!-- 编辑/添加分类对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="320px"
      :close-on-click-modal="false"
    >
      <el-form :model="dialogForm" label-position="top">
        <el-form-item label="分类名称">
          <el-input v-model="dialogForm.name" placeholder="请输入分类名称" maxlength="10" />
        </el-form-item>
        <el-form-item v-if="dialogForm.isParent" label="图标 (Emoji)">
          <el-input v-model="dialogForm.icon" placeholder="如: 🍜" maxlength="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleDialogConfirm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, Plus, Upload, Download, Document } from '@element-plus/icons-vue'
import { useCategoriesStore } from '@/stores/categories'

const api = window.electronAPI
const categoriesStore = useCategoriesStore()

const catType = ref('expense')

const currentCategories = computed(() =>
  catType.value === 'expense'
    ? categoriesStore.expenseCategories
    : categoriesStore.incomeCategories
)

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('')
const dialogForm = ref({ name: '', icon: '', isParent: false, parentId: null, editId: null })

function showAddParentDialog() {
  dialogTitle.value = '添加一级分类'
  dialogForm.value = { name: '', icon: '📌', isParent: true, parentId: null, editId: null }
  dialogVisible.value = true
}

function showAddChildDialog(parent) {
  dialogTitle.value = `添加「${parent.name}」的子分类`
  dialogForm.value = { name: '', icon: '', isParent: false, parentId: parent.id, editId: null }
  dialogVisible.value = true
}

function showEditDialog(cat) {
  dialogTitle.value = '编辑分类'
  dialogForm.value = {
    name: cat.name,
    icon: cat.icon || '',
    isParent: cat.parent_id === null,
    parentId: cat.parent_id,
    editId: cat.id
  }
  dialogVisible.value = true
}

async function handleDialogConfirm() {
  if (!dialogForm.value.name.trim()) {
    ElMessage.warning('请输入分类名称')
    return
  }

  try {
    if (dialogForm.value.editId) {
      // 编辑
      await categoriesStore.updateCategory(dialogForm.value.editId, {
        name: dialogForm.value.name,
        icon: dialogForm.value.icon,
        type: catType.value
      })
      ElMessage.success('已更新')
    } else {
      // 新增
      await categoriesStore.addCategory({
        name: dialogForm.value.name,
        icon: dialogForm.value.icon || null,
        parent_id: dialogForm.value.parentId,
        type: catType.value,
        sort_order: 99
      })
      ElMessage.success('已添加')
    }
    dialogVisible.value = false
  } catch (err) {
    ElMessage.error('操作失败')
  }
}

async function onDeleteCategory(id, name) {
  try {
    await ElMessageBox.confirm(
      `确定删除「${name}」吗？该分类下的记录将移至"其他"分类。`,
      '确认删除',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    )
    await categoriesStore.deleteCategory(id, catType.value)
    ElMessage.success('已删除')
  } catch { /* 取消 */ }
}

async function handleBackup() {
  const result = await api.backupDatabase()
  if (result.success) ElMessage.success('备份成功！')
}

async function handleRestore() {
  try {
    await ElMessageBox.confirm('恢复数据将覆盖当前所有数据，确定继续吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const result = await api.restoreDatabase()
    if (result.success) {
      ElMessage.success('恢复成功！请重新启动应用。')
    }
  } catch { /* 取消 */ }
}

async function handleExportAll() {
  const now = new Date()
  const result = await api.exportCSV(now.getFullYear(), now.getMonth() + 1)
  if (result?.success) ElMessage.success('导出成功！')
}

async function handleShowDbPath() {
  const dbPath = await api.getDbPath()
  ElMessage.info(`数据库位置: ${dbPath}`)
}

onMounted(() => {
  categoriesStore.fetchCategories()
})

function onCatTypeChange() {
  // 切换 tab 时刷新
  categoriesStore.fetchCategories(catType.value)
}
</script>

<style scoped>
.settings-page {
  padding-bottom: 20px;
}

.section {
  margin: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.parent-cat {
  background: var(--card-bg);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 8px;
  box-shadow: var(--shadow);
}

.parent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.parent-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.parent-icon {
  font-size: 20px;
}

.parent-name {
  font-size: 15px;
  font-weight: 600;
}

.children-list {
  padding-left: 8px;
}

.child-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  border-radius: 6px;
}

.child-item:hover {
  background: var(--bg-color);
}

.child-name {
  font-size: 13px;
  color: var(--text-primary);
}

.child-actions {
  display: flex;
  gap: 2px;
}

.add-child {
  padding: 4px 0;
}

.add-parent-btn {
  width: 100%;
  margin-top: 8px;
}

.data-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.about-info {
  background: var(--card-bg);
  border-radius: 10px;
  padding: 16px;
  text-align: center;
  box-shadow: var(--shadow);
}

.about-info p {
  font-size: 14px;
  margin-bottom: 4px;
}

.about-desc {
  color: var(--text-secondary);
  font-size: 13px !important;
}

.about-db {
  color: var(--color-primary);
  cursor: pointer;
  font-size: 12px !important;
  margin-top: 8px !important;
}
</style>
