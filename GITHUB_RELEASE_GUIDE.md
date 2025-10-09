# ?? GitHub Release 创建指南

## ?? 准备工作

? 已完成项目:
- 代码已提交并推送
- Tag v0.2.0 已创建并推送
- 插件包已构建: `dist/QuickLook.Plugin.SqliteViewer-0.2.0.qlplugin`
- 发布说明已准备: `RELEASE_NOTES_v0.2.0.md`

## ?? 在 GitHub 创建 Release

### 方法 1: 通过 GitHub Web 界面 (推荐)

1. **访问 Releases 页面**
   ```
   https://github.com/evangwt/QuickLook.Plugin.SqliteViewer/releases/new
   ```

2. **选择 Tag**
   - 在 "Choose a tag" 下拉框中选择 `v0.2.0`

3. **填写 Release 信息**
   
   **Release title**:
   ```
   v0.2.0 - Optimized Build and Packaging
   ```

   **Description**: 复制以下内容
   ```markdown
   ## ?? 主要改进

   ### 项目结构优化
   - ? 官方子模块集成: 使用 Git 子模块引用官方 QuickLook.Common 库
   - ? 标准化构建: 统一输出路径，消除构建警告
   - ? 清理依赖: 移除未使用的包

   ### 打包流程改进
   - ? 智能排除: 自动排除宿主提供的 QuickLook.Common.dll
   - ? 优化结构: 直接压缩插件内容，无多余嵌套
   - ? 调试支持: 可选包含 PDB 符号文件

   ### 版本管理自动化
   - ? Git Tag 集成: 从 git describe 自动推导版本号
   - ? 灵活配置: 支持手动覆盖和回退机制

   ## ?? 安装方法

   1. 下载 `QuickLook.Plugin.SqliteViewer-0.2.0.qlplugin`
   2. 确保 QuickLook 正在运行
   3. 双击或按空格打开 .qlplugin 文件
   4. 点击"安装"按钮
   5. 重启 QuickLook

   ## ?? 系统要求

   - QuickLook 主程序
   - Edge WebView2 Runtime (https://go.microsoft.com/fwlink/p/?LinkId=2124703)
   - .NET Framework 4.6.2+

   ## ?? 文档

   - [开发指南](https://github.com/evangwt/QuickLook.Plugin.SqliteViewer/blob/main/DEV_GUIDE.md)
   - [优化总结](https://github.com/evangwt/QuickLook.Plugin.SqliteViewer/blob/main/OPTIMIZATION_SUMMARY.md)
   - [项目状态](https://github.com/evangwt/QuickLook.Plugin.SqliteViewer/blob/main/PROJECT_STATUS.md)

   ## ?? 完整更新日志

   详见 [RELEASE_NOTES_v0.2.0.md](https://github.com/evangwt/QuickLook.Plugin.SqliteViewer/blob/main/RELEASE_NOTES_v0.2.0.md)

   ## ?? 问题反馈

   如遇到问题，请在 [Issues](https://github.com/evangwt/QuickLook.Plugin.SqliteViewer/issues) 提交反馈。
   ```

4. **上传插件包**
   - 拖拽或点击 "Attach binaries" 上传文件:
     ```
     dist/QuickLook.Plugin.SqliteViewer-0.2.0.qlplugin
     ```

5. **发布选项**
   - ? Set as a pre-release (不勾选)
   - ? Set as the latest release (勾选)

6. **点击 "Publish release"**

### 方法 2: 通过 GitHub CLI (高级)

如果安装了 GitHub CLI (`gh`):

```bash
# 创建 Release
gh release create v0.2.0 \
  --title "v0.2.0 - Optimized Build and Packaging" \
  --notes-file RELEASE_NOTES_v0.2.0.md \
  dist/QuickLook.Plugin.SqliteViewer-0.2.0.qlplugin

# 验证 Release
gh release view v0.2.0
```

## ? 发布后验证

1. **访问 Release 页面**:
   ```
   https://github.com/evangwt/QuickLook.Plugin.SqliteViewer/releases/tag/v0.2.0
   ```

2. **确认内容**:
   - ? Tag 正确: v0.2.0
   - ? 标题正确
   - ? 说明完整
   - ? 插件包已上传
   - ? 文件大小正确 (~2.4 MB)

3. **测试下载**:
   ```
   https://github.com/evangwt/QuickLook.Plugin.SqliteViewer/releases/download/v0.2.0/QuickLook.Plugin.SqliteViewer-0.2.0.qlplugin
   ```

## ?? 发布后推广 (可选)

1. **更新 README.md**
   - 添加最新版本的下载链接
   - 更新版本号说明

2. **社交媒体**
   - 在相关社区分享更新
   - Reddit: r/QuickLook (如有)
   - Twitter/X

3. **通知用户**
   - 如有邮件列表或 Discord 频道

## ?? 后续版本发布流程

对于未来的版本 (如 v0.3.0):

```bash
# 1. 完成开发和测试
git add .
git commit -m "Description of changes"

# 2. 创建 tag
git tag -a v0.3.0 -m "Release v0.3.0"

# 3. 推送
git push origin main
git push origin v0.3.0

# 4. 构建
dotnet build -c Release

# 5. 在 GitHub 创建 Release 并上传
# dist/QuickLook.Plugin.SqliteViewer-v0.3.0.qlplugin
```

## ?? 需要帮助？

- **GitHub Issues**: https://github.com/evangwt/QuickLook.Plugin.SqliteViewer/issues
- **GitHub Docs**: https://docs.github.com/en/repositories/releasing-projects-on-github

---

**当前状态**: ? 准备就绪，可以创建 Release
**插件文件**: `dist/QuickLook.Plugin.SqliteViewer-0.2.0.qlplugin` (2.45 MB)
