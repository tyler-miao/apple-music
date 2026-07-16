const express = require('express')
const app = express()
const PORT = 3002

const API_BASE = process.env.API_URL || 'http://localhost:4000'

app.use(express.json())

// Proxy API requests to backend
app.use('/api/*', async (req, res) => {
  try {
    const path = req.originalUrl
    const headers = { 'Content-Type': 'application/json' }
    if (req.headers.authorization) headers['Authorization'] = req.headers.authorization
    const opts = { method: req.method, headers }
    if (req.method !== 'GET' && req.method !== 'HEAD') opts.body = JSON.stringify(req.body)
    const response = await fetch(`${API_BASE}${path}`, opts)
    const data = await response.text()
    res.status(response.status)
    try { res.json(JSON.parse(data)) } catch { res.send(data) }
  } catch (e) {
    res.status(502).json({ error: '后端不可用' })
  }
})

app.get('*', (_req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Open Music - 管理后台</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+SC:wght@300;400;500;700&display=swap" rel="stylesheet">
<style>
:root {
  --bg-primary: #0a0a0c;
  --bg-secondary: #111114;
  --bg-card: #16161a;
  --bg-hover: #1c1c22;
  --border: rgba(255,255,255,0.06);
  --border-active: rgba(245,197,24,0.3);
  --text-primary: #f0f0f2;
  --text-secondary: rgba(255,255,255,0.5);
  --text-muted: rgba(255,255,255,0.3);
  --accent: #f5c518;
  --accent-dim: rgba(245,197,24,0.12);
  --red: #ef4444;
  --red-dim: rgba(239,68,68,0.12);
  --blue: #60a5fa;
  --blue-dim: rgba(96,165,250,0.12);
  --green: #4ade80;
  --green-dim: rgba(74,222,128,0.12);
  --purple: #c084fc;
  --purple-dim: rgba(192,132,252,0.12);
  --orange: #fb923c;
  --orange-dim: rgba(251,146,60,0.12);
  --sidebar-w: 240px;
  --radius: 12px;
  --radius-sm: 8px;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Inter', 'Noto Sans SC', -apple-system, sans-serif;
  min-height: 100vh;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

/* ===== SIDEBAR ===== */
.sidebar {
  position: fixed; left: 0; top: 0; bottom: 0;
  width: var(--sidebar-w);
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column;
  z-index: 100;
  transition: transform .3s cubic-bezier(.4,0,.2,1);
}
.sidebar-brand {
  padding: 28px 24px 24px;
  border-bottom: 1px solid var(--border);
}
.sidebar-brand h1 {
  font-size: 18px; font-weight: 700;
  color: var(--accent);
  letter-spacing: -0.3px;
  display: flex; align-items: center; gap: 10px;
}
.sidebar-brand h1 .icon { font-size: 22px; }
.sidebar-brand p {
  font-size: 11px; color: var(--text-muted);
  margin-top: 4px; letter-spacing: 0.5px; text-transform: uppercase;
}
.sidebar-nav { flex: 1; padding: 16px 12px; }
.nav-section {
  font-size: 10px; font-weight: 600; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: 1px;
  padding: 8px 12px 8px; margin-top: 8px;
}
.nav-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: var(--radius-sm);
  cursor: pointer; transition: all .15s;
  font-size: 13px; font-weight: 500;
  color: var(--text-secondary);
  border: 1px solid transparent;
}
.nav-item:hover { background: var(--bg-hover); color: var(--text-primary); }
.nav-item.active {
  background: var(--accent-dim);
  color: var(--accent);
  border-color: var(--border-active);
}
.nav-item .nav-icon { font-size: 16px; width: 20px; text-align: center; }
.sidebar-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border);
}
.sidebar-footer .version {
  font-size: 10px; color: var(--text-muted);
  letter-spacing: 0.5px;
}

/* ===== MAIN ===== */
.main {
  margin-left: var(--sidebar-w);
  min-height: 100vh;
  padding: 32px 40px;
}
.page-header {
  margin-bottom: 32px;
}
.page-header h2 {
  font-size: 24px; font-weight: 700;
  letter-spacing: -0.5px;
}
.page-header p {
  font-size: 13px; color: var(--text-secondary);
  margin-top: 4px;
}

