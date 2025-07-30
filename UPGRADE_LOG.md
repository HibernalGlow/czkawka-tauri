# czkawka-tauri 1.1.0 重大更新日志

## 🎉 版本号
- 由 `1.0.7` 升级至 `1.1.0`（主包、UI包、Rust后端同步）

## 🚀 主要新功能

### 1. 全新浮动筛选面板
- 底部工具栏筛选功能支持“浮动面板”模式
- 可拖动、可调整大小，支持固定/解锁切换
- 非独占全屏，随时可移动和操作
- 筛选条件与原有功能完全兼容

### 2. 左侧工具栏大幅升级
- 支持 WinUI3 风格汉堡折叠按钮
- 工具栏可折叠为图标模式，展开显示全称+图标
- 每个工具类型均有专属SVG图标，视觉更美观

### 3. 顶栏信息优化
- 应用图标和版本号迁移到顶栏左侧
- 右侧为设置、主题、源码等操作按钮

### 4. 相似图片/文件夹统计与批量操作
- 后端支持统计相似图片文件夹，前端可切换视图
- 支持文件夹阈值过滤、批量选中、预览首张图片

### 5. 工具设置与预设
- 工具设置支持最大差异度预设、文件夹阈值滑块
- 参考路径支持全选/取消全选，勾选框样式统一

### 6. 代码结构与UI优化
- 组件解耦，状态管理更清晰
- 统一勾选框样式，提升一致性
- 代码分层更合理，易于维护和扩展

## 🛠️ 技术细节
- Jotai 状态管理优化
- Tauri 后端 emit 事件通信增强
- Rust/Cargo/TypeScript 依赖升级
- 兼容 Windows/MSVC、macOS 多平台

## 🧪 测试与验证
- 全面测试新面板、工具栏、筛选功能
- 兼容性与性能均通过验证

## ⚡ 迁移与升级建议
- 建议清理旧缓存，重新安装依赖
- 如遇UI异常请刷新或重启应用

---

# czkawka-tauri JXL & AVIF 支持升级日志

## 概述

本次升级为 czkawka-tauri 项目添加了对 JXL（JPEG XL）和 AVIF 图像格式的支持，并完善了 Windows MSVC 开发环境。

## 🚀 新增功能

### 图像格式支持
- ✅ **JXL (JPEG XL)** - 现代无损/有损图像格式，提供更好的压缩率
- ✅ **AVIF** - 基于 AV1 的高效图像格式，优秀的压缩性能

### 支持的所有图像格式
```javascript
['avif', 'bmp', 'gif', 'icns', 'ico', 'jpeg', 'jpg', 'jxl', 'png', 'svg', 'webp']
```

## 🔧 技术实现

### 前端更改
- 修改了 `ui/src/utils/common.ts` 中的 `isImage` 函数
- 在 `imageExtensions` 数组中添加了 'jxl' 和 'avif' 支持
- 无需修改后端代码，`infer` crate 已自动支持这些格式

### 开发环境完善
- ✅ 安装并配置了 Visual Studio Build Tools (MSVC 工具链)
- ✅ 安装了所有必需的 Rust 工具：rustup, cargo, rustfmt, clippy
- ✅ 安装了前端开发工具：Node.js, pnpm, TypeScript
- ✅ 安装了项目构建工具：just, taplo-cli, Tauri CLI

## 📋 验证清单

以下所有检查都已通过：

- [x] Rust 工具链 (rustc 1.88.0)
- [x] Cargo 构建系统
- [x] Node.js 运行时 (v24.2.0)
- [x] pnpm 包管理器 (10.12.1)
- [x] Tauri CLI (2.2.4)
- [x] TypeScript 类型检查
- [x] 代码质量检查 (Biome)
- [x] Rust 项目编译 (`cargo build`)
- [x] 前端项目构建 (`pnpm build:ui`)

## 🛠️ 开发命令

### 启动开发服务器
```bash
pnpm run:tauri    # 启动 Tauri 开发服务器
pnpm run:browser  # 启动浏览器开发服务器
```

### 构建项目
```bash
pnpm build:ui     # 构建前端
cargo build       # 构建后端
cargo check       # 检查 Rust 代码
```

### 代码质量
```bash
pnpm typecheck:ui    # TypeScript 类型检查
pnpm typecheck:other # 其他 TS 文件检查
pnpm check          # 代码质量检查
pnpm fmt            # 自动格式化
```

### 工具链检查
```bash
just toolchain      # 查看所有工具版本
node verify-setup.js # 运行完整的环境验证
```

## 🧪 测试

创建了测试脚本验证新格式支持：
```bash
node test-image-formats.js  # 测试图像格式识别
```

测试结果显示 JXL 和 AVIF 格式均被正确识别为图像文件。

## 📁 修改的文件

1. **ui/src/utils/common.ts** - 添加 JXL 和 AVIF 格式支持
2. **test-image-formats.js** - 新建测试脚本
3. **verify-setup.js** - 新建环境验证脚本  
4. **install-build-tools.bat** - 新建 MSVC 工具链安装脚本

## ⚙️ Windows MSVC 环境配置

为确保在 Windows 下顺利开发，已配置：
- Visual Studio Build Tools 2022
- Windows 10/11 SDK
- MSVC v143 编译器工具集
- CMake 和 MSBuild 工具

## 🎯 后续建议

1. **性能测试** - 对比 JXL/AVIF 与传统格式的处理性能
2. **UI 优化** - 在界面中显示检测到的图像格式信息
3. **文档更新** - 更新用户文档，说明新支持的格式
4. **CI/CD** - 在持续集成中加入新格式的测试用例

## 🔗 相关资源

- [JPEG XL 官网](https://jpeg.org/jpegxl/)
- [AVIF 格式规范](https://aomediacodec.github.io/av1-avif/)
- [infer crate 文档](https://docs.rs/infer/)
- [Tauri 文档](https://tauri.app/)
