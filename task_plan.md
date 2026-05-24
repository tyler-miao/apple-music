# 我喜欢功能 + 乱码修复

## 目标
1. 添加「我喜欢的音乐」功能：后端 API + 前端 MineView 内嵌列表
2. 修复用户报告的乱码问题

## 阶段

### 阶段1：后端 — 获取喜欢歌曲 API
- MusicService.getLikedMusic(userId) — 从 LikedMusic 联表查询 Music 数据
- MusicController.getLiked — 调用 service，返回 likedSongs
- 确保 `/api/music/liked` 路由在 `/:id` 之前（已调整）

### 阶段2：前端 — MineView 喜欢列表
- 使「喜欢」统计卡片可点击，展开/折叠喜欢列表
- 列表项展示：封面、歌名、歌手、来源标签
- 点击播放歌曲
- 显示实际喜欢数量

### 阶段3：乱码排查与修复
- 确认用户在哪看到乱码
- 针对性修复

## 已创建/修改的文件
- backend/src/services/music.service.ts — 添加 getLikedMusic
- backend/src/controllers/music.controller.ts — 添加 getLiked
- backend/src/routes/music.ts — 已添加 /liked 路由
- frontend/src/components/mine/MineView.tsx — 显著修改
