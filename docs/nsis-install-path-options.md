# NSIS 安装路径配置说明

## 当前配置

```json
{
  "installMode": "perMachine",
  "languages": ["English", "SimpChinese"],
  "displayLanguageSelector": true
}
```

**默认路径**：`C:\Program Files\CzkawkaTauri`

## 可选方案

### 方案 1：使用 `both` 模式（推荐）

允许用户在安装时选择：
- 为所有用户安装：`C:\Program Files\CzkawkaTauri`
- 仅为当前用户：`C:\Users\<用户名>\AppData\Local\CzkawkaTauri`

```json
{
  "installMode": "both",
  "languages": ["English", "SimpChinese"],
  "displayLanguageSelector": true
}
```

### 方案 2：使用 `currentUser` 模式

默认安装到用户目录，不需要管理员权限：

```json
{
  "installMode": "currentUser",
  "languages": ["English", "SimpChinese"],
  "displayLanguageSelector": true
}
```

**默认路径**：`C:\Users\<用户名>\AppData\Local\CzkawkaTauri`

### 方案 3：自定义 NSIS 模板（高级）

如果你确实需要自定义默认路径（如 `C:\Czkawka`），需要：

1. 创建自定义 NSIS 模板
2. 在 `tauri.conf.json` 中引用它

但这需要深入了解 NSIS 脚本语法。

## 限制说明

Tauri 的 NSIS 打包器有以下限制：

1. **`perMachine` 模式**：
   - 固定安装到 `C:\Program Files\<应用名>`
   - 需要管理员权限
   - 适合企业环境

2. **`currentUser` 模式**：
   - 固定安装到 `%LOCALAPPDATA%\<应用名>`
   - 不需要管理员权限
   - 适合个人用户

3. **`both` 模式**：
   - 安装时让用户选择
   - 推荐用于一般应用

## 用户体验对比

| 模式 | 默认路径 | 管理员权限 | 适用场景 |
|------|---------|-----------|---------|
| `perMachine` | `C:\Program Files\...` | 需要 | 企业部署、系统工具 |
| `currentUser` | `%LOCALAPPDATA%\...` | 不需要 | 个人应用、便携工具 |
| `both` | 用户选择 | 可选 | 通用应用（推荐） |

## 我的建议

**对于 Czkawka（文件清理工具）**：

推荐使用 `both` 模式，原因：
1. ✅ 给用户选择权
2. ✅ 更灵活的安装选项
3. ✅ 适合不同使用场景
4. ✅ 不强制要求管理员权限

如果你想要更短的路径，可以考虑：
- 修改 `productName` 为更短的名字（如 `Czkawka`）
- 这会使路径变为 `C:\Program Files\Czkawka`

## 修改方法

如果想改成 `both` 模式：

```json
"nsis": {
  "installerIcon": "../assets/icon.ico",
  "installMode": "both",
  "languages": ["English", "SimpChinese"],
  "displayLanguageSelector": true
}
```

如果想缩短路径，修改产品名：

```json
{
  "productName": "Czkawka",  // 从 CzkawkaTauri 改为 Czkawka
  ...
}
```

这样路径会变为 `C:\Program Files\Czkawka`。