/* ===== STATS GRID ===== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}
.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  position: relative;
  overflow: hidden;
  transition: all .2s;
}
.stat-card:hover {
  border-color: rgba(255,255,255,0.1);
  transform: translateY(-1px);
}
.stat-card .stat-icon {
  width: 40px; height: 40px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  margin-bottom: 16px;
}
.stat-card .stat-value {
  font-size: 32px; font-weight: 800;
  letter-spacing: -1px;
  line-height: 1;
}
.stat-card .stat-label {
  font-size: 12px; color: var(--text-secondary);
  margin-top: 8px; font-weight: 500;
}
.stat-card .stat-glow {
  position: absolute; top: -20px; right: -20px;
  width: 80px; height: 80px;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.15;
}

/* ===== CARDS ===== */
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}
.card-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
}
.card-header h3 {
  font-size: 14px; font-weight: 600;
}
.card-body { padding: 24px; }

/* ===== CHART ===== */
.chart-container {
  position: relative;
  height: 200px;
  display: flex;
  align-items: flex-end;
  gap: 2px;
  padding: 0 4px;
}
.chart-bar {
  flex: 1;
  background: var(--accent);
  border-radius: 3px 3px 0 0;
  min-height: 2px;
  opacity: 0.7;
  transition: all .2s;
  position: relative;
  cursor: pointer;
}
.chart-bar:hover {
  opacity: 1;
  transform: scaleY(1.05);
  transform-origin: bottom;
}
.chart-bar .tooltip {
  display: none;
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 11px;
  white-space: nowrap;
  color: var(--text-primary);
  z-index: 10;
  pointer-events: none;
}
.chart-bar:hover .tooltip { display: block; }
.chart-labels {
  display: flex;
  justify-content: space-between;
  padding: 8px 4px 0;
  font-size: 10px;
  color: var(--text-muted);
}

/* ===== TABLE ===== */
.table-toolbar {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
}
.search-input {
  flex: 1;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 9px 14px;
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  transition: border-color .2s;
  font-family: inherit;
}
.search-input:focus { border-color: var(--accent); }
.search-input::placeholder { color: var(--text-muted); }
table {
  width: 100%;
  border-collapse: collapse;
}
th {
  text-align: left;
  padding: 12px 24px;
  font-size: 11px; font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border);
  background: rgba(255,255,255,0.02);
}
td {
  padding: 14px 24px;
  font-size: 13px;
  border-bottom: 1px solid var(--border);
  color: var(--text-secondary);
}
tr:hover td { background: rgba(255,255,255,0.02); }
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
}
.badge-admin { background: var(--accent-dim); color: var(--accent); }
.badge-user { background: var(--blue-dim); color: var(--blue); }
.badge-netease { background: var(--green-dim); color: var(--green); }
.badge-kuwo { background: var(--purple-dim); color: var(--purple); }
.badge-kugou { background: var(--orange-dim); color: var(--orange); }

/* ===== BUTTONS ===== */
.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  border: none;
  font-size: 12px; font-weight: 600;
  cursor: pointer;
  transition: all .15s;
  font-family: inherit;
}
.btn-primary {
  background: var(--accent);
  color: #000;
}
.btn-primary:hover { background: #e0b014; }
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border);
}
.btn-ghost:hover { background: var(--bg-hover); color: var(--text-primary); }
.btn-danger {
  background: var(--red-dim);
  color: var(--red);
}
.btn-danger:hover { background: rgba(239,68,68,0.2); }
.btn-sm { padding: 6px 12px; font-size: 11px; }
.btn-icon {
  width: 32px; height: 32px; padding: 0;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 8px;
}

/* ===== SELECT ===== */
.select-input {
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 6px 10px;
  color: var(--text-primary);
  font-size: 12px;
  outline: none;
  cursor: pointer;
  font-family: inherit;
}
.select-input:focus { border-color: var(--accent); }

/* ===== PAGINATION ===== */
.pagination {
  display: flex; align-items: center; justify-content: center;
  gap: 4px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
}
.page-btn {
  min-width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px; font-weight: 500;
  cursor: pointer;
  transition: all .15s;
  font-family: inherit;
}
.page-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
.page-btn.active {
  background: var(--accent-dim);
  color: var(--accent);
  border-color: var(--border-active);
}
.page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.page-info {
  font-size: 12px; color: var(--text-muted);
  padding: 0 8px;
}

