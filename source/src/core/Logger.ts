/**
 * 日志级别枚举
 */
export enum LogLevel {
    /** 调试信息 */
    Debug = 0,
    /** 一般信息 */
    Info = 1,
    /** 警告信息 */
    Warn = 2,
    /** 错误信息 */
    Error = 3,
    /** 关闭日志 */
    None = 4
}

/**
 * 日志配置接口
 */
export interface LoggerConfig {
    /** 最小日志级别 */
    minLevel: LogLevel;
    /** 是否启用时间戳 */
    enableTimestamp: boolean;
    /** 是否启用堆栈跟踪（仅错误级别） */
    enableStackTrace: boolean;
    /** 是否启用性能模式（减少字符串格式化） */
    performanceMode: boolean;
    /** 自定义前缀 */
    prefix?: string;
    /** 是否启用批量模式 */
    batchMode?: boolean;
    /** 批量大小 */
    batchSize?: number;
    /** 批量刷新间隔（毫秒） */
    batchFlushInterval?: number;
}

/**
 * 日志条目接口
 */
interface LogEntry {
    level: LogLevel;
    message: string;
    data?: any;
    timestamp: number;
    prefix?: string;
}

/**
 * 高性能日志系统
 * 
 * @description
 * 提供分级日志记录功能，支持性能优化模式。
 * 在性能模式下，会跳过不必要的字符串格式化和时间戳计算。
 * 支持批量输出和延迟日志记录。
 * 
 * @example
 * ```typescript
 * // 基本使用
 * Logger.info('游戏开始');
 * Logger.warn('玩家血量低', { health: 10 });
 * Logger.error('网络连接失败', error);
 * 
 * // 配置日志系统
 * Logger.configure({
 *   minLevel: LogLevel.Warn,
 *   enableTimestamp: true,
 *   performanceMode: false,
 *   batchMode: true,
 *   batchSize: 50
 * });
 * 
 * // 性能敏感的代码中
 * Logger.setPerformanceMode(true);
 * ```
 */
export class Logger {
    private static _config: LoggerConfig = {
        minLevel: LogLevel.Debug,
        enableTimestamp: true,
        enableStackTrace: true,
        performanceMode: false,
        prefix: ''
    };

    /** 批量日志缓冲区 */
    private static _logBuffer: LogEntry[] = [];
    
    /** 批量模式配置 */
    private static _batchConfig = {
        enabled: false,
        maxSize: 50,
        flushInterval: 1000, // 1秒
        lastFlushTime: 0
    };

    /** 性能模式下的简化日志函数 */
    private static _fastLog: ((message: string, data?: any) => void) | null = null;

    /** 日志级别名称映射 */
    private static readonly _levelNames: Record<LogLevel, string> = {
        [LogLevel.Debug]: 'DEBUG',
        [LogLevel.Info]: 'INFO',
        [LogLevel.Warn]: 'WARN',
        [LogLevel.Error]: 'ERROR',
        [LogLevel.None]: 'NONE'
    };

    /** 日志级别样式映射（用于浏览器控制台） */
    private static readonly _levelStyles: Record<LogLevel, string> = {
        [LogLevel.Debug]: 'color: #888',
        [LogLevel.Info]: 'color: #007acc',
        [LogLevel.Warn]: 'color: #ff8c00',
        [LogLevel.Error]: 'color: #ff4444; font-weight: bold',
        [LogLevel.None]: ''
    };

    /**
     * 配置日志系统
     * @param config 日志配置
     */
    public static configure(config: Partial<LoggerConfig>): void {
        this._config = { ...this._config, ...config };
        
        // 配置批量模式
        if (config.batchMode !== undefined) {
            this._batchConfig.enabled = config.batchMode;
        }
        if (config.batchSize !== undefined) {
            this._batchConfig.maxSize = Math.max(1, config.batchSize);
        }
        if (config.batchFlushInterval !== undefined) {
            this._batchConfig.flushInterval = Math.max(100, config.batchFlushInterval);
        }
        
        // 初始化性能模式
        this._initializePerformanceMode();
    }

    /**
     * 初始化性能模式
     */
    private static _initializePerformanceMode(): void {
        if (this._config.performanceMode) {
            // 在性能模式下，使用最简化的日志函数
            this._fastLog = (message: string, data?: any) => {
                if (data !== undefined) {
                    console.log(message, data);
                } else {
                    console.log(message);
                }
            };
        } else {
            this._fastLog = null;
        }
    }

