# 贷款助手 - Windows 一键构建脚本
# 需要在 https://expo.dev 注册免费账号

param(
    [switch]$InstallOnly
)

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectDir

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   贷款助手 - IPA 构建工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js
try {
    $nodeVer = node --version
    Write-Host "? Node.js $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "? 请先安装 Node.js 22" -ForegroundColor Red
    Write-Host "    winget install Schniz.fnm"
    Write-Host "    fnm install 22"
    Write-Host "    fnm use 22"
    exit 1
}

# 检查依赖
if (-not (Test-Path "node_modules")) {
    Write-Host "?? 安装依赖..." -ForegroundColor Yellow
    npm install
}

# 检查 EAS CLI
try {
    $easVer = eas --version 2>$null
    Write-Host "? EAS CLI $easVer" -ForegroundColor Green
} catch {
    Write-Host "?? 安装 EAS CLI..." -ForegroundColor Yellow
    npm install -g eas-cli
}

if ($InstallOnly) {
    Write-Host "`n? 环境就绪！运行以下命令构建：" -ForegroundColor Green
    Write-Host "    eas login"
    Write-Host "    eas build --platform ios --profile production"
    exit 0
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " 使用说明" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "第1步：注册 Expo 账号" -ForegroundColor Yellow
Write-Host "  → 打开 https://expo.dev 点击 Sign Up"
Write-Host ""
Write-Host "第2步：登录 EAS" -ForegroundColor Yellow
Write-Host "  eas login"
Write-Host ""
Write-Host "第3步：构建 IPA（约10-15分钟）" -ForegroundColor Yellow
Write-Host "  eas build --platform ios --profile production"
Write-Host ""
Write-Host "第4步：下载 IPA" -ForegroundColor Yellow
Write-Host "  构建完成后，在 Expo Dashboard 下载 .ipa"
Write-Host "  通过 LiveContainer 侧载到 iPhone"
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " 也可以用 GitHub Actions 自动构建" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 把项目推送到 GitHub"
Write-Host "2. 在 Settings → Secrets 添加 EXPO_TOKEN"
Write-Host "3. 在 Actions 页面手动触发 Build IPA workflow"
Write-Host ""
Write-Host "生成 EXPO_TOKEN 的方法：" -ForegroundColor Yellow
Write-Host "  在 https://expo.dev/accounts/{你的用户名}/settings/access-tokens 创建"
