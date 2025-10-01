# 打包 dav1d 预构建文件的脚本
# 用于创建可在 CI 中直接使用的压缩包

param(
    [string]$OutputDir = ".\prebuilt"
)

Write-Host "=== 打包 dav1d 预构建文件 ===" -ForegroundColor Cyan

# 源路径（你的本地 vcpkg 安装）
$vcpkgInstalled = "D:\scoop\persist\vcpkg\installed\x64-windows"

# 创建临时目录
$tempDir = Join-Path $OutputDir "dav1d-windows-x64"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

Write-Host "复制必要的文件..." -ForegroundColor Yellow

# 需要打包的文件和目录
$itemsToCopy = @(
    @{Source = "$vcpkgInstalled\bin\dav1d.dll"; Dest = "$tempDir\bin\dav1d.dll"}
    @{Source = "$vcpkgInstalled\lib\dav1d.lib"; Dest = "$tempDir\lib\dav1d.lib"}
    @{Source = "$vcpkgInstalled\lib\pkgconfig\dav1d.pc"; Dest = "$tempDir\lib\pkgconfig\dav1d.pc"}
    @{Source = "$vcpkgInstalled\include\dav1d"; Dest = "$tempDir\include\dav1d"; IsDir = $true}
    
    # pkgconf 工具
    @{Source = "$vcpkgInstalled\tools\pkgconf"; Dest = "$tempDir\tools\pkgconf"; IsDir = $true}
)

foreach ($item in $itemsToCopy) {
    if (Test-Path $item.Source) {
        $destDir = Split-Path $item.Dest -Parent
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        
        if ($item.IsDir) {
            Write-Host "  复制目录: $($item.Source)" -ForegroundColor Gray
            Copy-Item -Path $item.Source -Destination $destDir -Recurse -Force
        } else {
            Write-Host "  复制文件: $($item.Source)" -ForegroundColor Gray
            Copy-Item -Path $item.Source -Destination $item.Dest -Force
        }
    } else {
        Write-Host "  ⚠ 未找到: $($item.Source)" -ForegroundColor Yellow
    }
}

# 创建版本信息文件
$versionInfo = @"
dav1d Prebuilt Package for Windows x64
========================================
Build Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Source: vcpkg
Platform: x64-windows

Files included:
- bin/dav1d.dll
- lib/dav1d.lib
- lib/pkgconfig/dav1d.pc
- include/dav1d/*
- tools/pkgconf/*

Usage in CI:
1. Extract this archive to C:\dav1d
2. Set PKG_CONFIG_PATH=C:\dav1d\lib\pkgconfig
3. Add C:\dav1d\bin and C:\dav1d\tools\pkgconf to PATH
"@

$versionInfo | Out-File -FilePath "$tempDir\README.txt" -Encoding utf8

# 压缩
$zipPath = Join-Path $OutputDir "dav1d-windows-x64.zip"
Write-Host "`n压缩到 $zipPath ..." -ForegroundColor Yellow

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -Force

# 清理临时目录
Remove-Item $tempDir -Recurse -Force

# 显示结果
$zipFile = Get-Item $zipPath
Write-Host "`n✓ 打包完成!" -ForegroundColor Green
Write-Host "  文件: $($zipFile.FullName)" -ForegroundColor White
Write-Host "  大小: $([math]::Round($zipFile.Length / 1MB, 2)) MB" -ForegroundColor White
Write-Host "`n下一步:" -ForegroundColor Cyan
Write-Host "  1. 将此文件提交到仓库: git add prebuilt/dav1d-windows-x64.zip" -ForegroundColor Gray
Write-Host "  2. 提交: git commit -m 'Add prebuilt dav1d for Windows CI'" -ForegroundColor Gray
Write-Host "  3. 推送: git push" -ForegroundColor Gray
