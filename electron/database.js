const initSqlJs = require('sql.js')
const path = require('path')
const fs = require('fs')
const { app } = require('electron')

let db = null
let SQL = null
let dbPath = ''

// 预设分类数据
const PRESET_CATEGORIES = {
  expense: [
    { name: '餐饮', icon: '🍜', children: ['早餐', '午餐', '晚餐', '零食饮料', '聚餐', '外卖'] },
    { name: '交通', icon: '🚗', children: ['公交地铁', '打车', '加油充电', '停车费', '车辆保养', '火车机票'] },
    { name: '购物', icon: '🛒', children: ['衣服鞋帽', '数码产品', '家居用品', '个护美妆', '日用百货'] },
    { name: '居住', icon: '🏠', children: ['房租', '水电燃气', '物业费', '维修装修', '居家日用'] },
    { name: '医疗', icon: '💊', children: ['门诊挂号', '药品器械', '体检', '住院'] },
    { name: '教育', icon: '📚', children: ['培训课程', '书籍文具', '考试报名', '学费'] },
    { name: '娱乐', icon: '🎮', children: ['游戏充值', '电影演出', '旅游度假', '运动健身', '宠物开销'] },
    { name: '通讯', icon: '💬', children: ['手机话费', '宽带上网', '快递邮寄'] },
    { name: '人情', icon: '👨‍👩‍👧', children: ['红包礼金', '孝敬父母', '请客送礼', '婚礼生日'] },
    { name: '其他', icon: '🔧', children: ['杂项支出'] }
  ],
  income: [
    { name: '职业收入', icon: '💼', children: ['工资', '奖金', '兼职', '报销'] },
    { name: '投资理财', icon: '📈', children: ['股票基金', '利息', '房租收入'] },
    { name: '其他收入', icon: '🎁', children: ['红包礼金', '退款', '其他'] }
  ]
}

function getDbPath() {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'xiaoma-accounting.db')
}

// 保存数据库到磁盘
function saveToDisk() {
  if (!db) return
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(dbPath, buffer)
}

// 将 exec 结果的一行转为对象
function rowToObject(columns, values) {
  const obj = {}
  columns.forEach((col, i) => {
    obj[col] = values[i]
  })
  return obj
}

// 执行 SELECT 并返回对象数组
function selectAll(sql, params = []) {
  const stmt = db.prepare(sql)
  if (params.length > 0) stmt.bind(params)
  const results = []
  while (stmt.step()) {
    results.push(stmt.getAsObject())
  }
  stmt.free()
  return results
}

// 执行 SELECT 并返回单行对象
function selectOne(sql, params = []) {
  const rows = selectAll(sql, params)
  return rows.length > 0 ? rows[0] : null
}

// 执行 INSERT/UPDATE/DELETE
function run(sql, params = []) {
  db.run(sql, params)
  saveToDisk()
  // 获取最后插入的 rowid
  const lastId = selectOne('SELECT last_insert_rowid() as id')
  return { changes: db.getRowsModified(), lastInsertRowid: lastId ? lastId.id : 0 }
}

async function initDatabase() {
  dbPath = getDbPath()
  SQL = await initSqlJs()

  // 尝试从磁盘加载已有数据库
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath)
    db = new SQL.Database(fileBuffer)
  } else {
    db = new SQL.Database()
  }

  // 启用外键
  db.run('PRAGMA foreign_keys = ON')

  // 建表
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_id INTEGER,
      type TEXT NOT NULL CHECK(type IN ('expense','income')),
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      is_preset INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('expense','income')),
      amount REAL NOT NULL,
      category_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `)

  // 创建索引
  db.run('CREATE INDEX IF NOT EXISTS idx_records_date ON records(date)')
  db.run('CREATE INDEX IF NOT EXISTS idx_records_category ON records(category_id)')
  db.run('CREATE INDEX IF NOT EXISTS idx_records_type ON records(type)')

  saveToDisk()

  // 插入预设分类（如果表为空）
  const countRow = selectOne('SELECT COUNT(*) as count FROM categories')
  if (countRow.count === 0) {
    for (const type of ['expense', 'income']) {
      PRESET_CATEGORIES[type].forEach((cat, i) => {
        const parentResult = run(
          'INSERT INTO categories (name, parent_id, type, icon, sort_order, is_preset) VALUES (?, ?, ?, ?, ?, 1)',
          [cat.name, null, type, cat.icon, i]
        )
        const parentId = parentResult.lastInsertRowid
        cat.children.forEach((childName, j) => {
          run(
            'INSERT INTO categories (name, parent_id, type, icon, sort_order, is_preset) VALUES (?, ?, ?, ?, ?, 1)',
            [childName, parentId, type, null, j]
          )
        })
      })
    }
    saveToDisk()
  }

  return db
}

function getDatabase() {
  return { selectAll, selectOne, run, saveToDisk }
}

function closeDatabase() {
  if (db) {
    saveToDisk()
    db.close()
    db = null
  }
}

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase,
  getDbPath
}
