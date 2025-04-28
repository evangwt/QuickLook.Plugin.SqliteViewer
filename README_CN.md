![QuickLook 图标](https://user-images.githubusercontent.com/1687847/29485863-8cd61b7c-84e2-11e7-97d5-eacc2ba10d28.png)

# QuickLook.Plugin.SqliteViewer

这个插件允许 [QuickLook](https://github.com/QL-Win/QuickLook) 预览 SQLite 文件格式，而无需安装 SQLite 工具。

## 使用

1. 前往 [发布页面](https://github.com/QL-Win/QuickLook.Plugin.SqliteViewer/releases)，下载最新版本。
2. 确保后台正在运行 QuickLook。进入你的下载文件夹，按下 <key>空格键</key> 打开下载的 `.qlplugin` 文件。
3. 在弹出窗口中点击“安装”按钮。
4. 重启 QuickLook。
5. 选择你要预览的文件，并按下 <key>空格键</key>。

## 接口说明

### `window.external.GetTableNames`
> 获取表名列表
1. 调用方法: `window.external.GetTableNames()`
2. 参数: 无
3. 返回: `{status: boolean, data: string[], message: string}`

### `window.external.LoadTableData`
> 加载指定表的数据
1. 调用方法: `window.external.LoadTableData(input, isTableName)`
1. 参数:
    - input: string, 表名或sql
    - isTableName: bool, 表示输入的是否为表名, 请和input的数据对应
2. 返回: `{status: boolean, data: {map[]}, message: string}`


## 更新历史
### 0.1
1. 添加了 SQLite 预览功能
2. 使用`WebBrowser`渲染前端
3. 前端通过`window.external.xxx`与后端进行通信, 增加接口: `window.external.GetTableNames`, `window.external.LoadTableData`, 详细使用方法见[接口说明](##接口说明)


## 许可证

### 本项目中的源代码

MIT 许可证

版权所有 (c) 2018 Paddy Xu

特此向任何获得本软件及相关文档文件（“软件”）副本的人免费授予许可，在不附带任何限制的情况下使用本软件，包括但不限于使用、复制、修改、合并、发布、分发、再许可和/或出售本软件副本的权利，并允许向其提供本软件的人这样做，但须遵守以下条件：

上述版权声明和本许可声明应包含在所有副本或实质部分的软件中。

软件按“原样”提供，不附带任何形式的明示或暗示保证，包括但不限于适销性、特定用途适用性和非侵权的保证。在任何情况下，作者或版权持有人均不对因软件或使用或其他交易产生的任何索赔、损害或其他责任负责，无论是在合同诉讼、侵权诉讼或其他诉讼中。
