 /**
 * 错误处理级别枚举
 */
export enum ErrorLevel {
    /** 开发模式 - 严格检查，抛出所有错误 */
    Development = 0,
    /** 测试模式 - 记录错误但不中断执行 */
    Testing = 1,
    /** 生产模式 - 最小化错误处理，优先性能 */
    Production = 2,
    /** 静默模式 - 完全禁用错误处理 */
    Silent = 3
}

/**
 * 错误处理配置
 */
export interface ErrorHandlerConfig {
    /** 错误处理级别 */
    level: ErrorLevel;
    /** 是否启用断言 */
    enableAssertions: boolean;
    /** 是否启用类型检查 */
    enableTypeChecking: boolean;
    /** 是否启用性能监控 */
    enablePerformanceMonitoring: boolean;
    /** 错误回调函数 */
    onError?: (error: Error, context?: any) => void;
    /** 警告回调函数 */
    onWarning?: (message: string, context?: any) => void;
}

/**
 * 性能监控数据
 */
interface PerformanceData {
    functionName: string;
    executionTime: number;
    callCount: number;
    averageTime: number;
    maxTime: number;
    minTime: number;
}

/**
 * 高性能错误处理系统
 * 
 * @description
 * 提供可配置的错误处理策略，支持开发和生产环境的不同行为。
 * 在生产环境中可以完全禁用错误检查以提高性能。
 * 
 * @example
 * ```typescript
 * // 配置错误处理器
 * ErrorHandler.configure({
 *   level: ErrorLevel.Development,
 *   enableAssertions: true,
 *   enableTypeChecking: true
 * });
 * 
 * // 使用断言
 * ErrorHandler.assert(player.health > 0, '玩家血量必须大于0');
 * 
 * // 类型检查
 * ErrorHandler.checkType(value, 'number', '值必须是数字');
 * 
 * // 性能监控
 * const result = ErrorHandler.monitor('expensiveFunction', () => {
 *   return expensiveOperation();
 * });
 * ```
 */
export class ErrorHandler {
    private static _config: ErrorHandlerConfig = {
        level: ErrorLevel.Development,
        enableAssertions: true,
        enableTypeChecking: true,
        enablePerformanceMonitoring: false
    };

    /** 性能监控数据 */
    private static _performanceData: Map<string, PerformanceData> = new Map();

    /** 错误统计 */
    private static _errorStats = {
        totalErrors: 0,
        totalWarnings: 0,
        totalAssertions: 0,
        totalTypeChecks: 0
    };

    /**
     * 配置错误处理器
     * @param config 配置选项
     */
    public static configure(config: Partial<ErrorHandlerConfig>): void {
        this._config = { ...this._config, ...config };
    }

    /**
     * 设置错误处理级别
     * @param level 错误处理级别
     */
    public static setLevel(level: ErrorLevel): void {
        this._config.level = level;
        
        // 根据级别自动调整其他配置
        switch (level) {
            case ErrorLevel.Development:
                this._config.enableAssertions = true;
                this._config.enableTypeChecking = true;
                break;
            case ErrorLevel.Testing:
                this._config.enableAssertions = true;
                this._config.enableTypeChecking = false;
                break;
            case ErrorLevel.Production:
                this._config.enableAssertions = false;
                this._config.enableTypeChecking = false;
                break;
            case ErrorLevel.Silent:
                this._config.enableAssertions = false;
                this._config.enableTypeChecking = false;
                this._config.enablePerformanceMonitoring = false;
                break;
        }
    }

    /**
     * 断言检查
     * @param condition 条件
     * @param message 错误消息
     * @param context 上下文信息
     */
    public static assert(condition: boolean, message: string, context?: any): asserts condition {
        if (!this._config.enableAssertions || this._config.level === ErrorLevel.Silent) {
            return;
        }

        this._errorStats.totalAssertions++;

        if (!condition) {
            const error = new Error(`断言失败: ${message}`);
            this._handleError(error, context);
        }
    }

