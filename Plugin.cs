using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using QuickLook.Common.Plugin;
using System;
using System.Collections.Generic;
using System.Data.SQLite;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;

namespace QuickLook.Plugin.SqliteViewer
{
    class Setting
    {
        public double width = 800;
        public double height = 600;
        public int logLevel = 2;
        private readonly JObject jsonObj;

        public Setting(string file)
        {
            jsonObj = File.Exists(file) ? JObject.Parse(File.ReadAllText(file)) : new JObject();
            width = GetDouble("width", 800);
            height = GetDouble("height", 600);
            logLevel = GetInt("log_level", 2);
        }

        public string GetString(string key, string defaultValue = "未提供")
        {
            if (jsonObj.ContainsKey(key))
            {
                return (string)jsonObj[key];
            }
            else
            {
                return defaultValue;
            }
        }

        public int GetInt(string key, int defaultValue = 0)
        {
            if (jsonObj.ContainsKey(key))
            {
                return (int)jsonObj[key];
            }
            else
            {
                return defaultValue;
            }
        }

        public double GetDouble(string key, double defaultValue = 0)
        {
            if (jsonObj.ContainsKey(key))
            {
                return (double)jsonObj[key];
            }
            else
            {
                return defaultValue;
            }
        }

        public bool GetBoolean(string key, bool defaultValue = false)
        {
            if (jsonObj.ContainsKey(key))
            {
                return (bool)jsonObj[key];
            }
            else
            {
                return defaultValue;
            }
        }

        public JArray GetArray(string key)
        {
            return (JArray)jsonObj[key];
        }
    }

    public class Plugin : IViewer
    {
        public int Priority => 0;
        private readonly string[] _Extensions = [".db", ".sqlite", ".sqlite3"];

        private string pluginDir;
        private string settingPath;
        private string pluginStaticDir;
        private string tmplHtmlFilePath;
        private string htmlFilePath;

        private Setting setting;

        public void Init()
        {
            // 这里进行变量初始化, 后边竟然访问不到, 不知道为啥, 所以把变量初始化放prepare了
            varInit();
            if (!File.Exists(settingPath))
            {
                Dictionary<string, object> settingMap = new Dictionary<string, object> {
                    { "width",  800},
                    { "height",  600},
                    { "log_level", 2 },
                };
                File.WriteAllText(settingPath, JsonConvert.SerializeObject(settingMap, Formatting.Indented));
            }

            // 确保 index.html 文件存在，如果不存在则从模板创建
            if (!File.Exists(htmlFilePath))
            {
                // 检查模板文件是否存在
                if (File.Exists(tmplHtmlFilePath))
                {
                    // 读取模板文件内容
                    string templateContent = File.ReadAllText(tmplHtmlFilePath);

                    // 替换占位符 - 需要将路径转换为适合HTML中使用的文件URL格式
                    string staticDirUrl = "file:///" + pluginStaticDir.Replace("\\", "/");
                    templateContent = templateContent.Replace("[[PLUGIN_STATIC_DIR]]", staticDirUrl);

                    // 将内容写入 index.html
                    File.WriteAllText(htmlFilePath, templateContent);
                    Logger.Instance.Info($"已根据模板文件生成新的 HTML 文件: {htmlFilePath}");
                }
                else
                {
                    Logger.Instance.Warning($"模板文件未找到: {tmplHtmlFilePath}，使用默认的 index.html 文件");
                }
            }
            
            setting = new Setting(settingPath);
            var logger = Logger.Instance;
            logger.Level = (Logger.LogLevel)setting.logLevel;
            logger.Debug($"     settingPath: {settingPath}");
            logger.Debug($" pluginStaticDir: {pluginStaticDir}");
            logger.Debug($"tmplHtmlFilePath: {tmplHtmlFilePath}");
            logger.Debug($"    htmlFilePath: {htmlFilePath}");
        }

        public void varInit()
        {
            pluginDir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
            Logger.Instance.Debug($"插件目录: {pluginDir}");

            settingPath = Path.Combine(pluginDir, "setting.json");
            pluginStaticDir = Path.Combine(pluginDir, "static");
            tmplHtmlFilePath = Path.Combine(pluginStaticDir, "tmpl_index.html");
            htmlFilePath = Path.Combine(pluginStaticDir, "index.html");

            setting = new Setting(settingPath);
            var logger = Logger.Instance;
            logger.Level = (Logger.LogLevel)setting.logLevel;
        }

        public bool CanHandle(string path)
        {
            return !Directory.Exists(path) && _Extensions.Contains(Path.GetExtension(path).ToLower());
        }

        public void Prepare(string path, ContextObject context)
        {
            // 这里是每次查看时调用的, 后边可以访问到
            varInit();
            context.PreferredSize = new Size
            {
                Width = setting.width,
                Height = setting.height,
            };
        }

        public void Cleanup()
        {
        }

