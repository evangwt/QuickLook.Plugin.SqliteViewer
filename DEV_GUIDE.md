# QuickLook.Plugin.SqliteViewer 开发指南

## 项目设置

本项目使用 Git 子模块引用官方 QuickLook.Common 库。

### 初始化项目

克隆仓库后，需要初始化子模块：

```bash
git clone https://github.com/evangwt/QuickLook.Plugin.SqliteViewer.git
cd QuickLook.Plugin.SqliteViewer
git submodule update --init --recursive
```

或者一次性克隆包含子模块：

```bash
git clone --recurse-submodules https://github.com/evangwt/QuickLook.Plugin.SqliteViewer.git
```

### 构建项目

构建 Release 版本（会自动生成 .qlplugin 插件包）：

```bash
dotnet build -c Release
```

生成的插件包位于 `dist/QuickLook.Plugin.SqliteViewer-{version}.qlplugin`

### 版本管理

项目支持两种版本管理方式：

1. **Git Tag 自动版本**（默认）：
   - 设置 `UseGitTagVersion=true`（已默认启用）
   - 版本号从 `git describe --tags --always` 自动推导
   - 如果没有 tag，使用手动设置的 `PluginVersion`

2. **手动版本**：
   - 在 `.csproj` 中修改 `<PluginVersion>` 属性
   - 或通过命令行覆盖：`dotnet build -c Release /p:PluginVersion=1.0.0`

### 子模块更新

更新 QuickLook.Common 到最新版本：

```bash
cd QuickLook.Common
git pull origin master
cd ..
git add QuickLook.Common
git commit -m "Update QuickLook.Common submodule"
```

### 打包说明

Release 构建会自动执行以下操作：

1. 复制插件 DLL、配置文件和 static 资源到临时目录
2. 排除 `QuickLook.Common.dll`（由宿主程序提供）
3. 包含所有其他依赖 DLL
4. 可选包含 PDB 调试符号
5. 打包为 .qlplugin 文件（本质是 ZIP）

### 项目结构

```
QuickLook.Plugin.SqliteViewer/
├── QuickLook.Common/          # Git 子模块（官方库）
├── static/                    # 前端资源（HTML/CSS/JS）
├── dist/                      # 生成的插件包（不纳入版本控制）
├── Plugin.cs                  # 插件主逻辑
├── WebpagePanel.cs           # WebView2 封装
├── Logger.cs                  # 日志工具
└── QuickLook.Plugin.SqliteViewer.csproj
```

### 常见问题

**Q: 子模块未初始化？**
A: 运行 `git submodule update --init --recursive`

**Q: QuickLook.Common 编译失败？**
A: 确保先构建 QuickLook.Common 项目：`dotnet build QuickLook.Common\QuickLook.Common.csproj`

**Q: 如何禁用 Git Tag 版本？**
A: 在 `.csproj` 中设置 `<UseGitTagVersion>false</UseGitTagVersion>`

### 贡献指南

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -am 'Add some feature'`
4. 推送到分支：`git push origin feature/your-feature`
5. 提交 Pull Request

---

更多信息请参考：
- [QuickLook 官方文档](https://github.com/QL-Win/QuickLook)
- [QuickLook.Common 仓库](https://github.com/QL-Win/QuickLook.Common)