/* ===== LOGIN ===== */
.login-wrapper {
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-primary);
  margin-left: 0;
}
.login-card {
  width: 380px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 48px 40px;
  text-align: center;
}
.login-card .logo {
  font-size: 48px;
  margin-bottom: 8px;
}
.login-card h2 {
  font-size: 20px; font-weight: 700;
  margin-bottom: 4px;
}
.login-card .subtitle {
  font-size: 13px; color: var(--text-secondary);
  margin-bottom: 32px;
}
.login-card input {
  width: 100%;
  padding: 12px 16px;
  margin-bottom: 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color .2s;
  font-family: inherit;
}
.login-card input:focus { border-color: var(--accent); }
.login-card input::placeholder { color: var(--text-muted); }
.login-card .login-btn {
  width: 100%;
  padding: 12px;
  border-radius: var(--radius-sm);
  border: none;
  background: var(--accent);
  color: #000;
  font-size: 14px; font-weight: 700;
  cursor: pointer;
  transition: all .15s;
  margin-top: 4px;
  font-family: inherit;
}
.login-card .login-btn:hover { background: #e0b014; }
.login-card .login-btn:active { transform: scale(0.98); }
.login-error {
  color: var(--red);
  font-size: 12px;
  margin-bottom: 8px;
  min-height: 18px;
}

/* ===== CONFIG ===== */
.config-grid {
  display: grid; gap: 20px;
  max-width: 640px;
}
.config-field label {
  display: block;
  font-size: 12px; font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.config-field input {
  width: 100%;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  transition: border-color .2s;
  font-family: inherit;
}
.config-field input:focus { border-color: var(--accent); }
.config-save-row {
  display: flex; align-items: center; gap: 12px;
  margin-top: 8px;
}
.config-saved {
  color: var(--green);
  font-size: 12px; font-weight: 500;
  opacity: 0;
  transition: opacity .3s;
}
.config-saved.show { opacity: 1; }

/* ===== EMPTY STATE ===== */
.empty-state {
  text-align: center;
  padding: 60px 24px;
  color: var(--text-muted);
}
.empty-state .empty-icon { font-size: 48px; margin-bottom: 12px; opacity: 0.3; }
.empty-state p { font-size: 13px; }

/* ===== LOADING ===== */
.loading {
  display: flex; align-items: center; justify-content: center;
  padding: 48px;
  color: var(--text-muted);
  font-size: 13px;
  gap: 8px;
}
.spinner {
  width: 16px; height: 16px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin .6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== ANIMATIONS ===== */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.fade-in { animation: fadeIn .3s ease-out; }

/* ===== VISITOR SUMMARY ===== */
.visitor-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}
.visitor-stat {
  text-align: center;
  padding: 16px;
  background: rgba(255,255,255,0.02);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}
.visitor-stat .num {
  font-size: 24px; font-weight: 800;
  letter-spacing: -0.5px;
}
.visitor-stat .label {
  font-size: 11px; color: var(--text-muted);
  margin-top: 4px; font-weight: 500;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .sidebar { transform: translateX(-100%); }
  .sidebar.open { transform: translateX(0); }
  .main { margin-left: 0; padding: 20px; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .visitor-summary { grid-template-columns: 1fr; }
}
</style>
</head>
<body>
<div id="app"></div>
<script>
let token = localStorage.getItem('admin_token')
let currentTab = 'dashboard'
let userPage = 1, musicPage = 1
let userSearch = '', musicSearch = ''

async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = 'Bearer ' + token
  const res = await fetch(path, { ...opts, headers })
  if (res.status === 401) { token = null; localStorage.removeItem('admin_token'); render(); throw new Error('Unauthorized') }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

async function login() {
  const id = document.getElementById('loginIdentifier').value.trim()
  const pass = document.getElementById('loginPass').value
  const errEl = document.getElementById('loginError')
  errEl.textContent = ''
  try {
    const data = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ identifier: id, password: pass }) })
    token = data.accessToken
    localStorage.setItem('admin_token', data.accessToken)
    render()
  } catch (e) { errEl.textContent = e.message || '登录失败' }
}

function logout() {
  token = null
  localStorage.removeItem('admin_token')
  render()
}