    /**
     * 设置最小日志级别
     * @param level 最小日志级别
     */
    public static setMinLevel(level: LogLevel): void {
        this._config.minLevel = level;
    }

    /**
     * 设置性能模式
     * @param enabled 是否启用性能模式
     */
    public static setPerformanceMode(enabled: boolean): void {
        this._config.performanceMode = enabled;
        this._initializePerformanceMode();
    }

    /**
     * 启用批量模式
     * @param enabled 是否启用
     * @param maxSize 批量大小
     * @param flushInterval 刷新间隔（毫秒）
     */
    public static setBatchMode(enabled: boolean, maxSize: number = 50, flushInterval: number = 1000): void {
        this._batchConfig.enabled = enabled;
        this._batchConfig.maxSize = Math.max(1, maxSize);
        this._batchConfig.flushInterval = Math.max(100, flushInterval);
        
        if (!enabled) {
            this.flushLogs(); // 禁用时立即刷新所有日志
        }
    }

    /**
     * 记录调试信息
     * @param message 消息
     * @param data 附加数据
     */
    public static debug(message: string, data?: any): void {
        this._log(LogLevel.Debug, message, data);
    }

    /**
     * 记录一般信息
     * @param message 消息
     * @param data 附加数据
     */
    public static info(message: string, data?: any): void {
        this._log(LogLevel.Info, message, data);
    }

    /**
     * 记录警告信息
     * @param message 消息
     * @param data 附加数据
     */
    public static warn(message: string, data?: any): void {
        this._log(LogLevel.Warn, message, data);
    }

    /**
     * 记录错误信息
     * @param message 消息
     * @param error 错误对象或附加数据
     */
    public static error(message: string, error?: any): void {
        this._log(LogLevel.Error, message, error);
    }

    /**
     * 内部日志记录方法
     * @param level 日志级别
     * @param message 消息
     * @param data 附加数据
     */
    private static _log(level: LogLevel, message: string, data?: any): void {
        // 检查日志级别
        if (level < this._config.minLevel || this._config.minLevel === LogLevel.None) {
            return;
        }

        if (this._config.performanceMode && this._fastLog) {
            // 超高性能模式：跳过所有格式化
            this._fastLog(message, data);
            return;
        }

        if (this._batchConfig.enabled) {
            // 批量模式：添加到缓冲区
            this._addToBatch(level, message, data);
        } else if (this._config.performanceMode) {
            // 性能模式：简化输出
            this._performanceLog(level, message, data);
        } else {
            // 标准模式：完整格式化
            this._standardLog(level, message, data);
        }
    }

    /**
     * 添加日志到批量缓冲区
     */
    private static _addToBatch(level: LogLevel, message: string, data?: any): void {
        const entry: LogEntry = {
            level,
            message,
            data,
            timestamp: Date.now(),
            prefix: this._config.prefix
        };

        this._logBuffer.push(entry);

        // 检查是否需要刷新
        const now = Date.now();
        const shouldFlushBySize = this._logBuffer.length >= this._batchConfig.maxSize;
        const shouldFlushByTime = (now - this._batchConfig.lastFlushTime) >= this._batchConfig.flushInterval;

        if (shouldFlushBySize || shouldFlushByTime) {
            this.flushLogs();
        }
    }

    /**
     * 刷新批量日志
     */
    public static flushLogs(): void {
        if (this._logBuffer.length === 0) {
            return;
        }

        // 批量输出所有日志
        for (const entry of this._logBuffer) {
            if (this._config.performanceMode) {
                this._performanceLogEntry(entry);
            } else {
                this._standardLogEntry(entry);
            }
        }

        // 清空缓冲区
        this._logBuffer.length = 0;
        this._batchConfig.lastFlushTime = Date.now();
    }

    /**
     * 性能模式输出日志条目
     */
    private static _performanceLogEntry(entry: LogEntry): void {
        const levelName = this._levelNames[entry.level];
        const prefix = entry.prefix ? `[${entry.prefix}] ` : '';
        
        if (entry.data !== undefined) {
            console.log(`${prefix}[${levelName}] ${entry.message}`, entry.data);
        } else {
            console.log(`${prefix}[${levelName}] ${entry.message}`);
        }
    }

