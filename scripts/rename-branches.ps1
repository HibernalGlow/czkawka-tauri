# Git 分支重命名脚本
# 将 2508 重命名为 master，将 main 重命名为 history

Write-Host "=== Git 分支重命名操作 ===" -ForegroundColor Cyan
Write-Host ""

# 确认当前状态
Write-Host "[1/8] 检查当前状态..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
Write-Host "  当前分支: $currentBranch" -ForegroundColor Gray

# 确保本地分支是最新的
Write-Host "`n[2/8] 更新所有远程分支..." -ForegroundColor Yellow
git fetch --all

# 步骤 1: 将远程 main 重命名为 history
Write-Host "`n[3/8] 重命名 main -> history (本地)..." -ForegroundColor Yellow
git branch -m main history 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  本地已经没有 main 分支或已重命名" -ForegroundColor Gray
}

# 推送 history 到远程
Write-Host "`n[4/8] 推送 history 分支到远程..." -ForegroundColor Yellow
git push origin history:history

# 步骤 2: 将 2508 重命名为 master
Write-Host "`n[5/8] 重命名 2508 -> master (本地)..." -ForegroundColor Yellow
if ($currentBranch -eq "2508") {
    git branch -m 2508 master
    Write-Host "  ✓ 当前分支 2508 已重命名为 master" -ForegroundColor Green
} else {
    git branch -m 2508 master 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ 分支 2508 已重命名为 master" -ForegroundColor Green
    } else {
        Write-Host "  本地已经没有 2508 分支或已重命名" -ForegroundColor Gray
    }
}

# 推送新的 master 分支
Write-Host "`n[6/8] 推送新的 master 分支到远程..." -ForegroundColor Yellow
git push origin master:master

# 删除远程的旧分支
Write-Host "`n[7/8] 删除远程的旧分支..." -ForegroundColor Yellow
Write-Host "  删除远程 main..." -ForegroundColor Gray
git push origin --delete main 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "    ✓ 已删除" -ForegroundColor Green
} else {
    Write-Host "    已经不存在或无需删除" -ForegroundColor Gray
}

Write-Host "  删除远程 2508..." -ForegroundColor Gray
git push origin --delete 2508 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "    ✓ 已删除" -ForegroundColor Green
} else {
    Write-Host "    已经不存在或无需删除" -ForegroundColor Gray
}

# 设置新的默认分支（需要在 GitHub 网页上手动操作）
Write-Host "`n[8/8] 最终步骤..." -ForegroundColor Yellow
Write-Host "  ✓ 分支重命名完成!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠ 重要提醒: 需要在 GitHub 上设置默认分支" -ForegroundColor Yellow
Write-Host "  1. 访问: https://github.com/HibernalGlow/czkawka-tauri/settings/branches" -ForegroundColor White
Write-Host "  2. 将默认分支从 'main' 改为 'master'" -ForegroundColor White
Write-Host "  3. 点击 'Update' 按钮" -ForegroundColor White
Write-Host ""
Write-Host "当前分支状态:" -ForegroundColor Cyan
git branch -a | Select-Object -First 10
Write-Host ""
Write-Host "✓ 操作完成!" -ForegroundColor Green
