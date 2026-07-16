param(
  [string]$VercelToken = "",
  [string]$KoyebToken = ""
)

$ErrorActionPreference = "Stop"
$Proxy = "http://127.0.0.1:18812"
$env:HTTP_PROXY = $Proxy
$env:HTTPS_PROXY = $Proxy

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Open Music - 全自动部署" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 1. 推送到 GitHub
Write-Host "[1/4] 推送到 GitHub..." -ForegroundColor Yellow
git push -u origin master 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "  ⚠ 推送失败，请检查 GitHub 连接" -ForegroundColor Red
  exit 1
}
Write-Host "  ✓ 推送成功" -ForegroundColor Green

# 2. 获取 Vercel Token（如果没有传入）
if (-not $VercelToken) {
  Write-Host "[2/4] Vercel 部署..." -ForegroundColor Yellow
  Write-Host "  需要 Vercel Token，请打开：" -ForegroundColor White
  Write-Host "  https://vercel.com/account/tokens" -ForegroundColor Cyan
  Write-Host "  创建 Token 后粘贴到这里：" -ForegroundColor White -NoNewline
  $VercelToken = Read-Host
}

# 3. 部署前端到 Vercel
Write-Host "  ⏳ 部署前端到 Vercel..." -ForegroundColor Yellow
$vercelBody = @{
  name = "apple-music"
  project = "apple-music"
  deployment = @{
    files = @()
    projectSettings = @{
      rootDirectory = "frontend"
      buildCommand = "npm run build"
      outputDirectory = ".next"
    }
  }
} | ConvertTo-Json

try {
  $vercelResp = Invoke-RestMethod -Uri "https://api.vercel.com/v13/deployments" `
    -Method Post `
    -Headers @{ Authorization = "Bearer $VercelToken" } `
    -ContentType "application/json" `
    -Body $vercelBody
  $frontendUrl = "https://$($vercelResp.alias[0] ?? $vercelResp.url)"
  Write-Host "  ✓ 前端部署成功: $frontendUrl" -ForegroundColor Green
} catch {
  Write-Host "  ⚠ Vercel 部署失败: $_" -ForegroundColor Red
  Write-Host "  请手动部署: https://vercel.com/import" -ForegroundColor Yellow
  $frontendUrl = "https://你的前端.vercel.app"
}

# 4. Koyeb 部署（需要 API）
if ($KoyebToken) {
  Write-Host "[3/4] 部署后端到 Koyeb..." -ForegroundColor Yellow
  
  $koyebApp = @{
    app = @{
      name = "apple-music-backend"
    }
  } | ConvertTo-Json

  try {
    $appResp = Invoke-RestMethod -Uri "https://app.koyeb.com/v1/apps" `
      -Method Post `
      -Headers @{ Authorization = "Bearer $KoyebToken" } `
      -ContentType "application/json" `
      -Body $koyebApp
    Write-Host "  ✓ Koyeb App 创建成功" -ForegroundColor Green
  } catch {
    Write-Host "  ⚠ Koyeb 部署失败: $_" -ForegroundColor Red
  }
} else {
  Write-Host "[3/4] 跳过 Koyeb（需要 Token）" -ForegroundColor Yellow
  Write-Host "  手动部署后端：" -ForegroundColor White
  Write-Host "  1. 打开 https://app.koyeb.com/deploy" -ForegroundColor Cyan
  Write-Host "  2. GitHub → 选 apple-music" -ForegroundColor Cyan
  Write-Host "  3. Dockerfile: /backend/Dockerfile, Port: 4000" -ForegroundColor Cyan
  Write-Host "  4. 添加环境变量后部署" -ForegroundColor Cyan
}

# 5. 更新 CORS
Write-Host "[4/4] 配置 CORS..." -ForegroundColor Yellow
Write-Host "  部署完成后去 Koyeb 设置：" -ForegroundColor White
Write-Host "  环境变量 CORS_ORIGIN = $frontendUrl" -ForegroundColor Cyan
Write-Host "  环境变量 API_URL 在 Vercel 设为 Koyeb 地址" -ForegroundColor Cyan

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  部署完成！" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