    /**
     * 标准模式输出日志条目
     */
    private static _standardLogEntry(entry: LogEntry): void {
        const timestamp = this._config.enableTimestamp ? this._formatTimestamp(entry.timestamp) : '';
        const levelName = this._levelNames[entry.level];
        const prefix = entry.prefix ? `[${entry.prefix}] ` : '';
        const style = this._levelStyles[entry.level];
        
        let logMessage = `${prefix}${timestamp}[${levelName}] ${entry.message}`;
        
        const consoleMethod = this._getConsoleMethod(entry.level);
        
        if (entry.data !== undefined) {
            if (style && typeof console.log === 'function') {
                consoleMethod(`%c${logMessage}`, style, entry.data);
            } else {
                consoleMethod(logMessage, entry.data);
            }
        } else {
            if (style && typeof console.log === 'function') {
                consoleMethod(`%c${logMessage}`, style);
            } else {
                consoleMethod(logMessage);
            }
        }

        // 错误级别且启用堆栈跟踪
        if (entry.level === LogLevel.Error && this._config.enableStackTrace && entry.data instanceof Error) {
            console.trace(entry.data);
        }
    }

    /**
     * 格式化时间戳
     */
    private static _formatTimestamp(timestamp: number): string {
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
        return `[${hours}:${minutes}:${seconds}.${milliseconds}] `;
    }

    /**
     * 性能模式日志输出
     * @param level 日志级别
     * @param message 消息
     * @param data 附加数据
     */
    private static _performanceLog(level: LogLevel, message: string, data?: any): void {
        const levelName = this._levelNames[level];
        const prefix = this._config.prefix ? `[${this._config.prefix}] ` : '';
        
        if (data !== undefined) {
            console.log(`${prefix}[${levelName}] ${message}`, data);
        } else {
            console.log(`${prefix}[${levelName}] ${message}`);
        }
    }

    /**
     * 标准模式日志输出
     * @param level 日志级别
     * @param message 消息
     * @param data 附加数据
     */
    private static _standardLog(level: LogLevel, message: string, data?: any): void {
        const timestamp = this._config.enableTimestamp ? this._getTimestamp() : '';
        const levelName = this._levelNames[level];
        const prefix = this._config.prefix ? `[${this._config.prefix}] ` : '';
        const style = this._levelStyles[level];
        
        let logMessage = `${prefix}${timestamp}[${levelName}] ${message}`;
        
        // 根据日志级别选择合适的console方法
        const consoleMethod = this._getConsoleMethod(level);
        
        if (data !== undefined) {
            if (style && typeof console.log === 'function') {
                consoleMethod(`%c${logMessage}`, style, data);
            } else {
                consoleMethod(logMessage, data);
            }
        } else {
            if (style && typeof console.log === 'function') {
                consoleMethod(`%c${logMessage}`, style);
            } else {
                consoleMethod(logMessage);
            }
        }

        // 错误级别且启用堆栈跟踪
        if (level === LogLevel.Error && this._config.enableStackTrace && data instanceof Error) {
            console.trace(data);
        }
    }

    /**
     * 获取时间戳字符串
     * @returns 格式化的时间戳
     */
    private static _getTimestamp(): string {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
        return `[${hours}:${minutes}:${seconds}.${milliseconds}] `;
    }

    /**
     * 根据日志级别获取对应的console方法
     * @param level 日志级别
     * @returns console方法
     */
    private static _getConsoleMethod(level: LogLevel): (...args: any[]) => void {
        switch (level) {
            case LogLevel.Debug:
                return console.debug || console.log;
            case LogLevel.Info:
                return console.info || console.log;
            case LogLevel.Warn:
                return console.warn || console.log;
            case LogLevel.Error:
                return console.error || console.log;
            default:
                return console.log;
        }
    }

    /**
     * 获取当前配置
     * @returns 当前日志配置的副本
     */
    public static getConfig(): Readonly<LoggerConfig> {
        return { ...this._config };
    }

    /**
     * 创建带前缀的日志器
     * @param prefix 前缀
     * @returns 新的日志器实例
     */
    public static createPrefixed(prefix: string): PrefixedLogger {
        return new PrefixedLogger(prefix);
    }
}

/**
 * 带前缀的日志器
 * 用于为特定模块或组件创建专用的日志器
 */
export class PrefixedLogger {
    constructor(private readonly _prefix: string) {}

    public debug(message: string, data?: any): void {
        Logger.debug(`[${this._prefix}] ${message}`, data);
    }

    public info(message: string, data?: any): void {
        Logger.info(`[${this._prefix}] ${message}`, data);
    }

    public warn(message: string, data?: any): void {
        Logger.warn(`[${this._prefix}] ${message}`, data);
    }

    public error(message: string, error?: any): void {
        Logger.error(`[${this._prefix}] ${message}`, error);
    }
}