function navigate(tab) {
  currentTab = tab
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.tab === tab))
  renderPage()
}

function renderPage() {
  const content = document.getElementById('pageContent')
  if (!content) return
  if (currentTab === 'dashboard') renderDashboard(content)
  else if (currentTab === 'visitors') renderVisitors(content)
  else if (currentTab === 'users') renderUsers(content)
  else if (currentTab === 'music') renderMusic(content)
  else if (currentTab === 'config') renderConfig(content)
}

async function renderDashboard(el) {
  el.innerHTML = '<div class="loading"><div class="spinner"></div>加载中...</div>'
  try {
    const [stats, visits] = await Promise.all([
      api('/api/admin/stats'),
      api('/api/admin/visits')
    ])
    el.innerHTML = '<div class="fade-in">' +
      '<div class="page-header"><h2>仪表盘</h2><p>Open Music 平台运行概况</p></div>' +
      '<div class="stats-grid">' +
        statCard('', stats.totalUsers || 0, '注册用户', 'var(--blue)', 'var(--blue-dim)') +
        statCard('', stats.totalMusic || 0, '音乐曲库', 'var(--green)', 'var(--green-dim)') +
        statCard('', stats.totalPlaylists || 0, '歌单数量', 'var(--purple)', 'var(--purple-dim)') +
        statCard('▶', stats.totalPlays || 0, '播放次数', 'var(--orange)', 'var(--orange-dim)') +
        statCard('', stats.totalLiked || 0, '收藏总数', 'var(--red)', 'var(--red-dim)') +
      '</div>' +
      '<div class="card">' +
        '<div class="card-header"><h3>访客趋势 (近7天)</h3></div>' +
        '<div class="card-body">' + renderChart(visits.hourly || {}, 7) + '</div>' +
      '</div>' +
    '</div>'
  } catch (e) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon"></div><p>' + e.message + '</p></div>'
  }
}

async function renderVisitors(el) {
  el.innerHTML = '<div class="loading"><div class="spinner"></div>加载中...</div>'
  try {
    const visits = await api('/api/admin/visits')
    el.innerHTML = '<div class="fade-in">' +
      '<div class="page-header"><h2>访客统计</h2><p>网站访问量监控与分析</p></div>' +
      '<div class="visitor-summary">' +
        '<div class="visitor-stat"><div class="num" style="color:var(--accent)">' + (visits.totalVisits || 0).toLocaleString() + '</div><div class="label">总访问量</div></div>' +
        '<div class="visitor-stat"><div class="num" style="color:var(--green)">' + (visits.todayVisits || 0).toLocaleString() + '</div><div class="label">今日访问</div></div>' +
        '<div class="visitor-stat"><div class="num" style="color:var(--blue)">' + (visits.avgDaily || 0) + '</div><div class="label">日均访问</div></div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card-header"><h3>24小时访问分布</h3></div>' +
        '<div class="card-body">' + renderChart24h(visits.hourly || {}) + '</div>' +
      '</div>' +
      '<div class="card" style="margin-top:16px">' +
        '<div class="card-header"><h3>近7天趋势</h3></div>' +
        '<div class="card-body">' + renderChart7day(visits.hourly || {}) + '</div>' +
      '</div>' +
    '</div>'
  } catch (e) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon"></div><p>' + e.message + '</p></div>'
  }
}

