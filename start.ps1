# KC-6游戏站 快速启动脚本
Write-Host "🎮 KC-6游戏站 启动中..." -ForegroundColor Yellow

# 构建前端
Write-Host "📦 构建前端..." -ForegroundColor Cyan
Push-Location "$PSScriptRoot\client"
npm run build
Pop-Location

# 启动服务器
Write-Host "🚀 启动服务器..." -ForegroundColor Green
Push-Location "$PSScriptRoot\server"
Write-Host ""
Write-Host "✅ 服务器已启动！" -ForegroundColor Green
Write-Host "🌐 访问 http://localhost:3001 打开网站" -ForegroundColor Yellow
Write-Host ""
node index.js
