# 贷款助手 - IPA 构建脚本
# 用于 EAS Cloud Build（无需 Mac）

Write-Host "=== 贷款助手 IPA 构建脚本 ===" -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js
$nodeVer = node --version
Write-Host "Node.js: $nodeVer" -ForegroundColor Green

# 安装 EAS CLI
Write-Host "[1/4] 安装 EAS CLI..." -ForegroundColor Yellow
npm install -g eas-cli

# 登录 Expo
Write-Host "[2/4] 登录 Expo 账号..." -ForegroundColor Yellow
Write-Host "请访问 https://expo.dev 注册免费账号后执行: eas login" -ForegroundColor White
eas login

# 配置项目
Write-Host "[3/4] 配置 EAS 项目..." -ForegroundColor Yellow
eas build:configure

# 构建 IPA
Write-Host "[4/4] 开始构建 IPA（约10-15分钟）..." -ForegroundColor Yellow
eas build --platform ios --profile production

Write-Host ""
Write-Host "构建完成后，在 Expo 后台下载 .ipa 文件" -ForegroundColor Green
Write-Host "通过 LiveContainer 侧载到 iPhone 即可使用" -ForegroundColor Green
