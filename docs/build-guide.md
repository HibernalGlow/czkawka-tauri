```
pnpm build:ui
pnpm run:tauri
```



## 目录

- [环境准备](#环境准备)
- [开发模式](#开发模式)
- [构建UI](#构建ui)
- [Release构建](#release构建)
- [特殊构建](#特殊构建)
- [工具命令](#工具命令)
- [故障排除](#故障排除)

## 环境准备

### 必需工具

确保安装以下工具：

```powershell
# 检查工具版本
rustup -V
rustc -V
cargo -V
node -v
npm -v
pnpm -v
pnpm tauri -V

# 如果缺少工具，请安装：
# 1. Rust: https://rustup.rs/
# 2. Node.js: https://nodejs.org/
# 3. pnpm: npm install -g pnpm
# 4. Tauri CLI: pnpm add -g @tauri-apps/cli
```

### 可选工具（用于完整开发流程）

```powershell
# 安装额外的开发工具
cargo install taplo-cli  # TOML 格式化工具
cargo install cargo-edit # Cargo 编辑工具
```

## 开发模式

### 热重载开发（推荐）

#### 启动完整的 Tauri 应用开发模式

```powershell
# 方法1: 使用 npm scripts
pnpm run:tauri

# 方法2: 使用 just（如果安装了 just）
just run-tauri

# 方法3: 手动启动
cd ui
pnpm dev &           # 启动前端开发服务器
cd ../tauri
cargo run            # 启动 Tauri 后端
```

这将同时启动：

- TailwindCSS 监听模式（自动编译样式）
- Vite 开发服务器（热重载前端）
- Tauri 应用（自动重启后端）

#### 仅浏览器开发模式

```powershell
# 在浏览器中开发UI（无需 Tauri 后端）
pnpm run:browser

# 等价于
cd ui
pnpm dev
```

### 单独命令

#### UI 开发

```powershell
cd ui

# 启动开发服务器
pnpm dev

# 手动编译 TailwindCSS
pnpm tailwindcss

# 类型检查
pnpm typecheck
```

#### Tauri 后端开发

```powershell
cd tauri

# 运行开发模式
cargo run

# 运行并显示详细日志
RUST_LOG=debug cargo run

# 快速检查编译
cargo check
```

## 构建UI

### 基本UI构建

```powershell
# 从项目根目录执行
pnpm build:ui

# 等价于
cd ui
pnpm build
```

这将执行：

1. TailwindCSS 编译 (`tailwindcss -i input.css -o output.css`)
2. TypeScript 编译 (`tsc`)
3. Vite 构建 (`vite build`)

### 单独的UI构建步骤

```powershell
cd ui

# 1. 编译样式
pnpm tailwindcss

# 2. TypeScript 类型检查
tsc --noEmit

# 3. 构建生产版本
pnpm build

# 4. 预览构建结果
pnpm preview
```

## Release构建

### Windows Release 构建

#### 标准构建

```powershell
# 完整构建流程
pnpm build:ui              # 构建UI
pnpm build:tauri:win        # 构建Windows版本

# 一条命令构建（推荐）
pnpm build:ui && pnpm tauri build
```

#### 优化构建（使用提供的脚本）

```powershell
# 使用优化脚本构建
.\build-optimized.ps1
```

优化脚本包含：

- 增量编译设置
- CPU原生优化
- 并行编译优化
- Thin LTO链接优化

### macOS Release 构建

```powershell
# Universal macOS 构建（支持 Intel + Apple Silicon）
pnpm build:ui
pnpm build:tauri            # 等价于 pnpm tauri build -t universal-apple-darwin

# 带FFmpeg支持的macOS构建
pnpm build:ui
pnpm build:tauri:ffmpeg
```

### 手动Release构建

```powershell
cd tauri

# Windows 构建
cargo build --release

# 交叉编译到其他平台（需要对应工具链）
cargo build --release --target x86_64-pc-windows-msvc
cargo build --release --target x86_64-apple-darwin
cargo build --release --target aarch64-apple-darwin
```

## 特殊构建

### 测试构建

```powershell
# 构建测试用的应用包（不优化）
just bundle-test-app

# 带FFmpeg的测试构建
just bundle-test-ffmpeg-app

# 等价的手动命令
pnpm build:ui
pnpm tauri build -d --bundles app
```

### FFmpeg 版本构建

```powershell
# 构建包含FFmpeg支持的版本
pnpm build:ui
pnpm tauri build -c ./tauri/tauri.ffmpeg.conf.json -f ffmpeg
```

### 调试信息构建

```powershell
# 构建包含调试信息的Release版本
cd tauri
cargo build --release --config 'profile.release.debug=true'
```

## 工具命令

### 代码格式化和检查

```powershell
# 格式化所有代码
pnpm fmt                    # 或 just fmt

# 检查代码质量
pnpm check                  # 或 just check

# 单独的检查命令
cargo fmt --check           # Rust 格式检查
cargo clippy --all-features -- -D warnings  # Rust 代码质量检查
pnpm typecheck:ui           # UI 类型检查
pnpm typecheck:other        # 其他 TypeScript 检查
```

### 清理构建产物

```powershell
# 清理 Rust 构建产物
cd tauri
cargo clean

# 清理 Node.js 依赖和构建产物
cd ui
rm -rf node_modules dist

# 清理根目录 Node.js 产物
rm -rf node_modules
```

### 依赖管理

```powershell
# 安装所有依赖
pnpm install

# 更新依赖
pnpm update

# 仅更新UI依赖
pnpm update --filter ./ui

# 更新Rust依赖
cd tauri
cargo update
```

## 版本发布流程

### 准备发布

```powershell
# 设置新版本号并提交
just prepare-release 1.0.6

# 手动执行相同操作
pnpm tsx ./scripts/set-pkg-version.ts 1.0.6
cargo set-version 1.0.6
just fmt
git commit -am "prepare release 1.0.6"
```

### 推送标签

```powershell
# 创建并推送git标签
just push-tag 1.0.6

# 删除错误的标签
just delete-tag 1.0.6
```

## 性能优化配置

### 开发模式优化

```powershell
# 设置 Rust 增量编译
$env:CARGO_INCREMENTAL = "1"

# 设置并行编译任务数
$env:CARGO_BUILD_JOBS = "8"  # 调整为CPU核心数

# 使用更快的链接器（Windows）
$env:RUSTFLAGS = "-C link-arg=-fuse-ld=lld"
```

### Release 模式优化

```powershell
# 针对当前CPU优化
$env:RUSTFLAGS = "-C target-cpu=native"

# 启用 Thin LTO
$env:CARGO_PROFILE_RELEASE_LTO = "thin"

# 单一代码生成单元（最佳优化）
$env:CARGO_PROFILE_RELEASE_CODEGEN_UNITS = "1"
```

## 故障排除

### 常见问题

#### 1. Tauri 构建失败

```powershell
# 检查 Rust 工具链
rustup update
rustup default stable

# 重新安装 Tauri CLI
pnpm remove @tauri-apps/cli
pnpm add -D @tauri-apps/cli
```

#### 2. 前端构建失败

```powershell
# 清理并重新安装依赖
cd ui
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 检查 Node.js 版本
node -v  # 应该是 18+ 或 20+
```

#### 3. 样式不生效

```powershell
# 重新编译 TailwindCSS
cd ui
pnpm tailwindcss
```

#### 4. 类型错误

```powershell
# 运行类型检查
pnpm typecheck:ui
pnpm typecheck:other

# 清理 TypeScript 缓存
rm -rf ui/.tsbuildinfo tsconfig.tsbuildinfo
```

#### 5. 权限问题（Windows）

```powershell
# 以管理员权限运行 PowerShell
# 或者修改执行策略
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 6. LLVM 链接器错误（LNK2019/LNK1120）

这类错误通常表现为大量的 "无法解析的外部符号" 错误，是 Rust 编译器版本、依赖冲突或链接器优化问题导致的。

**解决方案（按优先级排序）：**

```powershell
# 方案1: 完全清理并重新构建
cd tauri
cargo clean
cargo update
cargo build

# 方案2: 禁用增量编译和 LTO
$env:CARGO_INCREMENTAL = "0"
$env:CARGO_PROFILE_RELEASE_LTO = "off"
cargo clean
cargo build

# 方案3: 使用稳定的编译器配置
$env:RUSTFLAGS = ""  # 清除所有自定义 RUSTFLAGS
$env:CARGO_PROFILE_RELEASE_CODEGEN_UNITS = "16"  # 增加代码生成单元
cargo clean
cargo build

# 方案4: 更新 Rust 工具链
rustup update stable
rustup default stable
cargo clean
cargo build

# 方案5: 回退到特定 Rust 版本（如果最新版本有问题）
rustup install 1.75.0
rustup default 1.75.0
cargo clean
cargo build

# 方案6: 禁用并行编译（最后手段）
$env:CARGO_BUILD_JOBS = "1"
cargo clean
cargo build
```

**针对 Windows 的特殊解决方案：**

```powershell
# 使用 MSVC 链接器而不是 LLD
$env:RUSTFLAGS = "-C linker=link.exe"
cargo clean
cargo build

# 或者明确指定链接器参数
$env:RUSTFLAGS = "-C link-arg=/FORCE:MULTIPLE"
cargo clean
cargo build

# 检查 Visual Studio Build Tools 是否正确安装
# 确保安装了 "C++ build tools" 和 "Windows 10/11 SDK"
```

**调试链接器问题：**

```powershell
# 查看详细的链接器输出
$env:RUST_LOG = "rustc_codegen_ssa::back::link=info"
cargo build -v

# 查看生成的目标文件
cargo build --verbose 2>&1 | Select-String "link"

# 检查依赖树是否有冲突
cargo tree
cargo tree --duplicates
```

### 调试构建问题

#### 详细日志

```powershell
# Rust 详细日志
RUST_LOG=debug cargo build

# Tauri 详细构建日志
pnpm tauri build --verbose

# 前端构建调试
cd ui
DEBUG=vite:* pnpm build
```

#### 分析构建大小

```powershell
# 分析 Rust 二进制大小
cd tauri
cargo bloat --release

# 分析前端构建产物
cd ui
pnpm build --report
```

## 快速参考

### 开发常用命令

```powershell
pnpm run:tauri          # 启动完整开发环境
pnpm run:browser        # 仅浏览器开发
pnpm fmt               # 格式化代码
pnpm check             # 检查代码质量
```

### 构建常用命令

```powershell
pnpm build:ui          # 构建UI
pnpm build:tauri:win   # Windows Release构建
.\build-optimized.ps1  # 优化构建脚本
```

### 清理和重置

```powershell
cargo clean            # 清理Rust构建
rm -rf ui/node_modules # 清理前端依赖
pnpm install           # 重新安装依赖
```
