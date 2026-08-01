const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // ========== 分类操作 ==========
  getCategories: (type) => ipcRenderer.invoke('db:getCategories', type),
  addCategory: (data) => ipcRenderer.invoke('db:addCategory', data),
  updateCategory: (id, data) => ipcRenderer.invoke('db:updateCategory', id, data),
  deleteCategory: (id) => ipcRenderer.invoke('db:deleteCategory', id),

  // ========== 记录操作 ==========
  getRecords: (params) => ipcRenderer.invoke('db:getRecords', params),
  addRecord: (data) => ipcRenderer.invoke('db:addRecord', data),
  updateRecord: (id, data) => ipcRenderer.invoke('db:updateRecord', id, data),
  deleteRecord: (id) => ipcRenderer.invoke('db:deleteRecord', id),

  // ========== 统计操作 ==========
  getMonthSummary: (year, month) => ipcRenderer.invoke('db:getMonthSummary', year, month),
  getCategoryStats: (year, month, type) => ipcRenderer.invoke('db:getCategoryStats', year, month, type),
  getMonthTrend: (year, type) => ipcRenderer.invoke('db:getMonthTrend', year, type),

  // ========== 数据管理 ==========
  exportCSV: (year, month) => ipcRenderer.invoke('db:exportCSV', year, month),
  backupDatabase: () => ipcRenderer.invoke('db:backup'),
  restoreDatabase: (filePath) => ipcRenderer.invoke('db:restore', filePath),
  getDbPath: () => ipcRenderer.invoke('db:getPath'),

  // ========== 对话框 ==========
  showSaveDialog: (options) => ipcRenderer.invoke('dialog:save', options),
  showOpenDialog: (options) => ipcRenderer.invoke('dialog:open', options)
})
