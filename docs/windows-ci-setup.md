# Windows CI 构建配置说明

## 问题背景

在 GitHub Actions 的 Windows runner 上构建时，遇到 `dav1d` 库依赖问题：
- `dav1d-sys` 需要通过 `pkg-config` 找到系统安装的 `dav1d` 库
- 原始配置缺少自动安装和配置 `dav1d` 的步骤
- Windows 环境下 vcpkg 和 pkg-config 路径配置复杂

## 解决方案

### 1. 自动安装 vcpkg 和 dav1d

在 `.github/workflows/release.yml` 中添加了以下步骤：

```yaml
- name: install vcpkg and dav1d
  if: matrix.os == 'windows-latest'
  shell: powershell
  run: |
    # 安装或更新 vcpkg
    if (!(Test-Path "C:\vcpkg")) {
      git clone https://github.com/Microsoft/vcpkg.git C:\vcpkg
      C:\vcpkg\bootstrap-vcpkg.bat
    }
    
    # 安装 dav1d 和 pkg-config
    C:\vcpkg\vcpkg.exe install dav1d:x64-windows
    C:\vcpkg\vcpkg.exe install pkgconf:x64-windows
```

### 2. 配置环境变量

设置必要的环境变量以便 Rust 构建系统能找到 dav1d：

```yaml
- name: configure build environment
  if: matrix.os == 'windows-latest'
  shell: powershell
  run: |
    # 设置 PKG_CONFIG_PATH
    $PkgConfigPath = "C:\vcpkg\installed\x64-windows\lib\pkgconfig;C:\vcpkg\installed\x64-windows\debug\lib\pkgconfig"
    echo "PKG_CONFIG_PATH=$PkgConfigPath" | Out-File -FilePath $env:GITHUB_ENV -Encoding utf8 -Append
    
    # 允许系统 cflags
    echo "PKG_CONFIG_ALLOW_SYSTEM_CFLAGS=1" | Out-File -FilePath $env:GITHUB_ENV -Encoding utf8 -Append
```

### 3. vcpkg 缓存优化

添加了 vcpkg 缓存以加速后续构建：

```yaml
- name: setup vcpkg cache
  if: matrix.os == 'windows-latest'
  uses: actions/cache@v4
  with:
    path: |
      C:\vcpkg\installed
      C:\vcpkg\packages
    key: ${{ runner.os }}-vcpkg-${{ hashFiles('**/Cargo.lock') }}
```

### 4. 验证步骤

添加了验证步骤确保 pkg-config 能够正确检测 dav1d：

```yaml
- name: verify pkg-config
  if: matrix.os == 'windows-latest'
  shell: powershell
  run: |
    pkgconf --version
    pkgconf --libs --cflags dav1d
```

## 本地开发

### 使用验证脚本

运行以下命令检查本地环境：

```powershell
.\scripts\verify-windows-build.ps1
```

该脚本会检查：
- ✓ vcpkg 是否已安装
- ✓ dav1d 库是否可用
- ✓ pkg-config 是否配置正确
- ✓ 环境变量是否设置
- ✓ Rust 工具链状态

### 手动配置（如果需要）

如果验证脚本发现问题，按以下步骤手动配置：

1. **安装 vcpkg**（如果未安装）：
```powershell
git clone https://github.com/Microsoft/vcpkg.git C:\vcpkg
cd C:\vcpkg
.\bootstrap-vcpkg.bat
```

2. **安装 dav1d 和 pkgconf**：
```powershell
C:\vcpkg\vcpkg.exe install dav1d:x64-windows
C:\vcpkg\vcpkg.exe install pkgconf:x64-windows
```

3. **设置环境变量**（或使用 `scripts\dev-env.ps1`）：
```powershell
$env:PKG_CONFIG_PATH = "C:\vcpkg\installed\x64-windows\lib\pkgconfig;C:\vcpkg\installed\x64-windows\debug\lib\pkgconfig"
$env:PKG_CONFIG_ALLOW_SYSTEM_CFLAGS = "1"
$env:VCPKG_ROOT = "C:\vcpkg"
```

4. **验证配置**：
```powershell
pkgconf --version
pkgconf --libs --cflags dav1d
```

5. **构建项目**：
```powershell
pnpm run build:tauri:win
```

## CI/CD 工作流程

完整的 Windows 构建流程：

1. **缓存恢复** → 尝试从缓存恢复 vcpkg 已安装的包
2. **安装依赖** → 安装/更新 vcpkg、dav1d、pkgconf
3. **配置环境** → 设置 PKG_CONFIG_PATH 等环境变量
4. **验证配置** → 确认 pkg-config 能检测到 dav1d
5. **构建 UI** → pnpm run build:ui
6. **构建 Tauri** → pnpm run build:tauri:win
7. **发布产物** → 上传 NSIS 安装程序到 GitHub Release

## 技术细节

### dav1d 依赖链

```
czkawka-tauri
  └─ image (0.25.6)
      └─ dav1d (0.10.4)
          └─ dav1d-sys (0.8.3)
              └─ system-deps → 需要 pkg-config
```

### 为什么需要 AVIF 支持

AVIF (AV1 Image File Format) 是现代高效的图像格式：
- 比 JPEG 更高的压缩率
- 支持 HDR 和广色域
- 开源免费
- `dav1d` 是 VideoLAN 开发的高性能 AV1 解码器

项目中 `czkawka_core` 使用 `libavif` feature 来支持扫描和处理 AVIF 图像文件。

## 故障排除

### 问题：pkg-config 找不到 dav1d

**症状**：
```
error: failed to run custom build command for `dav1d-sys v0.8.3`
The system library `dav1d` required by crate `dav1d-sys` was not found.
```

**解决**：
1. 确认 `C:\vcpkg\installed\x64-windows\lib\pkgconfig\dav1d.pc` 存在
2. 设置 `PKG_CONFIG_PATH` 环境变量
3. 运行验证脚本检查配置

### 问题：链接器错误

**症状**：
```
LINK : fatal error LNK1181: cannot open input file 'dav1d.lib'
```

**解决**：
1. 确认 vcpkg 完整安装了 dav1d
2. 检查 `C:\vcpkg\installed\x64-windows\lib\dav1d.lib` 存在
3. 可能需要重新安装：`C:\vcpkg\vcpkg.exe remove dav1d:x64-windows && C:\vcpkg\vcpkg.exe install dav1d:x64-windows`

### 问题：缓存问题

**症状**：CI 构建失败但本地正常

**解决**：
在 GitHub Actions 中手动清除缓存，然后重新运行 workflow

## 参考资料

- [vcpkg 官方文档](https://vcpkg.io/)
- [dav1d 项目](https://code.videolan.org/videolan/dav1d)
- [Tauri 构建指南](https://tauri.app/v1/guides/building/)
- [原始排错文档](./rust编译排错.md)

## 更新日志

- **2025-10-02**: 改进 Windows CI workflow，自动安装和配置 dav1d
- 添加 vcpkg 缓存支持
- 添加验证脚本 `verify-windows-build.ps1`
- 创建本文档