        public void View(string path, ContextObject context)
        {
            try
            {
                // 调用实际渲染方法
                var viewerContent = GetViewerContent(path);

                // 设置预览内容和标题
                context.ViewerContent = viewerContent;
                context.Title = Path.GetFileName(path);
            }
            catch (Exception ex)
            {
                // 如果发生错误，显示错误信息
                context.ViewerContent = new TextBlock
                {
                    Text = $"无法加载文件: {ex.Message}",
                    TextWrapping = System.Windows.TextWrapping.Wrap
                };
                context.Title = "错误";
            }

            // 标记加载完成
            context.IsBusy = false;
        }

        public FrameworkElement GetViewerContent(string filePath)
        {
            // 创建 WebBrowser 控件
#if false
            var webBrowser = new WebBrowser
#else
            var webBrowser = new WebpagePanel
#endif
            {
                Margin = new Thickness(10),
                MinHeight = 300,
                MinWidth = 600
            };

            // 设置 ObjectForScripting
            webBrowser.ObjectForScripting = new ScriptHandler(filePath);
            // 加载 HTML 页面
            Logger.Instance.Debug($"htmlFilePath: {htmlFilePath}");
            webBrowser.Navigate(new Uri(htmlFilePath));
            return webBrowser;
        }
    }

    [ClassInterface(ClassInterfaceType.AutoDual)]
    [ComVisible(true)]
    public class ScriptHandler
    {
        private readonly string _filePath;

        public ScriptHandler(string filePath)
        {
            _filePath = filePath;
        }

        public Task<string> LoadTableDataBySql(string sql)
        {
            try
            {
                using (var connection = new SQLiteConnection($"Data Source={_filePath};Mode=ReadOnly;"))
                {
                    connection.Open();
                    
                    // Add a reasonable timeout for large queries
                    connection.DefaultTimeout = 30;

                    // Will表数据转换为 JSON
                    List<Dictionary<string, object>> data = getTableData(connection, sql);
                    Dictionary<string, object> result = new Dictionary<string, object> {
                        { "status", true },
                        { "message", "ok" },
                        { "data", data },
                        { "rowCount", data.Count }
                    };
                    Logger.Instance.Debug($"通过sql加载表数据: {sql}, 返回 {data.Count} 行数据");
                    return Task.FromResult(JsonConvert.SerializeObject(result, Formatting.Indented));
                }
            }
            catch (Exception ex)
            {
                Dictionary<string, object> result = new Dictionary<string, object> {
                    { "status", false },
                    { "message", ex.Message },
                    { "data", null },
                    { "rowCount", 0 }
                };
                Logger.Instance.Error($"加载表数据失败: {ex.Message}");
                return Task.FromResult(JsonConvert.SerializeObject(result, Formatting.Indented));
            }
        }

        public string LoadTableData(string input, bool isTableName)
        {
            try
            {
                using (var connection = new SQLiteConnection($"Data Source={_filePath};Mode=ReadOnly;"))
                {
                    connection.Open();
                    
                    // Add a reasonable timeout for large queries
                    connection.DefaultTimeout = 30;

                    string sql;
                    if (isTableName)
                    {
                        sql = $"SELECT * FROM `{input}` LIMIT 100"; // Increased from 5 to 100 for better preview
                    }
                    else
                    {
                        sql = input;
                    }
                    // 将表数据转换为 JSON
                    List<Dictionary<string, object>> data = getTableData(connection, sql);
                    Dictionary<string, object> result = new Dictionary<string, object> {
                        { "status", true },
                        { "message", "ok" },
                        { "data", data },
                        { "rowCount", data.Count }
                    };
                    Logger.Instance.Debug($"通过sql加载表数据: {sql}, 返回 {data.Count} 行数据");
                    return JsonConvert.SerializeObject(result, Formatting.Indented);
                }
            }
            catch (Exception ex)
            {
                Dictionary<string, object> result = new Dictionary<string, object> {
                    { "status", false },
                    { "message", ex.Message },
                    { "data", null },
                    { "rowCount", 0 }
                };
                Logger.Instance.Error($"加载表数据失败: {ex.Message}");
                return JsonConvert.SerializeObject(result, Formatting.Indented);
            }
        }

        public Task<string> GetTableNames()
        {
            try
            {
                using (var connection = new SQLiteConnection($"Data Source={_filePath};Mode=ReadOnly;"))
                {
                    connection.Open();
                    
                    // Add timeout for large databases
                    connection.DefaultTimeout = 15;
                    
                    var query = connection.CreateCommand();
                    query.CommandText = "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;";
                    var tableNames = new List<string>();
                    using (var reader = query.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            tableNames.Add(reader.GetString(0));
                        }
                    }
                    Logger.Instance.Debug($"发现 {tableNames.Count} 个表");
                    return Task.FromResult(JsonConvert.SerializeObject(tableNames, Formatting.Indented));
                }
            }
            catch (Exception ex)
            {
                Logger.Instance.Error($"获取表名列表失败: {ex.Message}");
                // Return empty array instead of null to prevent frontend errors
                return Task.FromResult(JsonConvert.SerializeObject(new List<string>(), Formatting.Indented));
            }
        }