    /**
     * 类型检查
     * @param value 要检查的值
     * @param expectedType 期望的类型
     * @param message 错误消息
     * @param context 上下文信息
     */
    public static checkType(value: any, expectedType: string, message?: string, context?: any): void {
        if (!this._config.enableTypeChecking || this._config.level === ErrorLevel.Silent) {
            return;
        }

        this._errorStats.totalTypeChecks++;

        const actualType = typeof value;
        if (actualType !== expectedType) {
            const errorMessage = message || `类型检查失败: 期望 ${expectedType}, 实际 ${actualType}`;
            const error = new Error(errorMessage);
            this._handleError(error, context);
        }
    }

    /**
     * 非空检查
     * @param value 要检查的值
     * @param message 错误消息
     * @param context 上下文信息
     */
    public static checkNotNull<T>(value: T | null | undefined, message?: string, context?: any): asserts value is T {
        if (!this._config.enableTypeChecking || this._config.level === ErrorLevel.Silent) {
            return;
        }

        this._errorStats.totalTypeChecks++;

        if (value == null) {
            const errorMessage = message || '值不能为null或undefined';
            const error = new Error(errorMessage);
            this._handleError(error, context);
        }
    }

    /**
     * 范围检查
     * @param value 要检查的值
     * @param min 最小值
     * @param max 最大值
     * @param message 错误消息
     * @param context 上下文信息
     */
    public static checkRange(value: number, min: number, max: number, message?: string, context?: any): void {
        if (!this._config.enableAssertions || this._config.level === ErrorLevel.Silent) {
            return;
        }

        this._errorStats.totalAssertions++;

        if (value < min || value > max) {
            const errorMessage = message || `值 ${value} 超出范围 [${min}, ${max}]`;
            const error = new Error(errorMessage);
            this._handleError(error, context);
        }
    }

    /**
     * 数组边界检查
     * @param array 数组
     * @param index 索引
     * @param message 错误消息
     * @param context 上下文信息
     */
    public static checkArrayBounds<T>(array: T[], index: number, message?: string, context?: any): void {
        if (!this._config.enableAssertions || this._config.level === ErrorLevel.Silent) {
            return;
        }

        this._errorStats.totalAssertions++;

        if (index < 0 || index >= array.length) {
            const errorMessage = message || `数组索引 ${index} 超出边界 [0, ${array.length - 1}]`;
            const error = new Error(errorMessage);
            this._handleError(error, context);
        }
    }

    /**
     * 性能监控装饰器
     * @param name 函数名称
     * @param fn 要监控的函数
     * @returns 函数执行结果
     */
    public static monitor<T>(name: string, fn: () => T): T {
        if (!this._config.enablePerformanceMonitoring || this._config.level === ErrorLevel.Silent) {
            return fn();
        }

        const startTime = performance.now();
        
        try {
            const result = fn();
            const endTime = performance.now();
            this._recordPerformance(name, endTime - startTime);
            return result;
        } catch (error) {
            const endTime = performance.now();
            this._recordPerformance(name, endTime - startTime);
            throw error;
        }
    }

    /**
     * 异步性能监控
     * @param name 函数名称
     * @param fn 要监控的异步函数
     * @returns Promise结果
     */
    public static async monitorAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
        if (!this._config.enablePerformanceMonitoring || this._config.level === ErrorLevel.Silent) {
            return fn();
        }

        const startTime = performance.now();
        
