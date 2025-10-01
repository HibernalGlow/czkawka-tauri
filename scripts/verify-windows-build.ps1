# Windows 构建环境验证和配置脚本
# 此脚本用于在 GitHub Actions 之外本地测试构建环境

Write-Host "=== Czkawka-Tauri Windows 构建环境检查 ===" -ForegroundColor Cyan
Write-Host ""

# 1. 检查 vcpkg
Write-Host "[1/6] 检查 vcpkg..." -ForegroundColor Yellow
$vcpkgPath = "C:\vcpkg"
if (Test-Path $vcpkgPath) {
    Write-Host "  ✓ vcpkg 已安装在: $vcpkgPath" -ForegroundColor Green
} else {
    Write-Host "  ✗ vcpkg 未找到" -ForegroundColor Red
    Write-Host "  建议: git clone https://github.com/Microsoft/vcpkg.git C:\vcpkg" -ForegroundColor Yellow
    Write-Host "        cd C:\vcpkg && .\bootstrap-vcpkg.bat" -ForegroundColor Yellow
}

# 2. 检查 dav1d
Write-Host "`n[2/6] 检查 dav1d 库..." -ForegroundColor Yellow
$dav1dPc = "C:\vcpkg\installed\x64-windows\lib\pkgconfig\dav1d.pc"
if (Test-Path $dav1dPc) {
    Write-Host "  ✓ dav1d.pc 已找到" -ForegroundColor Green
    Write-Host "  位置: $dav1dPc" -ForegroundColor Gray
} else {
    Write-Host "  ✗ dav1d 未安装" -ForegroundColor Red
    Write-Host "  执行: C:\vcpkg\vcpkg.exe install dav1d:x64-windows" -ForegroundColor Yellow
}

# 3. 检查 pkg-config
Write-Host "`n[3/6] 检查 pkg-config..." -ForegroundColor Yellow
$pkgConfig = Get-Command pkgconf -ErrorAction SilentlyContinue
if (!$pkgConfig) {
    $pkgConfig = Get-Command pkg-config -ErrorAction SilentlyContinue
}

if ($pkgConfig) {
    Write-Host "  ✓ 找到: $($pkgConfig.Path)" -ForegroundColor Green
    & $pkgConfig.Path --version 2>&1 | Out-Null
} else {
    Write-Host "  ✗ pkg-config/pkgconf 未找到" -ForegroundColor Red
    Write-Host "  执行: C:\vcpkg\vcpkg.exe install pkgconf:x64-windows" -ForegroundColor Yellow
}

# 4. 检查环境变量
Write-Host "`n[4/6] 检查环境变量..." -ForegroundColor Yellow
$pkgConfigPath = $env:PKG_CONFIG_PATH
if ($pkgConfigPath) {
    Write-Host "  ✓ PKG_CONFIG_PATH 已设置" -ForegroundColor Green
    Write-Host "    值: $pkgConfigPath" -ForegroundColor Gray
} else {
    Write-Host "  ⚠ PKG_CONFIG_PATH 未设置" -ForegroundColor Yellow
    Write-Host "  建议设置为:" -ForegroundColor Yellow
    Write-Host "    C:\vcpkg\installed\x64-windows\lib\pkgconfig;C:\vcpkg\installed\x64-windows\debug\lib\pkgconfig" -ForegroundColor Gray
}

# 5. 检查 Rust 工具链
Write-Host "`n[5/6] 检查 Rust 工具链..." -ForegroundColor Yellow
$rustc = Get-Command rustc -ErrorAction SilentlyContinue
if ($rustc) {
    Write-Host "  ✓ rustc 已安装" -ForegroundColor Green
    $version = & rustc --version
    Write-Host "    $version" -ForegroundColor Gray
} else {
    Write-Host "  ✗ Rust 未安装" -ForegroundColor Red
    Write-Host "  访问: https://rustup.rs/" -ForegroundColor Yellow
}

# 6. 测试 pkg-config 能否找到 dav1d
Write-Host "`n[6/6] 测试 dav1d 检测..." -ForegroundColor Yellow
if ($pkgConfig -and (Test-Path $dav1dPc)) {
    $env:PKG_CONFIG_PATH = "C:\vcpkg\installed\x64-windows\lib\pkgconfig;C:\vcpkg\installed\x64-windows\debug\lib\pkgconfig"
    $env:PKG_CONFIG_ALLOW_SYSTEM_CFLAGS = "1"
    
    $result = & $pkgConfig.Path --libs --cflags dav1d 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ pkg-config 能够成功检测 dav1d" -ForegroundColor Green
        Write-Host "    输出: $result" -ForegroundColor Gray
    } else {
        Write-Host "  ✗ pkg-config 无法检测 dav1d" -ForegroundColor Red
        Write-Host "    错误: $result" -ForegroundColor Gray
    }
} else {
    Write-Host "  ⊘ 跳过测试（缺少依赖）" -ForegroundColor Gray
}

# 总结
Write-Host "`n=== 总结 ===" -ForegroundColor Cyan
Write-Host "如果所有检查都通过，你可以运行:" -ForegroundColor White
Write-Host "  pnpm run build:tauri:win" -ForegroundColor Green
Write-Host ""
Write-Host "如果需要设置环境变量，运行:" -ForegroundColor White
Write-Host "  . .\scripts\dev-env.ps1" -ForegroundColor Green
Write-Host "  pnpm run run:tauri" -ForegroundColor Green
Write-Host ""
