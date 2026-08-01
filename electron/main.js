const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const { initDatabase, getDatabase, closeDatabase, getDbPath } = require('./database')

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 720,
    minWidth: 380,
    minHeight: 600,
    title: '小马记账',
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    autoHideMenuBar: true
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ========== IPC Handlers ==========

function registerIpcHandlers() {
  const db = getDatabase()

  // --- 分类 ---
  ipcMain.handle('db:getCategories', (_event, type) => {
    let categories
    if (type) {
      categories = db.selectAll(
        'SELECT * FROM categories WHERE type = ? ORDER BY sort_order, id',
        [type]
      )
    } else {
      categories = db.selectAll('SELECT * FROM categories ORDER BY sort_order, id')
    }

    const parents = categories.filter(c => c.parent_id === null)
    const children = categories.filter(c => c.parent_id !== null)

    return parents.map(p => ({
      ...p,
      children: children.filter(c => c.parent_id === p.id)
    }))
  })

  ipcMain.handle('db:addCategory', (_event, data) => {
    const result = db.run(
      'INSERT INTO categories (name, parent_id, type, icon, sort_order, is_preset) VALUES (?, ?, ?, ?, ?, 0)',
      [data.name, data.parent_id || null, data.type, data.icon || null, data.sort_order || 0]
    )
    return { id: result.lastInsertRowid, ...data }
  })

  ipcMain.handle('db:updateCategory', (_event, id, data) => {
    const result = db.run(
      'UPDATE categories SET name = ?, icon = ? WHERE id = ? AND is_preset = 0',
      [data.name, data.icon, id]
    )
    return result.changes > 0
  })

  ipcMain.handle('db:deleteCategory', (_event, id) => {
    const cat = db.selectOne('SELECT * FROM categories WHERE id = ?', [id])
    if (!cat) return false
    if (cat.is_preset) return false

    if (cat.parent_id === null) {
      db.run('DELETE FROM categories WHERE parent_id = ?', [id])
    }

    // 将该分类下的记录移到"其他"分类
    const records = db.selectAll('SELECT id FROM records WHERE category_id = ?', [id])
    if (records.length > 0) {
      const defaultCat = db.selectOne(
        "SELECT id FROM categories WHERE name = ? AND type = ? AND parent_id IS NOT NULL LIMIT 1",
        [cat.type === 'expense' ? '杂项支出' : '其他', cat.type]
      )
      if (defaultCat) {
        db.run('UPDATE records SET category_id = ? WHERE category_id = ?', [defaultCat.id, id])
      }
    }

    db.run('DELETE FROM categories WHERE id = ?', [id])
    return true
  })

  // --- 记录 ---
  ipcMain.handle('db:getRecords', (_event, params = {}) => {
    const { year, month, type, page = 1, pageSize = 100 } = params
    let sql = `SELECT r.*, c.name as category_name, c.icon as category_icon,
               p.name as parent_name, p.icon as parent_icon
               FROM records r
               LEFT JOIN categories c ON r.category_id = c.id
               LEFT JOIN categories p ON c.parent_id = p.id
               WHERE 1=1`
    const args = []

    if (year) {
      sql += " AND strftime('%Y', r.date) = ?"
      args.push(String(year))
    }
    if (month) {
      sql += " AND strftime('%m', r.date) = ?"
      args.push(String(month).padStart(2, '0'))
    }
    if (type) {
      sql += ' AND r.type = ?'
      args.push(type)
    }

    // 获取总数
    let countSql = sql.replace(
      /SELECT r\.\*.*?FROM/,
      'SELECT COUNT(*) as total FROM'
    )
    // 移除 ORDER BY 后面的部分
    countSql = countSql.replace(/ORDER BY.*$/, '')
    const countRow = db.selectOne(countSql, args)
    const total = countRow ? countRow.total : 0

    // 添加排序和分页
    sql += ' ORDER BY r.date DESC, r.created_at DESC'
    sql += ' LIMIT ? OFFSET ?'
    args.push(pageSize, (page - 1) * pageSize)

    const records = db.selectAll(sql, args)

    // 按日期分组
    const grouped = {}
    records.forEach(r => {
      if (!grouped[r.date]) grouped[r.date] = []
      grouped[r.date].push(r)
    })

    return { grouped, total, records }
  })

  ipcMain.handle('db:addRecord', (_event, data) => {
    const result = db.run(
      "INSERT INTO records (type, amount, category_id, date, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now','localtime'), datetime('now','localtime'))",
      [data.type, data.amount, data.category_id, data.date, data.note || '']
    )
    return { id: result.lastInsertRowid, ...data }
  })

  ipcMain.handle('db:updateRecord', (_event, id, data) => {
    const result = db.run(
      "UPDATE records SET type = ?, amount = ?, category_id = ?, date = ?, note = ?, updated_at = datetime('now','localtime') WHERE id = ?",
      [data.type, data.amount, data.category_id, data.date, data.note || '', id]
    )
    return result.changes > 0
  })

  ipcMain.handle('db:deleteRecord', (_event, id) => {
    const result = db.run('DELETE FROM records WHERE id = ?', [id])
    return result.changes > 0
  })

  // --- 统计 ---
  ipcMain.handle('db:getMonthSummary', (_event, year, month) => {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`
    const expenseRow = db.selectOne(
      "SELECT COALESCE(SUM(amount), 0) as total FROM records WHERE type = 'expense' AND strftime('%Y-%m', date) = ?",
      [monthStr]
    )
    const incomeRow = db.selectOne(
      "SELECT COALESCE(SUM(amount), 0) as total FROM records WHERE type = 'income' AND strftime('%Y-%m', date) = ?",
      [monthStr]
    )
    return {
      expenseTotal: expenseRow ? expenseRow.total : 0,
      incomeTotal: incomeRow ? incomeRow.total : 0
    }
  })

  ipcMain.handle('db:getCategoryStats', (_event, year, month, type) => {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`
    const stats = db.selectAll(`
      SELECT p.id, p.name, p.icon, COALESCE(SUM(r.amount), 0) as total
      FROM categories p
      LEFT JOIN categories c ON c.parent_id = p.id
      LEFT JOIN records r ON r.category_id = c.id AND r.type = ? AND strftime('%Y-%m', r.date) = ?
      WHERE p.parent_id IS NULL AND p.type = ?
      GROUP BY p.id
      ORDER BY total DESC
    `, [type, monthStr, type])
    return stats
  })

  ipcMain.handle('db:getMonthTrend', (_event, year, type) => {
    const yearStr = String(year)
    const months = []
    for (let m = 1; m <= 12; m++) {
      const monthStr = `${yearStr}-${String(m).padStart(2, '0')}`
      const row = db.selectOne(
        "SELECT COALESCE(SUM(amount), 0) as total FROM records WHERE type = ? AND strftime('%Y-%m', date) = ?",
        [type, monthStr]
      )
      months.push({ month: m, total: row ? row.total : 0 })
    }
    return months
  })

  // --- 数据管理 ---
  ipcMain.handle('db:exportCSV', async (_event, year, month) => {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: '导出 CSV',
      defaultPath: `小马记账_${year}${month ? '_' + String(month).padStart(2, '0') : ''}.csv`,
      filters: [{ name: 'CSV 文件', extensions: ['csv'] }]
    })
    if (!filePath) return { success: false, message: '已取消' }

    const monthStr = month ? `${year}-${String(month).padStart(2, '0')}` : null
    let sql = `SELECT r.type, r.amount, r.date, c.name as category_name,
               p.name as parent_name, r.note
               FROM records r
               LEFT JOIN categories c ON r.category_id = c.id
               LEFT JOIN categories p ON c.parent_id = p.id`
    const args = []
    if (monthStr) {
      sql += " WHERE strftime('%Y-%m', r.date) = ?"
      args.push(monthStr)
    }
    sql += ' ORDER BY r.date DESC, r.created_at DESC'

    const records = db.selectAll(sql, args)

    const BOM = '﻿'
    const header = '类型,金额,日期,一级分类,二级分类,备注\n'
    const typeMap = { expense: '支出', income: '收入' }
    const rows = records.map(r =>
      `"${typeMap[r.type] || r.type}","${r.amount}","${r.date}","${r.parent_name || ''}","${r.category_name || ''}","${(r.note || '').replace(/"/g, '""')}"`
    ).join('\n')

    fs.writeFileSync(filePath, BOM + header + rows, 'utf-8')
    return { success: true, filePath }
  })

  ipcMain.handle('db:backup', async () => {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: '备份数据库',
      defaultPath: `小马记账_备份_${new Date().toISOString().slice(0, 10)}.db`,
      filters: [{ name: '数据库文件', extensions: ['db'] }]
    })
    if (!filePath) return { success: false, message: '已取消' }

    // sql.js 导出
    const data = db.export()
    fs.writeFileSync(filePath, Buffer.from(data))
    return { success: true, filePath }
  })

  ipcMain.handle('db:restore', async () => {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: '恢复数据库',
      filters: [{ name: '数据库文件', extensions: ['db'] }],
      properties: ['openFile']
    })
    if (!filePaths || filePaths.length === 0) return { success: false, message: '已取消' }

    const srcPath = filePaths[0]
    closeDatabase()
    fs.copyFileSync(srcPath, getDbPath())
    await initDatabase()
    registerIpcHandlers()
    return { success: true }
  })

  ipcMain.handle('db:getPath', () => {
    return getDbPath()
  })

  // --- 对话框 ---
  ipcMain.handle('dialog:save', async (_event, options) => {
    return await dialog.showSaveDialog(mainWindow, options)
  })

  ipcMain.handle('dialog:open', async (_event, options) => {
    return await dialog.showOpenDialog(mainWindow, options)
  })
}

// ========== App 生命周期 ==========

app.whenReady().then(async () => {
  await initDatabase()
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  closeDatabase()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  closeDatabase()
})
