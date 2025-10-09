# Release v0.2.0 - Optimized Build and Packaging

## ?? 主要改进

### 项目结构优化
- ? **官方子模块集成**: 使用 Git 子模块引用官方 [QuickLook.Common](https://github.com/QL-Win/QuickLook.Common) 库
- ? **标准化构建**: 统一输出路径，消除构建警告
- ? **清理依赖**: 移除未使用的 `Microsoft.Data.Sqlite.Core` 包

### 打包流程改进
- ? **智能排除**: 打包时自动排除 `QuickLook.Common.dll`（由宿主提供）
- ? **优化结构**: 直接压缩插件内容，无多余目录嵌套
- ? **调试支持**: 可选包含 PDB 符号文件
- ? **完整依赖**: 自动收集并打包所有必需的依赖 DLL

### 版本管理自动化
- ? **Git Tag 集成**: 自动从 `git describe --tags` 推导版本号
- ? **灵活配置**: 支持手动覆盖和回退机制
- ? **构建属性**: 可通过 `UseGitTagVersion` 开关控制

### 开发体验提升
- ? **开发指南**: 新增 `DEV_GUIDE.md` 详细说明项目设置和构建流程
- ? **优化文档**: 新增 `OPTIMIZATION_SUMMARY.md` 总结所有改进
- ? **标准工作流**: 采用 Git 子模块最佳实践

## ?? 插件包内容

```
QuickLook.Plugin.SqliteViewer-0.2.0.qlplugin
├── QuickLook.Plugin.SqliteViewer.dll    # 主插件
├── QuickLook.Plugin.SqliteViewer.pdb    # 调试符号
├── QuickLook.Plugin.Metadata.config     # 插件元数据
├── Newtonsoft.Json.dll                  # JSON 序列化
├── System.Data.SQLite.dll               # SQLite 核心
├── System.Data.SQLite.EF6.dll           # EF6 支持
├── System.Data.SQLite.Linq.dll          # LINQ 支持
├── EntityFramework.dll                  # Entity Framework
├── EntityFramework.SqlServer.dll
├── Microsoft.Web.WebView2.*.dll         # WebView2 依赖
└── static/                              # 前端资源
    ├── index.html
    ├── tmpl_index.html
    ├── scripts.js
    ├── styles.css
    └── vue2.js
```

## ?? 使用方法

### 安装插件

1. **下载插件包**: 从 [Releases](https://github.com/evangwt/QuickLook.Plugin.SqliteViewer/releases) 下载 `.qlplugin` 文件
2. **安装**: 
   - 确保 QuickLook 正在运行
   - 双击或按 <kbd>空格</kbd> 打开 `.qlplugin` 文件
   - 点击"安装"按钮
3. **重启 QuickLook**

### 使用插件

1. 选择任意 `.db`、`.sqlite` 或 `.sqlite3` 数据库文件
2. 按 <kbd>空格</kbd> 键预览
3. 在 WebView2 界面中浏览数据库内容

### 系统要求

- **QuickLook**: 需要安装 QuickLook 主程序
- **WebView2**: 需要 [Edge WebView2 Runtime](https://go.microsoft.com/fwlink/p/?LinkId=2124703)
- **Windows**: Windows 7 SP1 或更高版本
- **.NET Framework**: 4.6.2 或更高版本

## ??? 开发者信息

### 从源码构建

```bash
# 克隆仓库（包含子模块）
git clone --recurse-submodules https://github.com/evangwt/QuickLook.Plugin.SqliteViewer.git
cd QuickLook.Plugin.SqliteViewer

# 构建 Release 版本
dotnet build -c Release

# 生成的插件包位于
# dist/QuickLook.Plugin.SqliteViewer-0.2.0.qlplugin
```

### 技术栈

- **.NET Framework**: 4.6.2
- **SQLite**: System.Data.SQLite 1.0.119
- **JSON**: Newtonsoft.Json 13.0.3
- **WebView**: Microsoft.Web.WebView2
- **前端**: Vue.js 2

### 文档

- [开发指南](DEV_GUIDE.md) - 项目设置和构建说明
- [优化总结](OPTIMIZATION_SUMMARY.md) - 详细的改进说明

## ?? 已知问题

- 大型数据库（>100MB）可能需要较长加载时间
- 加密的 SQLite 数据库不受支持
- 复杂查询可能导致界面卡顿

## ?? 更新日志

### v0.2.0 (2025-01-09)

**新增**
- Git tag 自动版本推导
- 官方 QuickLook.Common 子模块集成
- 开发指南和优化文档

**优化**
- 打包流程优化，排除宿主提供的 DLL
- 精简依赖，移除未使用的包
- 改进构建配置，消除警告

**修复**
- 修复项目引用问题
- 修复输出路径不一致问题

## ?? 致谢

- [QuickLook](https://github.com/QL-Win/QuickLook) - 优秀的 Windows 文件预览工具
- [QuickLook.Common](https://github.com/QL-Win/QuickLook.Common) - 插件开发框架

## ?? 许可证

MIT License - 详见 [LICENSE](LICENSE.txt)
