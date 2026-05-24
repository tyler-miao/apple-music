# 进度日志

## 2026-05-24

### 完成
- 后端：MusicService.getLikedMusic 方法 - 从 LikedMusic 表直接返回字段 (title/artist/album/coverUrl/source/sourceId)
- 后端：MusicController.getLiked 处理函数
- 后端：MusicService.toggleLike 现在接受可选的音乐元数据 (title/artist/album/coverUrl/source/sourceId)
- 后端：Prisma 模型 LikedMusic 添加了 title/artist/album/coverUrl/source/sourceId 字段 (使用 denormalized 方案, 不依赖 Music 表)
- 数据库：schema 已通过 prisma db push 同步
- 前端：SearchPage - 每个搜索结果添加了收藏按钮 (红色心形图标)
- 前端：MineView - "喜欢" 卡片现在可点击, 展开显示喜欢的歌曲列表
- 前端：MineView - 喜欢列表展示歌名/歌手/来源, 支持播放和取消收藏
- 前端：MineView - "喜欢" 卡片显示实际收藏数量
- 构建：npm run build 编译成功

### 已修改的文件
- backend/prisma/schema.prisma - LikedMusic 添加字段
- backend/src/services/music.service.ts - getLikedMusic + toggleLike 支持元数据
- backend/src/controllers/music.controller.ts - getLiked + toggleLike 传参
- frontend/src/components/search/SearchPage.tsx - 收藏按钮
- frontend/src/components/mine/MineView.tsx - 喜欢列表