async function renderUsers(el) {
  el.innerHTML = '<div class="loading"><div class="spinner"></div>加载中...</div>'
  try {
    const data = await api('/api/admin/users?page=' + userPage + '&limit=20' + (userSearch ? '&search=' + encodeURIComponent(userSearch) : ''))
    const users = data.users || []
    let rows = ''
    for (const u of users) {
      const roleBadge = u.role === 'ADMIN' ? '<span class="badge badge-admin">管理员</span>' : '<span class="badge badge-user">用户</span>'
      const date = u.createdAt ? new Date(u.createdAt).toLocaleDateString('zh-CN') : '-'
      rows += '<tr>' +
        '<td style="color:var(--text-primary);font-weight:500">' + (u.username || '-') + '</td>' +
        '<td>' + (u.email || '-') + '</td>' +
        '<td>' + roleBadge + '</td>' +
        '<td>' + date + '</td>' +
        '<td><div style="display:flex;gap:6px">' +
          '<button class="btn btn-ghost btn-sm" onclick="toggleRole(\\'' + u.id + '\\',\\'' + u.role + '\\')">切换角色</button>' +
          '<button class="btn btn-danger btn-sm" onclick="deleteUser(\\'' + u.id + '\\')">删除</button>' +
        '</div></td></tr>'
    }
    if (!rows) rows = '<tr><td colspan="5"><div class="empty-state"><div class="empty-icon"></div><p>暂无用户</p></div></td></tr>'
    const pagination = renderPagination(data.page, data.totalPages, 'userPageNav')
    el.innerHTML = '<div class="fade-in">' +
      '<div class="page-header"><h2>用户管理</h2><p>共 ' + (data.total || 0) + ' 位用户</p></div>' +
      '<div class="card">' +
        '<div class="table-toolbar">' +
          '<input class="search-input" id="userSearchInput" placeholder="搜索用户名或邮箱..." onkeydown="if(event.key===\\'Enter\\'){userSearch=this.value;userPage=1;renderPage()}" value="' + (userSearch || '') + '">' +
          '<button class="btn btn-primary btn-sm" onclick="userSearch=document.getElementById(\\'userSearchInput\\').value;userPage=1;renderPage()">搜索</button>' +
        '</div>' +
        '<table><thead><tr><th>用户名</th><th>邮箱</th><th>角色</th><th>注册时间</th><th>操作</th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table>' +
        pagination +
      '</div>' +
    '</div>'
  } catch (e) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon"></div><p>' + e.message + '</p></div>'
  }
}

async function renderMusic(el) {
  el.innerHTML = '<div class="loading"><div class="spinner"></div>加载中...</div>'
  try {
    const data = await api('/api/admin/music?page=' + musicPage + '&limit=20' + (musicSearch ? '&search=' + encodeURIComponent(musicSearch) : ''))
    const musics = data.musics || []
    let rows = ''
    for (const m of musics) {
      const srcClass = m.source === 'netease' ? 'badge-netease' : m.source === 'kuwo' ? 'badge-kuwo' : 'badge-kugou'
      rows += '<tr>' +
        '<td style="color:var(--text-primary);font-weight:500;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (m.title || '-') + '</td>' +
        '<td>' + (m.artist || '-') + '</td>' +
        '<td>' + (m.album || '-') + '</td>' +
        '<td><span class="badge ' + srcClass + '">' + (m.source || 'netease') + '</span></td>' +
        '<td>' + (m.playCount || 0) + '</td>' +
        '<td><button class="btn btn-danger btn-sm" onclick="deleteMusic(\\'' + m.id + '\\')">删除</button></td></tr>'
    }
    if (!rows) rows = '<tr><td colspan="6"><div class="empty-state"><div class="empty-icon"></div><p>暂无音乐数据</p></div></td></tr>'
    const pagination = renderPagination(data.page, data.totalPages, 'musicPageNav')
    el.innerHTML = '<div class="fade-in">' +
      '<div class="page-header"><h2>音乐管理</h2><p>共 ' + (data.total || 0) + ' 首歌曲</p></div>' +
      '<div class="card">' +
        '<div class="table-toolbar">' +
          '<input class="search-input" id="musicSearchInput" placeholder="搜索歌曲名或歌手..." onkeydown="if(event.key===\\'Enter\\'){musicSearch=this.value;musicPage=1;renderPage()}" value="' + (musicSearch || '') + '">' +
          '<button class="btn btn-primary btn-sm" onclick="musicSearch=document.getElementById(\\'musicSearchInput\\').value;musicPage=1;renderPage()">搜索</button>' +
        '</div>' +
        '<table><thead><tr><th>标题</th><th>歌手</th><th>专辑</th><th>来源</th><th>播放</th><th>操作</th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table>' +
        pagination +
      '</div>' +
    '</div>'
  } catch (e) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon"></div><p>' + e.message + '</p></div>'
  }
}