        try {
            const result = await fn();
            const endTime = performance.now();
            this._recordPerformance(name, endTime - startTime);
            return result;
        } catch (error) {
            const endTime = performance.now();
            this._recordPerformance(name, endTime - startTime);
            throw error;
        }
    }

    /**
     * 记录性能数据
     */
    private static _recordPerformance(name: string, executionTime: number): void {
        let data = this._performanceData.get(name);
        
        if (!data) {
            data = {
                functionName: name,
                executionTime: 0,
                callCount: 0,
                averageTime: 0,
                maxTime: 0,
                minTime: Infinity
            };
            this._performanceData.set(name, data);
        }

        data.callCount++;
        data.executionTime += executionTime;
        data.averageTime = data.executionTime / data.callCount;
        data.maxTime = Math.max(data.maxTime, executionTime);
        data.minTime = Math.min(data.minTime, executionTime);
    }

    /**
     * 处理错误
     */
    private static _handleError(error: Error, context?: any): never {
        this._errorStats.totalErrors++;

        // 调用错误回调
        if (this._config.onError) {
            try {
                this._config.onError(error, context);
            } catch (callbackError) {
                console.error('错误回调执行失败:', callbackError);
            }
        }

        // 根据错误级别决定行为
        switch (this._config.level) {
            case ErrorLevel.Development:
                throw error; // 开发模式：抛出错误
            case ErrorLevel.Testing:
                console.error('错误:', error.message, context);
                throw error; // 测试模式：记录并抛出
            case ErrorLevel.Production:
                console.warn('错误:', error.message);
                throw error; // 生产模式：警告并抛出
            case ErrorLevel.Silent:
                // 静默模式：什么都不做
                break;
        }

        throw error; // 默认行为
    }

    /**
     * 发出警告
     * @param message 警告消息
     * @param context 上下文信息
     */
    public static warn(message: string, context?: any): void {
        if (this._config.level === ErrorLevel.Silent) {
            return;
        }

        this._errorStats.totalWarnings++;

        // 调用警告回调
        if (this._config.onWarning) {
            try {
                this._config.onWarning(message, context);
            } catch (callbackError) {
                console.error('警告回调执行失败:', callbackError);
            }
        }

        // 根据错误级别决定输出方式
        switch (this._config.level) {
            case ErrorLevel.Development:
            case ErrorLevel.Testing:
                console.warn('警告:', message, context);
                break;
            case ErrorLevel.Production:
                console.warn('警告:', message);
                break;
        }
    }

    /**
     * 获取性能统计信息
     */
    public static getPerformanceStats(): ReadonlyMap<string, Readonly<PerformanceData>> {
        return new Map(this._performanceData);
    }

    /**
     * 获取错误统计信息
     */
    public static getErrorStats(): Readonly<typeof ErrorHandler._errorStats> {
        return { ...this._errorStats };
    }

    /**
     * 重置统计信息
     */
    public static resetStats(): void {
        this._performanceData.clear();
        this._errorStats = {
            totalErrors: 0,
            totalWarnings: 0,
            totalAssertions: 0,
            totalTypeChecks: 0
        };
    }

    /**
     * 获取当前配置
     */
    public static getConfig(): Readonly<ErrorHandlerConfig> {
        return { ...this._config };
    }

    /**
     * 创建带错误处理的函数包装器
     * @param fn 原函数
     * @param name 函数名称
     * @param enableMonitoring 是否启用性能监控
     * @returns 包装后的函数
     */
    public static wrap<TArgs extends any[], TReturn>(
        fn: (...args: TArgs) => TReturn,
        name: string,
        enableMonitoring: boolean = false
    ): (...args: TArgs) => TReturn {
        return (...args: TArgs): TReturn => {
            try {
                if (enableMonitoring) {
                    return this.monitor(name, () => fn(...args));
                } else {
                    return fn(...args);
                }
            } catch (error) {
                this._handleError(error instanceof Error ? error : new Error(String(error)), { args, functionName: name });
            }
        };
    }
}

/**
 * 错误处理装饰器工厂
 * @param options 装饰器选项
 */
export function errorHandler(options: {
    name?: string;
    enableMonitoring?: boolean;
    enableTypeChecking?: boolean;
} = {}) {
    return function <T extends (...args: any[]) => any>(
        target: any,
        propertyKey: string,
        descriptor: TypedPropertyDescriptor<T>
    ): TypedPropertyDescriptor<T> {
        const originalMethod = descriptor.value!;
        const methodName = options.name || `${target.constructor.name}.${propertyKey}`;

        descriptor.value = function (this: any, ...args: any[]) {
            // 类型检查
            if (options.enableTypeChecking) {
                for (let i = 0; i < args.length; i++) {
                    if (args[i] == null) {
                        ErrorHandler.warn(`方法 ${methodName} 的第 ${i + 1} 个参数为null或undefined`);
                    }
                }
            }

            // 执行方法
            if (options.enableMonitoring) {
                return ErrorHandler.monitor(methodName, () => originalMethod.apply(this, args));
            } else {
                try {
                    return originalMethod.apply(this, args);
                } catch (error) {
                    const errorInstance = error instanceof Error ? error : new Error(String(error));
                    ErrorHandler.warn(`方法 ${methodName} 执行失败`, { error: errorInstance, args, instance: this });
                    throw errorInstance;
                }
            }
        } as T;

        return descriptor;
    };
}