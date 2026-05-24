@echo off
chcp 65001 >nul
title Apple Music 自动部署

echo ============================================
echo   Apple Music 自动部署工具
echo ============================================
echo.

:: 检查是否在 Git 仓库中
git status >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：不在 Git 仓库中
    pause
    exit /b
)

:: 推送到 GitHub
echo [1/3] 推送到 GitHub...
git push -u origin master
if %errorlevel% neq 0 (
    echo.
    echo ⚠ 推送失败，请登录 GitHub 后重试
    echo 按任意键打开 GitHub 登录页面...
    pause >nul
    start https://github.com/login
    pause
    git push -u origin master
)
echo ✅ GitHub 推送成功
echo.

:: 获取 Vercel Token
echo [2/3] 准备 Vercel 部署...
echo.
echo 请先获取 Vercel Token：
echo 1. 打开 https://vercel.com/account/tokens
echo 2. 点 "Create Token"
echo 3. 名称随便填，复制生成的 Token
echo.
set /p VERCEL_TOKEN="粘贴 Vercel Token 后回车: "

:: 部署到 Vercel
echo.
echo 正在部署到 Vercel...
npx vercel deploy frontend --token=%VERCEL_TOKEN% --yes --name=apple-music
if %errorlevel% neq 0 (
    echo.
    echo ⚠ Vercel 部署失败，请手动部署
    echo 打开 https://vercel.com/import
    start https://vercel.com/import
)
echo.

:: Koyeb
echo [3/3] 后端部署说明
echo.
echo Koyeb 部署步骤：
echo 1. 打开 https://app.koyeb.com/deploy
echo 2. 用 GitHub 登录
echo 3. 选仓库 → Builder: Docker → Dockerfile: /backend/Dockerfile
echo 4. Port: 4000
echo 5. 环境变量：
echo    - CORS_ORIGIN = 你的 Vercel 域名
echo    - JWT_SECRET = 随机字符串
echo    - DATABASE_URL = file:./dev.db
echo.
start https://app.koyeb.com/deploy
echo.
echo ============================================
echo   部署引导完成！
echo   部署成功后记得互填对方地址
echo ============================================
pause