async function renderConfig(el) {
  el.innerHTML = '<div class="loading"><div class="spinner"></div>加载中...</div>'
  try {
    const data = await api('/api/admin/config')
    el.innerHTML = '<div class="fade-in">' +
      '<div class="page-header"><h2>系统配置</h2><p>音乐 API 与系统参数设置</p></div>' +
      '<div class="card"><div class="card-body">' +
        '<div class="config-grid">' +
          '<div class="config-field"><label>GD API 地址</label>' +
          '<input id="gdApiUrl" value="' + (data.gd_api_url || '') + '" placeholder="https://music-api.gdstudio.xyz/api.php"></div>' +
          '<div class="config-save-row">' +
            '<button class="btn btn-primary" onclick="saveConfig()">保存配置</button>' +
            '<span id="configSaved" class="config-saved"> 已保存</span>' +
          '</div>' +
        '</div>' +
      '</div></div>' +
    '</div>'
  } catch (e) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon"></div><p>' + e.message + '</p></div>'
  }
}

async function saveConfig() {
  const url = document.getElementById('gdApiUrl').value
  await api('/api/admin/config', { method: 'PUT', body: JSON.stringify({ gd_api_url: url }) })
  const el = document.getElementById('configSaved')
  el.classList.add('show')
  setTimeout(() => el.classList.remove('show'), 2000)
}

async function toggleRole(id, role) {
  try {
    await api('/api/admin/users/' + id, { method: 'PATCH', body: JSON.stringify({ role: role === 'ADMIN' ? 'USER' : 'ADMIN' }) })
    renderPage()
  } catch (e) { alert(e.message) }
}

async function deleteUser(id) {
  if (!confirm('确定删除此用户？此操作不可恢复')) return
  try { await api('/api/admin/users/' + id, { method: 'DELETE' }); renderPage() }
  catch (e) { alert(e.message) }
}

async function deleteMusic(id) {
  if (!confirm('确定删除此歌曲？')) return
  try { await api('/api/admin/music/' + id, { method: 'DELETE' }); renderPage() }
  catch (e) { alert(e.message) }
}

// ===== CHART HELPERS =====
function renderChart(hourly, days) {
  const now = new Date()
  const bars = []
  for (let i = days * 24 - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 3600000)
    const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0') + 'T' + String(d.getHours()).padStart(2,'0')
    bars.push({ val: hourly[key] || 0, label: (d.getMonth()+1) + '/' + d.getDate() + ' ' + d.getHours() + ':00' })
  }
  const max = Math.max(...bars.map(b => b.val), 1)
  let html = '<div class="chart-container">'
  for (const b of bars) {
    const h = Math.max(2, (b.val / max) * 180)
    html += '<div class="chart-bar" style="height:' + h + 'px"><div class="tooltip">' + b.label + ' - ' + b.val + ' 次</div></div>'
  }
  html += '</div><div class="chart-labels"><span>' + (bars[0] ? bars[0].label : '') + '</span><span>' + (bars[bars.length-1] ? bars[bars.length-1].label : '') + '</span></div>'
  return html
}

function renderChart24h(hourly) {
  const now = new Date()
  const bars = []
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 3600000)
    const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0') + 'T' + String(d.getHours()).padStart(2,'0')
    bars.push({ val: hourly[key] || 0, hour: d.getHours() })
  }
  const max = Math.max(...bars.map(b => b.val), 1)
  let html = '<div class="chart-container" style="height:180px">'
  for (const b of bars) {
    const h = Math.max(2, (b.val / max) * 160)
    html += '<div class="chart-bar" style="height:' + h + 'px"><div class="tooltip">' + b.hour + ':00 - ' + b.val + ' 次</div></div>'
  }
  html += '</div><div class="chart-labels"><span>24小时前</span><span>现在</span></div>'
  return html
}

function renderChart7day(hourly) {
  const now = new Date()
  const daily = []
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const dayEnd = new Date(dayStart.getTime() + 86400000)
    let count = 0
    for (const [key, val] of Object.entries(hourly)) {
      const d = new Date(key + ':00:00')
      if (d >= dayStart && d < dayEnd) count += val
    }
    const weekdays = ['日','一','二','三','四','五','六']
    daily.push({ val: count, label: (dayStart.getMonth()+1) + '/' + dayStart.getDate() + ' 周' + weekdays[dayStart.getDay()] })
  }
  const max = Math.max(...daily.map(d => d.val), 1)
  let html = '<div class="chart-container" style="height:180px">'
  for (const d of daily) {
    const h = Math.max(4, (d.val / max) * 160)
    html += '<div class="chart-bar" style="height:' + h + 'px;min-width:40px"><div class="tooltip">' + d.label + ' - ' + d.val + ' 次</div></div>'
  }
  html += '</div><div class="chart-labels">'
  for (const d of daily) html += '<span>' + d.label.split(' ')[0] + '</span>'
  html += '</div>'
  return html
}

