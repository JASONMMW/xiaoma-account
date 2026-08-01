<template>
  <div class="app-container">
    <!-- 顶部标题栏 -->
    <header class="app-header">
      <span class="app-logo">🐴</span>
      <span class="app-title">小马记账</span>
    </header>

    <!-- 主内容区域 -->
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- 底部导航栏 -->
    <nav class="bottom-nav">
      <router-link to="/add" class="nav-item" active-class="nav-item--active">
        <el-icon :size="22"><EditPen /></el-icon>
        <span>记账</span>
      </router-link>
      <router-link to="/bills" class="nav-item" active-class="nav-item--active">
        <el-icon :size="22"><List /></el-icon>
        <span>账单</span>
      </router-link>
      <router-link to="/stats" class="nav-item" active-class="nav-item--active">
        <el-icon :size="22"><DataAnalysis /></el-icon>
        <span>统计</span>
      </router-link>
      <router-link to="/settings" class="nav-item" active-class="nav-item--active">
        <el-icon :size="22"><Setting /></el-icon>
        <span>设置</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useCategoriesStore } from '@/stores/categories'

const categoriesStore = useCategoriesStore()

onMounted(() => {
  categoriesStore.fetchCategories()
})
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.app-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  -webkit-app-region: drag;
}

.app-logo {
  font-size: 24px;
}

.app-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
}

.app-main {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 8px;
}

.bottom-nav {
  display: flex;
  background: var(--card-bg);
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
  padding: 6px 0;
  padding-bottom: env(safe-area-inset-bottom, 6px);
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 11px;
  padding: 4px 0;
  transition: color 0.2s;
}

.nav-item--active {
  color: var(--color-primary);
}
</style>
