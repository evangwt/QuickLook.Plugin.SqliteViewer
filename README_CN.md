![QuickLook 图标](https://user-images.githubusercontent.com/1687847/29485863-8cd61b7c-84e2-11e7-97d5-eacc2ba10d28.png)

# QuickLook.Plugin.SqliteViewer

这个插件允许 [QuickLook](https://github.com/QL-Win/QuickLook) 预览 SQLite 文件格式，而无需安装 SQLite 工具。

> 有前端开发经验的开发者, 如感觉前端界面不好看, 请自行修改前端样式。
> 本插件后续可能不再更新, 新功能将转移到[MultiViewer](https://github.com/QL-Win/QuickLook.Plugin.MultiViewer)进行开发, 该插件将支持更多格式的预览。且前端统一使用html, 后续提供相关接口。

## 使用

1. 前往 [发布页面](https://github.com/QL-Win/QuickLook.Plugin.SqliteViewer/releases)，下载最新版本。
2. 确保后台正在运行 QuickLook。进入你的下载文件夹，按下 <key>空格键</key> 打开下载的 `.qlplugin` 文件。
3. 在弹出窗口中点击“安装”按钮。
4. 重启 QuickLook。
5. 选择你要预览的文件，并按下 <key>空格键</key>。

## 接口说明
> 所有接口均使用`window.external.xxx`进行调用, 返回结果为json串, 请在前端使用`JSON.parse()`进行解析

### `window.external.GetTableNames`
> 获取表名列表
1. 调用方法: `window.external.GetTableNames()`
2. 参数: 无
3. 返回: `{status: boolean, data: string[], message: string}`

### `window.external.LoadTableData`
> 加载指定表的数据
1. 调用方法: `window.external.LoadTableData(input, isTableName)`
2. 参数:
    - `input`: string, 表名或sql
    - `isTableName`: bool, 表示输入的是否为表名, 请和input的数据对应
3. 返回: `{status: boolean, data: {map[]}, message: string}`

### `window.external.LoadTableDataBySql`
> 通过sql查询加载数据
1. 调用方法: `window.external.LoadTableDataBySql(sql)`
2. 参数:
    - `sql`: string, sql语句
3. 返回: `{status: boolean, data: {map[]}, message: string}`

### `window.external.GetTableRecordCount`
> 获取表记录数
1. 调用方法: `window.external.GetTableRecordCount(tableName)`
2. 参数:
    - `tableName`: string, 表名
3. 返回: `{status: boolean, data: number, message: string}`

### `window.external.GetTableColumns`
> 获取表列名
1. 调用方法: `window.external.GetTableColumns(tableName)`
2. 参数:
    - `tableName`: string, 表名
3. 返回: `{status: boolean, data: string[], message: string}`


## 配置说明
> 配置文件路径: `$QuickLookAppDir\UserData\QuickLook.Plugin\QuickLook.Plugin.SqliteViewer\setting.json`

|键|类型|说明|
|-|-|-|
|width|double|窗口默认宽度|
|height|double|窗口默认高度|
|log_level|int|日志级别, 0-5分别为 `TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL`, 默认为2|


## 更新历史

### v0.2
1. 使用vue2对前端进行重构
2. 增加setting功能
3. 可配置窗口默认大小width, height
4. 增加日志功能, 可在setting中配置日志级别, 0-5分别为 `TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL`
5. 增加接口:
    - `window.external.LoadTableDataBySql`
    - `window.external.GetTableRecordCount`
    - `window.external.GetTableColumns`

### v0.1
1. 添加了 SQLite 预览功能
2. 使用`WebBrowser`渲染前端
3. 前端通过`window.external.xxx`与后端进行通信, 增加接口:
    - `window.external.GetTableNames`
    - `window.external.LoadTableData`
    > 详细使用方法见[接口说明](#接口说明)



## 许可证

### 本项目中的源代码

MIT 许可证

版权所有 (c) 2018 Paddy Xu

特此向任何获得本软件及相关文档文件（“软件”）副本的人免费授予许可，在不附带任何限制的情况下使用本软件，包括但不限于使用、复制、修改、合并、发布、分发、再许可和/或出售本软件副本的权利，并允许向其提供本软件的人这样做，但须遵守以下条件：

上述版权声明和本许可声明应包含在所有副本或实质部分的软件中。

软件按“原样”提供，不附带任何形式的明示或暗示保证，包括但不限于适销性、特定用途适用性和非侵权的保证。在任何情况下，作者或版权持有人均不对因软件或使用或其他交易产生的任何索赔、损害或其他责任负责，无论是在合同诉讼、侵权诉讼或其他诉讼中。
