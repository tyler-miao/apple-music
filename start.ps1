param()
$ErrorActionPreference = "Continue"
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Open Music Player 启动中..." -ForegroundColor Cyan

# Stop old processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Get IPv6 address
$ipv6 = Get-NetIPAddress -AddressFamily IPv6 | Where-Object {
    $_.IPAddress -notmatch "^fe80|^::1" -and
    $_.PrefixOrigin -eq "RouterAdvertisement" -and
    $_.SuffixOrigin -ne "Random"
} | Select-Object -First 1

$ipv6Addr = if ($ipv6) { $ipv6.IPAddress } else { "localhost" }
$dashedIpv6 = $ipv6Addr -replace ':', '-'
$sslipDomain = "apple-music.$dashedIpv6.sslip.io"

# Start backend
$env:CORS_ORIGIN = "*"
$backendJob = Start-Process -WindowStyle Hidden -FilePath "cmd.exe" -ArgumentList "/c cd /d $scriptPath\backend && npx ts-node-dev --respawn --transpile-only src\app.ts > `"$scriptPath\backend.log`" 2>&1"
Start-Sleep -Seconds 5

# Start frontend
$env:NEXT_PUBLIC_WS_URL = "ws://[$ipv6Addr]:4001"
$frontendJob = Start-Process -WindowStyle Hidden -FilePath "cmd.exe" -ArgumentList "/c cd /d $scriptPath\frontend && npx next dev -p 3001 > `"$scriptPath\frontend.log`" 2>&1"

# Wait for services
Start-Sleep -Seconds 12

# Save URLs
$urls = @"
============================================
 Open Music Player - 访问地址
============================================

公网访问（需 IPv6）:
  http://${sslipDomain}:3001

IPv6 直连:
  http://[$ipv6Addr]:3001

本地:
  http://localhost:3001

后端 API:
  http://localhost:4000

管理员: 3433684908@qq.com (ADMIN)
============================================
"@
$urls | Out-File -FilePath "$scriptPath\url.txt" -Encoding UTF8

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " Open Music Player - 已启动!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "公网访问 (需 IPv6):" -ForegroundColor Yellow
Write-Host "  http://${sslipDomain}:3001" -ForegroundColor White
Write-Host ""
Write-Host "IPv6 直连:" -ForegroundColor Gray
Write-Host "  http://[$ipv6Addr]:3001" -ForegroundColor Gray
Write-Host ""
Write-Host "本地:" -ForegroundColor Gray
Write-Host "  http://localhost:3001" -ForegroundColor Gray
Write-Host ""
Write-Host "地址已保存到 url.txt" -ForegroundColor Magenta
Write-Host "IPv6 变化时重新运行此脚本" -ForegroundColor Magenta
Write-Host "按 Ctrl+C 停止服务`n" -ForegroundColor Red

while ($true) { Start-Sleep -Seconds 30 }