function statCard(icon, value, label, color, bg) {
  return '<div class="stat-card"><div class="stat-glow" style="background:' + color + '"></div>' +
    '<div class="stat-icon" style="background:' + bg + '">' + icon + '</div>' +
    '<div class="stat-value" style="color:' + color + '">' + Number(value).toLocaleString() + '</div>' +
    '<div class="stat-label">' + label + '</div></div>'
}

function renderPagination(page, totalPages, navId) {
  if (!totalPages || totalPages <= 1) return ''
  let html = '<div class="pagination" id="' + navId + '">'
  html += '<button class="page-btn" onclick="goPage(\\'' + navId + '\\',' + (page-1) + ')" ' + (page<=1?'disabled':'') + '>&laquo;</button>'
  const start = Math.max(1, page - 3)
  const end = Math.min(totalPages, page + 3)
  for (let i = start; i <= end; i++) {
    html += '<button class="page-btn' + (i===page?' active':'') + '" onclick="goPage(\\'' + navId + '\\',' + i + ')">' + i + '</button>'
  }
  html += '<button class="page-btn" onclick="goPage(\\'' + navId + '\\',' + (page+1) + ')" ' + (page>=totalPages?'disabled':'') + '>&raquo;</button>'
  html += '<span class="page-info">' + page + ' / ' + totalPages + '</span></div>'
  return html
}

function goPage(navId, p) {
  if (navId === 'userPageNav') { userPage = p; renderUsers(document.getElementById('pageContent')) }
  else if (navId === 'musicPageNav') { musicPage = p; renderMusic(document.getElementById('pageContent')) }
}

// ===== RENDER =====
function render() {
  if (!token) {
    document.getElementById('app').innerHTML = '<div class="login-wrapper"><div class="login-card">' +
      '<div class="logo"></div>' +
      '<h2>管理后台</h2>' +
      '<p class="subtitle">Open Music 平台管理</p>' +
      '<div class="login-error" id="loginError"></div>' +
      '<input id="loginIdentifier" type="text" placeholder="邮箱或手机号" autocomplete="username">' +
      '<input id="loginPass" type="password" placeholder="密码" autocomplete="current-password" onkeydown="if(event.key===\\'Enter\\')login()">' +
      '<button class="login-btn" onclick="login()">登 录</button>' +
    '</div></div>'
    return
  }
  document.getElementById('app').innerHTML =
    '<nav class="sidebar">' +
      '<div class="sidebar-brand"><h1><span class="icon"></span> Open Music</h1><p>管理后台</p></div>' +
      '<div class="sidebar-nav">' +
        '<div class="nav-section">概览</div>' +
        '<div class="nav-item active" data-tab="dashboard" onclick="navigate(\\'dashboard\\')"><span class="nav-icon"></span>仪表盘</div>' +
        '<div class="nav-item" data-tab="visitors" onclick="navigate(\\'visitors\\')"><span class="nav-icon"></span>访客统计</div>' +
        '<div class="nav-section">管理</div>' +
        '<div class="nav-item" data-tab="users" onclick="navigate(\\'users\\')"><span class="nav-icon"></span>用户管理</div>' +
        '<div class="nav-item" data-tab="music" onclick="navigate(\\'music\\')"><span class="nav-icon"></span>音乐管理</div>' +
        '<div class="nav-section">系统</div>' +
        '<div class="nav-item" data-tab="config" onclick="navigate(\\'config\\')"><span class="nav-icon"></span>系统配置</div>' +
      '</div>' +
      '<div class="sidebar-footer"><div class="version">v1.0 · <a href="#" onclick="logout();return false" style="color:var(--red);text-decoration:none">退出登录</a></div></div>' +
    '</nav>' +
    '<div class="main"><div id="pageContent"></div></div>'
  renderPage()
}
render()
</script>
</body>
</html>`)
})

app.listen(PORT, () => {
  console.log('[Admin] 管理后台: http://localhost:' + PORT)
})