# 项目优化总结

## 已完成的改进

### 1. 修复项目引用问题 ?
- **问题**: QuickLook.Common 项目文件不存在导致编译失败
- **解决方案**: 
  - 初始化官方 Git 子模块 (`git submodule update --init`)
  - 修改 QuickLook.Common 输出路径为标准 bin\Debug 和 bin\Release
  - 移除不存在的 PreBuildEvent 脚本依赖

### 2. 优化项目配置 ?
- **移除未使用的包**: 删除 `Microsoft.Data.Sqlite.Core`（仅使用 `System.Data.SQLite`）
- **条件化规则集**: 仅在 `MinimumRecommendedRules.ruleset` 存在时应用，避免警告
- **排除源文件重复编译**: 明确排除 QuickLook.Common 子目录源码，避免重复类型冲突

### 3. 改进打包流程 ?
- **压缩目录优化**: 直接压缩插件主目录而非 PackageRoot，避免多余嵌套
- **排除宿主DLL**: 打包时排除 `QuickLook.Common.dll`（由 QuickLook 主程序提供）
- **包含调试符号**: 可选复制 PDB 文件便于调试
- **精简依赖**: 仅包含必要的依赖 DLL

### 4. 版本管理自动化 ?
- **Git Tag 集成**: 新增 `CalcPluginVersion` Target，从 `git describe --tags --always` 自动推导版本
- **灵活配置**: 
  - 通过 `UseGitTagVersion=true` 启用自动版本（默认）
  - 支持手动覆盖：`dotnet build /p:PluginVersion=x.y.z`
  - 无 tag 时回退到手动设置的 `PluginVersion`

### 5. 改进开发体验 ?
- **标准子模块工作流**: 使用官方 QuickLook.Common 子模块，便于跟踪上游更新
- **开发指南文档**: 创建 `DEV_GUIDE.md` 说明项目设置、构建和贡献流程
- **清晰的项目结构**: 分离关注点，代码组织更合理

## 技术细节

### 打包内容
生成的 `.qlplugin` 包含：
```
├── QuickLook.Plugin.SqliteViewer.dll    # 主插件
├── QuickLook.Plugin.SqliteViewer.pdb    # 调试符号
├── QuickLook.Plugin.Metadata.config     # 插件元数据
├── QuickLook.Plugin.Metadata.Base.config
├── Newtonsoft.Json.dll                  # JSON 序列化
├── System.Data.SQLite.dll               # SQLite 数据库
├── System.Data.SQLite.EF6.dll
├── System.Data.SQLite.Linq.dll
├── EntityFramework.dll                  # EF 依赖
├── EntityFramework.SqlServer.dll
├── Microsoft.Web.WebView2.*.dll         # WebView2 依赖
└── static/                              # 前端资源
    ├── index.html
    ├── tmpl_index.html
    ├── scripts.js
    ├── styles.css
    └── vue2.js
```

**不包含**:
- `QuickLook.Common.dll` (由宿主提供)
- 构建临时文件
- 源代码

### 构建流程
```bash
# 1. 清理
dotnet clean

# 2. 构建 QuickLook.Common (依赖项目)
dotnet build QuickLook.Common/QuickLook.Common.csproj -c Release

# 3. 构建主项目并打包
dotnet build -c Release
# → 输出: dist/QuickLook.Plugin.SqliteViewer-{version}.qlplugin
```

### 版本推导逻辑
```msbuild
<Target Name="CalcPluginVersion" BeforeTargets="PrepareForBuild">
  1. 执行: git describe --tags --always
  2. 清理换行符
  3. 如果成功且 PluginVersion == "0.2.0" (默认值)
     → 使用 Git Tag 作为版本
  4. 否则保留手动设置的版本
</Target>
```

## 使用建议

### 日常开发
```bash
# 克隆项目（包含子模块）
git clone --recurse-submodules <repo-url>

# 或初始化已克隆项目的子模块
git submodule update --init --recursive

# 开发构建（Debug）
dotnet build

# 生成发布包
dotnet build -c Release
```

### 发布流程
```bash
# 1. 更新版本（打tag）
git tag v0.3.0
git push origin v0.3.0

# 2. 构建（自动使用 tag 版本）
dotnet build -c Release

# 3. 发布
# → dist/QuickLook.Plugin.SqliteViewer-v0.3.0.qlplugin
```

### 更新依赖库
```bash
# 更新 QuickLook.Common 子模块
cd QuickLook.Common
git checkout main
git pull
cd ..
git add QuickLook.Common
git commit -m "Update QuickLook.Common to latest"
```

## 兼容性

- **.NET Framework**: 4.6.2
- **QuickLook**: 需要 QuickLook 主程序提供 QuickLook.Common 接口
- **WebView2**: 需要用户安装 Edge WebView2 Runtime
- **SQLite**: 包含 System.Data.SQLite 本地库

## 下一步可选优化

1. **CI/CD 集成**: GitHub Actions 自动构建和发布
2. **多目标框架**: 支持 .NET 6+ 以适配新版 QuickLook
3. **本地化**: 添加多语言支持
4. **单元测试**: 增加测试覆盖率
5. **性能优化**: 大型数据库的分页加载

---

**状态**: ? 所有优化已完成并验证通过
**测试**: 构建成功，插件包生成正常
**文档**: 已更新 DEV_GUIDE.md
