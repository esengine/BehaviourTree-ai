/**
 * 高性能断言工具类
 * 
 * @description
 * 提供类型安全的断言方法，支持开发和生产环境的不同行为。
 * 在生产环境中可以禁用断言以提高性能。
 * 
 * @example
 * ```typescript
 * // 基本断言
 * Assert.isTrue(player.health > 0, '玩家血量必须大于0');
 * Assert.isNotNull(gameObject, '游戏对象不能为空');
 * 
 * // 类型安全的断言
 * const value: unknown = getData();
 * Assert.isNumber(value, '数据必须是数字');
 * // 现在 value 的类型被缩窄为 number
 * 
 * // 配置断言行为
 * Assert.setEnabled(false); // 在生产环境中禁用
 * ```
 */
export class Assert {
    /** 是否启用断言检查 */
    private static _enabled: boolean = true;
    
    /** 是否在断言失败时抛出异常而不是仅记录 */
    private static _throwOnFailure: boolean = false;

    /**
     * 设置是否启用断言
     * @param enabled 是否启用
     */
    public static setEnabled(enabled: boolean): void {
        this._enabled = enabled;
    }

    /**
     * 设置断言失败时的行为
     * @param throwOnFailure 是否抛出异常，false则仅记录到控制台
     */
    public static setThrowOnFailure(throwOnFailure: boolean): void {
        this._throwOnFailure = throwOnFailure;
    }

    /**
     * 断言失败处理
     * @param message 错误消息
     * @param args 附加参数
     */
    public static fail(message?: string, ...args: any[]): never {
        const errorMessage = message || '断言失败';
        
        if (this._throwOnFailure) {
            throw new Error(errorMessage);
        } else {
            console.assert(false, errorMessage, ...args);
            throw new Error(errorMessage); // 总是抛出错误，因为这是fail方法
        }
    }

    /**
     * 断言条件为真
     * @param condition 要检查的条件
     * @param message 失败时的错误消息
     * @param args 附加参数
     */
    public static isTrue(condition: boolean, message?: string, ...args: any[]): asserts condition {
        if (!this._enabled) return;
        
        if (!condition) {
            this.fail(message || '条件必须为真', ...args);
        }
    }

    /**
     * 断言条件为假
     * @param condition 要检查的条件
     * @param message 失败时的错误消息
     * @param args 附加参数
     */
    public static isFalse(condition: boolean, message?: string, ...args: any[]): asserts condition is false {
        if (!this._enabled) return;
        
        if (condition) {
            this.fail(message || '条件必须为假', ...args);
        }
    }

    /**
     * 断言对象不为null或undefined
     * @param obj 要检查的对象
     * @param message 失败时的错误消息
     * @param args 附加参数
     */
    public static isNotNull<T>(obj: T | null | undefined, message?: string, ...args: any[]): asserts obj is T {
        if (!this._enabled) return;
        
        if (obj == null) {
            this.fail(message || '对象不能为null或undefined', ...args);
        }
    }

    /**
     * 断言对象为null或undefined
     * @param obj 要检查的对象
     * @param message 失败时的错误消息
     * @param args 附加参数
     */
    public static isNull(obj: any, message?: string, ...args: any[]): asserts obj is null | undefined {
        if (!this._enabled) return;
        
        if (obj != null) {
            this.fail(message || '对象必须为null或undefined', ...args);
        }
    }

    /**
     * 断言值为数字类型
     * @param value 要检查的值
     * @param message 失败时的错误消息
     * @param args 附加参数
     */
    public static isNumber(value: unknown, message?: string, ...args: any[]): asserts value is number {
        if (!this._enabled) return;
        
        if (typeof value !== 'number' || isNaN(value)) {
            this.fail(message || '值必须是有效数字', ...args);
        }
    }

    /**
     * 断言值为字符串类型
     * @param value 要检查的值
     * @param message 失败时的错误消息
     * @param args 附加参数
     */
    public static isString(value: unknown, message?: string, ...args: any[]): asserts value is string {
        if (!this._enabled) return;
        
        if (typeof value !== 'string') {
            this.fail(message || '值必须是字符串', ...args);
        }
    }