        public Task<int> GetTableRecordCount(string tableName)
        {
            try
            {
                using (var connection = new SQLiteConnection($"Data Source={_filePath};Mode=ReadOnly;"))
                {
                    connection.Open();
                    connection.DefaultTimeout = 20; // 20 second timeout for count operations
                    var query = connection.CreateCommand();
                    
                    // Use sqlite_stat1 if available for better performance on large tables
                    query.CommandText = $"SELECT stat FROM sqlite_stat1 WHERE tbl = '{tableName}'";
                    var statResult = query.ExecuteScalar();
                    
                    if (statResult != null && long.TryParse(statResult.ToString(), out long estimatedCount))
                    {
                        Logger.Instance.Debug($"Using estimated count from sqlite_stat1: {estimatedCount}");
                        return Task.FromResult((int)estimatedCount);
                    }
                    
                    // Fallback to exact count for smaller tables or when stats are not available
                    query.CommandText = $"SELECT count(*) FROM `{tableName}`";
                    var recordCount = (long)query.ExecuteScalar();
                    Logger.Instance.Debug($"Using exact count: {recordCount}");
                    return Task.FromResult((int)recordCount);
                }
            }
            catch (Exception ex)
            {
                Logger.Instance.Error($"获取表 {tableName} 记录数失败: {ex.Message}");
                return Task.FromResult(0); // Return 0 instead of throwing to prevent UI errors
            }
        }

        public Task<string> GetTableColumns(string tableName)
        {
            using (var connection = new SQLiteConnection($"Data Source={_filePath};Mode=ReadOnly;"))
            {
                connection.Open();
                var query = connection.CreateCommand();
                query.CommandText = $"PRAGMA table_info(`{tableName}`);";
                var columnNames = new List<string>();
                using (var reader = query.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        string columnName = reader.GetString(1);
                        columnNames.Add(columnName);
                    }
                }
                return Task.FromResult(JsonConvert.SerializeObject(columnNames, Formatting.Indented));
            }
        }

        public Task<string> GetTableInfo(string tableName)
        {
            try
            {
                using (var connection = new SQLiteConnection($"Data Source={_filePath};Mode=ReadOnly;"))
                {
                    connection.Open();
                    
                    // Get table columns with type information
                    var query = connection.CreateCommand();
                    query.CommandText = $"PRAGMA table_info(`{tableName}`);";
                    var columns = new List<Dictionary<string, object>>();
                    
                    using (var reader = query.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            columns.Add(new Dictionary<string, object>
                            {
                                { "name", reader.GetString(1) },
                                { "type", reader.GetString(2) },
                                { "notNull", reader.GetBoolean(3) },
                                { "primaryKey", reader.GetBoolean(5) }
                            });
                        }
                    }
                    
                    // Get estimated or exact row count
                    query.CommandText = $"SELECT stat FROM sqlite_stat1 WHERE tbl = '{tableName}'";
                    var statResult = query.ExecuteScalar();
                    int rowCount = 0;
                    
                    if (statResult != null && int.TryParse(statResult.ToString(), out int estimatedCount))
                    {
                        rowCount = estimatedCount;
                    }
                    else
                    {
                        // For small tables, get exact count
                        query.CommandText = $"SELECT count(*) FROM `{tableName}` LIMIT 10000"; // Limit to avoid long waits
                        var exactResult = query.ExecuteScalar();
                        if (exactResult != null)
                        {
                            rowCount = Convert.ToInt32(exactResult);
                        }
                    }
                    
                    var result = new Dictionary<string, object>
                    {
                        { "status", true },
                        { "tableName", tableName },
                        { "columns", columns },
                        { "estimatedRowCount", rowCount },
                        { "message", "ok" }
                    };
                    
                    return Task.FromResult(JsonConvert.SerializeObject(result, Formatting.Indented));
                }
            }
            catch (Exception ex)
            {
                var result = new Dictionary<string, object>
                {
                    { "status", false },
                    { "message", ex.Message },
                    { "tableName", tableName },
                    { "columns", new List<object>() },
                    { "estimatedRowCount", 0 }
                };
                Logger.Instance.Error($"获取表信息失败: {ex.Message}");
                return Task.FromResult(JsonConvert.SerializeObject(result, Formatting.Indented));
            }
        }

        public List<Dictionary<string, object>> getTableData(SQLiteConnection connection, string sql)
        {
            var query = connection.CreateCommand();
            query.CommandText = sql;

            var data = new List<Dictionary<string, object>>();
            using (var reader = query.ExecuteReader())
            {
                if (reader.HasRows)
                {
                    while (reader.Read())
                    {
                        var row = new Dictionary<string, object>();
                        for (int i = 0; i < reader.FieldCount; i++)
                        {
                            string columnName = reader.GetName(i);
                            object columnValue = reader.GetValue(i);

                            if (columnValue == DBNull.Value)
                            {
                                columnValue = null; // 或者 "(空)"
                            }

                            row[columnName] = columnValue;
                        }
                        data.Add(row);
                    }
                }
            }
            return data;
        }
    }
}
