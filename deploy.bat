@echo off
chcp 65001 >nul
echo ====================================
echo   Apple Music - 一键部署助手
echo ====================================
echo.

:: 1. 推送到 GitHub
echo [1/3] 推送到 GitHub...
git push -u origin master
if %errorlevel% neq 0 (
    echo 推送失败，请先登录 GitHub
    echo 按任意键打开 GitHub 登录页面...
    pause >nul
    start https://github.com/login
    git push -u origin master
)
echo ✓ GitHub 推送完成
echo.

:: 2. 打开 Vercel 部署
echo [2/3] 打开 Vercel 部署页面...
echo 请在浏览器中：
echo   1. 用 GitHub 登录
echo   2. 选择仓库 tyler-miao/apple-music
echo   3. Root Directory 选 frontend
echo   4. 添加环境变量 API_URL = https://后端地址.koyeb.app
echo.
start https://vercel.com/import
echo.
echo 部署完后把 Vercel 域名记下来，后面要用
echo.
pause
echo.

:: 3. 打开 Koyeb 部署
echo [3/3] 打开 Koyeb 部署页面...
echo 请在浏览器中：
echo   1. 用 GitHub 登录
echo   2. Create App → GitHub → 选 apple-music
echo   3. Builder: Docker, Dockerfile: /backend/Dockerfile
echo   4. Port: 4000
echo   5. 添加环境变量：
echo      - CORS_ORIGIN = https://你的前端.vercel.app
echo      - JWT_SECRET = 随机字符串
echo      - DATABASE_URL = file:./dev.db
echo.
start https://app.koyeb.com/deploy
echo.
pause

echo ====================================
echo 部署完成！
echo 部署成功后把 Koyeb 地址填回 Vercel 的 API_URL
echo ====================================
pause
