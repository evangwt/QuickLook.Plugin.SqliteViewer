using System;
using System.Collections.Generic;
using System.Data.SQLite;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Controls;
using QuickLook.Common.Helpers;
using QuickLook.Common.Plugin;
using Newtonsoft.Json;


namespace QuickLook.Plugin.SqliteViewer
{
    public class Plugin : IViewer
    {
        public int Priority => 0;
        private readonly string[] _Extensions = [".db", ".sqlite", ".sqlite3"];

        public void Init()
        {
        }

        public bool CanHandle(string path)
        {
            return !Directory.Exists(path) && _Extensions.Contains(Path.GetExtension(path).ToLower());
        }

        public void Prepare(string path, ContextObject context)
        {
            context.PreferredSize = new Size { Width = 800, Height = 600 };
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

        public WebBrowser GetViewerContent(string filePath)
        {
            using var connection = new SQLiteConnection($"Data Source={filePath};Mode=ReadOnly;");
            connection.Open();
            ProcessHelper.WriteLog($"数据库 {filePath} 连接成功");

            // 获取所有表名
            var tablesQuery = connection.CreateCommand();
            tablesQuery.CommandText = "SELECT name FROM sqlite_master WHERE type='table';";
            var tableNames = new List<string>();
            using (var reader = tablesQuery.ExecuteReader())
            {
                while (reader.Read())
                {
                    tableNames.Add(reader.GetString(0));
                }
            }

            // 加载 HTML 页面
            string pluginPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "UserData\\QuickLook.Plugin\\QuickLook.Plugin.SqliteViewer");
            string tmplHtmlFilePath = Path.Combine(pluginPath, "tmpl_index.html");
            string htmlFilePath = Path.Combine(pluginPath, "index.html");
            if (!File.Exists(htmlFilePath))
            {
                // 检查模板文件是否存在
                if (!File.Exists(tmplHtmlFilePath))
                {
                    throw new FileNotFoundException($"模板文件未找到: {tmplHtmlFilePath}");
                }

                // 读取模板文件内容
                string templateContent = File.ReadAllText(tmplHtmlFilePath);

                // 替换占位符
                templateContent = templateContent.Replace("[[PLUGIN_DIR]]", pluginPath).Replace("\\", "/");

                // 将内容写入 index.html
                File.WriteAllText(htmlFilePath, templateContent);
                ProcessHelper.WriteLog($"已根据模板文件生成新的 HTML 文件: {htmlFilePath}");
            }
            ProcessHelper.WriteLog($"htmlFilePath: {htmlFilePath}");

            // 创建 WebBrowser 控件
            var webBrowser = new WebBrowser
            {
                Margin = new Thickness(10),
                MinHeight = 300,
                MinWidth = 600
            };

            // 设置 ObjectForScripting
            webBrowser.ObjectForScripting = new ScriptHandler(filePath);
            webBrowser.Navigate(new Uri(htmlFilePath));
            return webBrowser;
        }
    }

    [ComVisible(true)]
    public class ScriptHandler
    {
        private readonly string _filePath;

        public ScriptHandler(string filePath)
        {
            _filePath = filePath;
        }

        public string LoadTableData(string input, bool isTableName)
        {
            try
            {
                using (var connection = new SQLiteConnection($"Data Source={_filePath};Mode=ReadOnly;"))
                {
                    connection.Open();

                    string sql;
                    if (isTableName)
                    {
                        sql = $"select * from `{input}` limit 5";
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
                        { "data", data }
                    };
                    ProcessHelper.WriteLog($"通过sql加载表数据: {sql}, JSON 数据已生成");
                    return JsonConvert.SerializeObject(result, Formatting.Indented);
                }
            }
            catch (Exception ex)
            {
                Dictionary<string, object> result = new Dictionary<string, object> {
                    { "status", false },
                    { "message", ex.Message },
                    { "data", null }
                };
                ProcessHelper.WriteLog($"加载表数据失败: {ex.Message}");
                return JsonConvert.SerializeObject(result, Formatting.Indented);

            }
        }

        public string GetTableNames()
        {
            using (var connection = new SQLiteConnection($"Data Source={_filePath};Mode=ReadOnly;"))
            {
                connection.Open();
                var query = connection.CreateCommand();
                query.CommandText = "SELECT name FROM sqlite_master WHERE type='table';";
                var tableNames = new List<string>();
                using (var reader = query.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        tableNames.Add(reader.GetString(0));
                    }
                }
                //return tableNames.ToArray();
                return JsonConvert.SerializeObject(tableNames, Formatting.Indented);
            }
        }

        private List<Dictionary<string, object>> getTableData(SQLiteConnection connection, string sql)
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