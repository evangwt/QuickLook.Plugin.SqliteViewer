using System;
using System.IO;
using System.Reflection;

public class Logger
{
    // 单例实例
    private static readonly Lazy<Logger> _instance = new Lazy<Logger>(() => new Logger());
    private readonly string pluginDir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);

    // 配置项：是否打印日志
    public LogLevel Level { get; set; } = LogLevel.Info;

    // 日志级别
    public enum LogLevel
    {
        Trace = 0,
        Debug = 1,
        Info = 2,
        Warning = 3,
        Error = 4,
        Fatal = 5,
    }

    // 私有构造函数，防止外部实例化
    private Logger() { }

    // 公共静态属性，提供全局访问点
    public static Logger Instance => _instance.Value;

    // 日志方法
    public void Log(string message, LogLevel level = LogLevel.Info)
    {
        if ((int)level < (int)Level)
        {
            return;
        }
        string levelPrefix = level switch
        {
            LogLevel.Trace => "[TRACE]",
            LogLevel.Debug => "[DEBUG]",
            LogLevel.Info => "[ INFO]",
            LogLevel.Warning => "[ WARN]",
            LogLevel.Error => "[ERROR]",
            LogLevel.Fatal => "[FATAL]",
            _ => ""
        };

        string msg = $"{levelPrefix} [{DateTime.Now}] {message}";
        System.Diagnostics.Debug.WriteLine(msg);

        var logFilePath = Path.Combine(pluginDir, @"logger.log");
        using (var writer = new StreamWriter(new FileStream(logFilePath, FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.Read)))
        {
            writer.BaseStream.Seek(0, SeekOrigin.End);
            writer.WriteLine(msg);
        }
    }
    public void Trace(string message) { Log(message, LogLevel.Trace); }
    public void Debug(string message) { Log(message, LogLevel.Debug); }
    public void Info(string message) { Log(message, LogLevel.Info); }
    public void Warning(string message) { Log(message, LogLevel.Warning); }
    public void Error(string message) { Log(message, LogLevel.Error); }
    public void Fatal(string message) { Log(message, LogLevel.Fatal); }
}