    /**
     * 断言值为布尔类型
     * @param value 要检查的值
     * @param message 失败时的错误消息
     * @param args 附加参数
     */
    public static isBoolean(value: unknown, message?: string, ...args: any[]): asserts value is boolean {
        if (!this._enabled) return;
        
        if (typeof value !== 'boolean') {
            this.fail(message || '值必须是布尔值', ...args);
        }
    }

    /**
     * 断言值为函数类型
     * @param value 要检查的值
     * @param message 失败时的错误消息
     * @param args 附加参数
     */
    public static isFunction(value: unknown, message?: string, ...args: any[]): asserts value is Function {
        if (!this._enabled) return;
        
        if (typeof value !== 'function') {
            this.fail(message || '值必须是函数', ...args);
        }
    }

    /**
     * 断言值为对象类型（非null）
     * @param value 要检查的值
     * @param message 失败时的错误消息
     * @param args 附加参数
     */
    public static isObject(value: unknown, message?: string, ...args: any[]): asserts value is object {
        if (!this._enabled) return;
        
        if (typeof value !== 'object' || value === null) {
            this.fail(message || '值必须是对象', ...args);
        }
    }

    /**
     * 断言数组不为空
     * @param array 要检查的数组
     * @param message 失败时的错误消息
     * @param args 附加参数
     */
    public static isNotEmpty<T>(array: T[], message?: string, ...args: any[]): asserts array is [T, ...T[]] {
        if (!this._enabled) return;
        
        this.isNotNull(array, message, ...args);
        if (array.length === 0) {
            this.fail(message || '数组不能为空', ...args);
        }
    }

    /**
     * 断言字符串不为空
     * @param str 要检查的字符串
     * @param message 失败时的错误消息
     * @param args 附加参数
     */
    public static isNotEmptyString(str: string | null | undefined, message?: string, ...args: any[]): asserts str is string {
        if (!this._enabled) return;
        
        this.isNotNull(str, message, ...args);
        if (str.trim().length === 0) {
            this.fail(message || '字符串不能为空', ...args);
        }
    }

    /**
     * 断言数值在指定范围内
     * @param value 要检查的数值
     * @param min 最小值（包含）
     * @param max 最大值（包含）
     * @param message 失败时的错误消息
     * @param args 附加参数
     */
    public static inRange(value: number, min: number, max: number, message?: string, ...args: any[]): void {
        if (!this._enabled) return;
        
        this.isNumber(value, message, ...args);
        if (value < min || value > max) {
            this.fail(message || `值必须在 ${min} 到 ${max} 之间`, ...args);
        }
    }

    /**
     * 断言值是指定类型的实例
     * @param value 要检查的值
     * @param constructor 构造函数
     * @param message 失败时的错误消息
     * @param args 附加参数
     */
    public static isInstanceOf<T>(
        value: unknown, 
        constructor: new (...args: any[]) => T, 
        message?: string, 
        ...args: any[]
    ): asserts value is T {
        if (!this._enabled) return;
        
        if (!(value instanceof constructor)) {
            this.fail(message || `值必须是 ${constructor.name} 的实例`, ...args);
        }
    }

    /**
     * 断言数组包含指定元素
     * @param array 要检查的数组
     * @param element 要查找的元素
     * @param message 失败时的错误消息
     * @param args 附加参数
     */
    public static contains<T>(array: T[], element: T, message?: string, ...args: any[]): void {
        if (!this._enabled) return;
        
        this.isNotNull(array, message, ...args);
        if (!array.includes(element)) {
            this.fail(message || '数组必须包含指定元素', ...args);
        }
    }

    /**
     * 获取当前断言配置
     * @returns 配置对象
     */
    public static getConfig(): { enabled: boolean; throwOnFailure: boolean } {
        return {
            enabled: this._enabled,
            throwOnFailure: this._throwOnFailure
        };
    }
}
