## 排错总结 — czkawka-tauri Windows 构建问题

本文档总结了在本仓库构建过程中遇到的两个主要问题及其排查与解决流程，便于复现与团队成员参考。

### 问题概览

- 链接器被错误的 `link.exe`（来自 Scoop 的 coreutils shim）拦截，导致 Rust 链接参数被误传给一个非 MSVC 的 `link` 命令，报错类似：
  - error: 2 values required for '<FILES> <FILES>' but N were provided

- 在安装并使用 MSVC 的 `link.exe` 后又遇到缺少 Windows SDK 库（例如 `kernel32.lib`）的问题，报错类似：
  - LINK : fatal error LNK1181: 无法打开输入文件“kernel32.lib”

- 在构建 `dav1d-sys` 时，build script 依赖 pkg-config 去查找系统库 `dav1d`，报错找不到 `dav1d.pc`：
  - The system library `dav1d` required by crate `dav1d-sys` was not found.

### 排查步骤（要点）

1. 确认 PATH 中 `link.exe` 的来源：

   - 在 PowerShell 中运行：

```powershell
where.exe link
where.exe cl
rustc -vV
```

   - 若 `where.exe link` 指向 `D:\scoop\shims\link.exe`（或其它非 MSVC 可执行），说明存在命名冲突。

2. 确认 rustup 工具链与组件：

```powershell
rustup show
rustup toolchain list
rustup target list --installed
rustup component list --installed
```

3. 安装 Visual Studio Build Tools（包含 C++ 工具集）并使用 Developer PowerShell：

   - 推荐使用 Visual Studio Installer 或 winget（需要管理员权限）：

```powershell
# 使用 winget 安装 Visual Studio Build Tools（示例）
winget install --id Microsoft.VisualStudio.2022.BuildTools -e --source winget --override "--wait --passive --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

   - 安装后在“Developer PowerShell for VS 2022”中构建（该环境会自动注入 LIB/INCLUDE 和正确的 link/cl 路径）。

4. 若系统仍先命中 Scoop 的 `link.exe`，临时解决办法：

```powershell
# 从 PATH 中临时移除 scoop shims（当前会话）
$env:PATH = ($env:PATH -split ';' | Where-Object { $_ -notmatch 'scoop\\shims' }) -join ';'

# 或者重命名冲突的 shim（需谨慎、可能影响其它工具）
# Rename-Item D:\scoop\shims\link.exe D:\scoop\shims\link.exe.disabled

# 之后验证
where.exe link
where.exe cl
```

5. Windows SDK 的库（如 kernel32.lib）找不到时，确认 Windows Kits 已安装并且 LIB/INCLUDE 环境变量有正确条目：

```powershell
# 查找 Windows Kits lib 目录
Get-ChildItem "C:\Program Files (x86)\Windows Kits\10\Lib" -Directory | Sort-Object Name -Descending | Select-Object -First 1
Get-ChildItem -Path "C:\Program Files (x86)\Windows Kits\10\Lib" -Recurse -Filter kernel32.lib | Select-Object -First 1 FullName
```

如果没有安装 SDK，请通过 Visual Studio Installer 或 winget 安装 Windows 10/11 SDK。

### dav1d / pkg-config 问题及解决

1. 问题原因：`dav1d-sys` 的 build.rs 通过 pkg-config 查找 `dav1d`，需要 `dav1d.pc` 文件并且 `PKG_CONFIG_PATH` 指向其所在目录。

2. 在本环境中，系统使用了 Scoop 安装的 vcpkg（位于 `D:\scoop\apps\vcpkg\current`），dav1d 已通过 vcpkg 安装：

```powershell
# 示例命令，定位 dav1d.pc
D:\scoop\apps\vcpkg\current\vcpkg.exe list | Select-String dav1d
Get-ChildItem -Path D:\scoop\apps\vcpkg\current\installed -Recurse -Filter dav1d.pc
```

3. 解决方法：在构建会话中设置 `PKG_CONFIG_PATH` 指向 vcpkg 的 pkgconfig 目录，并允许系统 cflags：

```powershell
$env:PKG_CONFIG_PATH = 'D:\scoop\apps\vcpkg\current\installed\x64-windows\lib\pkgconfig;D:\scoop\apps\vcpkg\current\installed\x64-windows\debug\lib\pkgconfig'
$env:PKG_CONFIG_ALLOW_SYSTEM_CFLAGS='1'
pkg-config --libs --cflags dav1d

# 然后重新构建
cargo clean
cargo build -v
```

在我们的会话中，上述方法使 `pkg-config` 能正确返回 dav1d 的 cflags 和 libs，`dav1d-sys` 的 build script 能顺利执行，构建通过。

### 可选：让设置更持久（建议）

- 在项目根创建 `scripts/dev-env.ps1`（示例）：

```powershell
# scripts/dev-env.ps1
$PkgCfg1 = 'D:\scoop\apps\vcpkg\current\installed\x64-windows\lib\pkgconfig'
$PkgCfg2 = 'D:\scoop\apps\vcpkg\current\installed\x64-windows\debug\lib\pkgconfig'
$env:PKG_CONFIG_PATH = "$PkgCfg1;$PkgCfg2;$env:PKG_CONFIG_PATH"
$env:PKG_CONFIG_ALLOW_SYSTEM_CFLAGS = '1'

# 可选：设置 VCPKG_ROOT
$env:VCPKG_ROOT = 'D:\scoop\apps\vcpkg\current'

# 运行构建或开发命令
pnpm run run:tauri
```

- 或者将必要的环境注入 CI 配置 / VS Code 任务中，确保每次构建时都生效。

### 如果你想显式指定 MSVC 的 linker

在极少数情况下，你可能希望在项目里固定使用某个 `link.exe`，可以添加 `.cargo/config.toml`：

```toml
[target.x86_64-pc-windows-msvc]
linker = "C:\\Program Files (x86)\\Microsoft Visual Studio\\2022\\BuildTools\\VC\\Tools\\MSVC\\<版本号>\\bin\\Hostx64\\x64\\link.exe"
```

替换 `<版本号>` 为实际 MSVC 版本目录名。

### 验证与恢复步骤（快速回顾）

1. 确认 `where.exe link` 指向真正的 MSVC link.exe。
2. 确认 `kernel32.lib` 存在于 Windows Kits 的 lib 目录并且在 `LIB` 环境变量中可见（通常使用 Developer PowerShell 自动完成）。
3. 确认 `pkg-config --libs --cflags dav1d` 可以返回正确路径（若使用 vcpkg，则设置 `PKG_CONFIG_PATH`）。
4. 运行 `cargo clean && cargo build -v` 或 `pnpm run run:tauri` 并观测通过情况。

### 最后说明

本次排错包含两个互不完全相同的根因：

- 一个是 PATH 冲突（非 MSVC 的 link.exe 被优先调用）。
- 另一个是本地系统库未被 pkg-config 找到（dav1d via vcpkg）。

二者都已在当前开发会话中解决：先确保 MSVC link/cl 可用并且 Windows SDK 安装齐全，然后为 pkg-config 指定 vcpkg 的 pkgconfig 路径以让 native crate 的 build script 找到依赖。

如需我把 `scripts/dev-env.ps1` 文件添加到仓库并把 `package.json` 的 `run:tauri` 改为调用它，我可以直接帮你修改并在当前环境再次验证。
