# Windows CI 预构建包方案

## 🎯 问题与解决方案

### 原问题
- GitHub Actions Windows runner 上使用 vcpkg 从源码编译 dav1d 耗时过长（20+ 分钟）
- 经常因超时被取消
- 每次 CI 都需要重新编译

### 新方案
使用**预构建的 dav1d 包**，直接从仓库提取，只需几秒钟！

## 📦 预构建包内容

文件位置：`prebuilt/dav1d-windows-x64.zip` (0.69 MB)

包含内容：
```
dav1d-windows-x64/
├── bin/
│   └── dav1d.dll           # 运行时库
├── lib/
│   ├── dav1d.lib           # 链接库
│   └── pkgconfig/
│       └── dav1d.pc        # pkg-config 配置
├── include/
│   └── dav1d/              # 头文件
└── README.txt              # 版本信息
```

## 🔧 如何更新预构建包

当 dav1d 需要升级时，运行打包脚本：

```powershell
# 1. 确保本地 vcpkg 已安装最新版 dav1d
D:\scoop\apps\vcpkg\current\vcpkg.exe install dav1d:x64-windows

# 2. 运行打包脚本
cd d:\1VSCODE\Projects\ImageAll\czkawka-tauri
.\scripts\package-dav1d.ps1

# 3. 提交新包
git add prebuilt/dav1d-windows-x64.zip
git commit -m "chore: 更新 dav1d 预构建包"
git push
```

## 🚀 CI 工作流程

新的 Windows 构建流程（见 `.github/workflows/release.yml`）：

### 1. 提取预构建包 (< 5 秒)
```yaml
- name: extract prebuilt dav1d
  run: |
    Expand-Archive -Path .\prebuilt\dav1d-windows-x64.zip -DestinationPath C:\dav1d
```

### 2. 安装 pkg-config (< 30 秒)
```yaml
- name: install pkgconf
  run: |
    choco install pkgconfiglite -y
```

### 3. 配置环境变量 (< 5 秒)
```yaml
- name: configure build environment
  run: |
    echo "PKG_CONFIG_PATH=C:\dav1d\lib\pkgconfig" >> $env:GITHUB_ENV
    echo "PATH=C:\dav1d\bin;$env:PATH" >> $env:GITHUB_ENV
```

### 4. 验证并构建 (< 5 秒 + 构建时间)
```yaml
- name: verify dav1d detection
  run: |
    pkg-config --modversion dav1d
    pkg-config --libs --cflags dav1d
```

## ⏱️ 时间对比

| 方案 | dav1d 准备时间 | 总构建时间 | 成功率 |
|------|---------------|-----------|--------|
| **旧方案** (vcpkg 编译) | 20-30 分钟 | 30-40 分钟 | 低（经常超时） |
| **新方案** (预构建包) | < 1 分钟 | 8-12 分钟 | 高 |

**节省时间：约 25 分钟！** ⚡

## 📋 优势

1. ✅ **快速部署** - 从编译到解压，时间从 20+ 分钟降至 < 1 分钟
2. ✅ **避免超时** - 不再因 vcpkg 编译耗时被取消
3. ✅ **稳定可靠** - 使用经过测试的预构建二进制文件
4. ✅ **易于更新** - 单一脚本即可重新打包
5. ✅ **版本控制** - 包文件在 Git 中跟踪，可回溯

## 🔍 故障排除

### 问题：pkg-config 找不到 dav1d

**检查**：
```powershell
# 1. 确认文件存在
Test-Path "C:\dav1d\lib\pkgconfig\dav1d.pc"

# 2. 检查环境变量
$env:PKG_CONFIG_PATH

# 3. 手动测试
pkg-config --libs --cflags dav1d
```

**解决**：
- 确保 `extract prebuilt dav1d` 步骤成功
- 检查 ZIP 文件是否完整
- 查看 GitHub Actions 日志

### 问题：链接时找不到 dav1d.dll

**检查**：
```powershell
# 1. 确认 DLL 存在
Test-Path "C:\dav1d\bin\dav1d.dll"

# 2. 检查 PATH
$env:PATH -split ';' | Select-String 'dav1d'
```

**解决**：
- 确保 `configure build environment` 步骤正确设置了 PATH
- 在构建前验证 DLL 存在

### 问题：预构建包在仓库中找不到

**原因**：可能是 Git LFS 配置问题或文件太大

**解决**：
```powershell
# 检查文件是否已提交
git ls-files prebuilt/

# 检查文件大小
Get-Item prebuilt\dav1d-windows-x64.zip | Select-Object Length

# 如果文件太大，考虑使用 Git LFS
git lfs track "*.zip"
git add .gitattributes
```

## 📚 相关文档

- [dav1d 项目](https://code.videolan.org/videolan/dav1d)
- [vcpkg 文档](https://vcpkg.io/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [原始排错文档](../rust编译排错.md)

## 🔄 维护检查清单

定期（每 1-3 个月）检查：

- [ ] dav1d 是否有新版本
- [ ] 预构建包是否需要更新
- [ ] CI 构建是否正常
- [ ] 文档是否需要更新

## 📝 更新日志

- **2025-10-02**: 创建预构建包方案，替代 vcpkg 实时编译
- 打包 dav1d 0.x.x (来自 vcpkg)
- 更新 CI workflow 使用预构建包
- 构建时间从 30+ 分钟降至 8-12 分钟
