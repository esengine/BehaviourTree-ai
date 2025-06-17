 /**
 * 类型检查结果
 */
export interface TypeCheckResult<T = any> {
    /** 是否通过检查 */
    success: boolean;
    /** 检查的值 */
    value: T;
    /** 错误信息 */
    error?: string;
    /** 期望的类型 */
    expectedType?: string;
    /** 实际的类型 */
    actualType?: string;
}

/**
 * 类型验证器接口
 */
export interface TypeValidator<T> {
    /** 验证函数 */
    validate: (value: unknown) => value is T;
    /** 类型名称 */
    typeName: string;
    /** 错误消息模板 */
    errorMessage?: string;
}

/**
 * 复合类型验证器
 */
export interface CompositeValidator<T> {
    /** 验证函数 */
    validate: (value: unknown) => TypeCheckResult<T>;
    /** 类型名称 */
    typeName: string;
}

/**
 * 高性能运行时类型检查工具
 * 
 * @description
 * 提供全面的运行时类型检查和类型守卫功能，替代不安全的类型断言。
 * 支持基础类型、复合类型、自定义验证器等。
 * 
 * @example
 * ```typescript
 * // 基础类型检查
 * if (TypeGuards.isString(value)) {
 *   // value 现在是 string 类型
 *   console.log(value.toUpperCase());
 * }
 * 
 * // 复合类型检查
 * const result = TypeGuards.checkObject(data, {
 *   name: TypeGuards.validators.string,
 *   age: TypeGuards.validators.number,
 *   email: TypeGuards.validators.optional(TypeGuards.validators.string)
 * });
 * 
 * // 数组类型检查
 * if (TypeGuards.isArrayOf(value, TypeGuards.isNumber)) {
 *   // value 现在是 number[] 类型
 *   const sum = value.reduce((a, b) => a + b, 0);
 * }
 * 
 * // 自定义验证器
 * const isPositiveNumber = TypeGuards.createValidator<number>(
 *   (value): value is number => typeof value === 'number' && value > 0,
 *   'PositiveNumber'
 * );
 * ```
 */
export class TypeGuards {
    /** 内置验证器 */
    public static readonly validators = {
        /** 字符串验证器 */
        string: TypeGuards.createValidator<string>(
            (value): value is string => typeof value === 'string',
            'string'
        ),

        /** 数字验证器 */
        number: TypeGuards.createValidator<number>(
            (value): value is number => typeof value === 'number' && !isNaN(value),
            'number'
        ),

        /** 布尔值验证器 */
        boolean: TypeGuards.createValidator<boolean>(
            (value): value is boolean => typeof value === 'boolean',
            'boolean'
        ),

        /** 函数验证器 */
        function: TypeGuards.createValidator<Function>(
            (value): value is Function => typeof value === 'function',
            'function'
        ),

        /** 对象验证器 */
        object: TypeGuards.createValidator<object>(
            (value): value is object => typeof value === 'object' && value !== null,
            'object'
        ),

        /** 数组验证器 */
        array: TypeGuards.createValidator<any[]>(
            (value): value is any[] => Array.isArray(value),
            'array'
        ),

        /** 非空验证器 */
        notNull: TypeGuards.createValidator<NonNullable<any>>(
            (value): value is NonNullable<any> => value != null,
            'not null'
        ),

        /** 整数验证器 */
        integer: TypeGuards.createValidator<number>(
            (value): value is number => typeof value === 'number' && Number.isInteger(value),
            'integer'
        ),

        /** 正数验证器 */
        positiveNumber: TypeGuards.createValidator<number>(
            (value): value is number => typeof value === 'number' && value > 0,
            'positive number'
        ),

        /** 非负数验证器 */
        nonNegativeNumber: TypeGuards.createValidator<number>(
            (value): value is number => typeof value === 'number' && value >= 0,
            'non-negative number'
        ),

        /** 非空字符串验证器 */
        nonEmptyString: TypeGuards.createValidator<string>(
            (value): value is string => typeof value === 'string' && value.trim().length > 0,
            'non-empty string'
        ),

        /** 可选验证器工厂 */
        optional: <T>(validator: TypeValidator<T>): TypeValidator<T | undefined> => ({
            validate: (value): value is T | undefined => value === undefined || validator.validate(value),
            typeName: `${validator.typeName} | undefined`,
            errorMessage: `Expected ${validator.typeName} or undefined`
        }),

        /** 可空验证器工厂 */
        nullable: <T>(validator: TypeValidator<T>): TypeValidator<T | null> => ({
            validate: (value): value is T | null => value === null || validator.validate(value),
            typeName: `${validator.typeName} | null`,
            errorMessage: `Expected ${validator.typeName} or null`
        }),

        /** 联合类型验证器工厂 */
        union: <T extends readonly TypeValidator<any>[]>(...validators: T): TypeValidator<T[number] extends TypeValidator<infer U> ? U : never> => ({
            validate: (value): value is any => validators.some(v => v.validate(value)),
            typeName: validators.map(v => v.typeName).join(' | '),
            errorMessage: `Expected one of: ${validators.map(v => v.typeName).join(', ')}`
        })
    };

    // ===== 基础类型守卫 =====

    /**
     * 检查是否为字符串
     */
    public static isString(value: unknown): value is string {
        return typeof value === 'string';
    }

    /**
     * 检查是否为数字
     */
    public static isNumber(value: unknown): value is number {
        return typeof value === 'number' && !isNaN(value);
    }

    /**
     * 检查是否为布尔值
     */
    public static isBoolean(value: unknown): value is boolean {
        return typeof value === 'boolean';
    }

    /**
     * 检查是否为函数
     */
    public static isFunction(value: unknown): value is Function {
        return typeof value === 'function';
    }

    /**
     * 检查是否为对象（非null）
     */
    public static isObject(value: unknown): value is object {
        return typeof value === 'object' && value !== null;
    }

    /**
     * 检查是否为数组
     */
    public static isArray(value: unknown): value is any[] {
        return Array.isArray(value);
    }

    /**
     * 检查是否为null或undefined
     */
    public static isNullish(value: unknown): value is null | undefined {
        return value == null;
    }

    /**
     * 检查是否不为null或undefined
     */
    public static isNotNull<T>(value: T | null | undefined): value is T {
        return value != null;
    }

    // ===== 复合类型守卫 =====

    /**
     * 检查是否为指定类型的数组
     */
    public static isArrayOf<T>(
        value: unknown, 
        itemGuard: (item: unknown) => item is T
    ): value is T[] {
        return Array.isArray(value) && value.every(itemGuard);
    }

    /**
     * 检查是否为字符串数组
     */
    public static isStringArray(value: unknown): value is string[] {
        return this.isArrayOf(value, this.isString);
    }

    /**
     * 检查是否为数字数组
     */
    public static isNumberArray(value: unknown): value is number[] {
        return this.isArrayOf(value, this.isNumber);
    }

    /**
     * 检查是否为指定类的实例
     */
    public static isInstanceOf<T>(
        value: unknown, 
        constructor: new (...args: any[]) => T
    ): value is T {
        return value instanceof constructor;
    }

    /**
     * 检查对象是否具有指定的属性
     */
    public static hasProperty<K extends string>(
        value: unknown, 
        property: K
    ): value is Record<K, unknown> {
        return this.isObject(value) && property in value;
    }

    /**
     * 检查对象是否具有指定类型的属性
     */
    public static hasPropertyOfType<K extends string, T>(
        value: unknown,
        property: K,
        typeGuard: (value: unknown) => value is T
    ): value is Record<K, T> {
        return this.hasProperty(value, property) && 
               typeGuard((value as Record<K, unknown>)[property]);
    }

    // ===== 高级类型检查 =====

    /**
     * 创建自定义验证器
     */
    public static createValidator<T>(
        guard: (value: unknown) => value is T,
        typeName: string,
        errorMessage?: string
    ): TypeValidator<T> {
        return {
            validate: guard,
            typeName,
            errorMessage: errorMessage || `Expected ${typeName}`
        };
    }

    /**
     * 检查对象结构
     */
    public static checkObject<T extends Record<string, any>>(
        value: unknown,
        schema: { [K in keyof T]: TypeValidator<T[K]> }
    ): TypeCheckResult<T> {
        if (!this.isObject(value)) {
            return {
                success: false,
                value: value as T,
                error: 'Value is not an object',
                expectedType: 'object',
                actualType: typeof value
            };
        }

        const obj = value as Record<string, unknown>;
        const result: Partial<T> = {};
        
        for (const [key, validator] of Object.entries(schema)) {
            const propValue = obj[key];
            
            if (!validator.validate(propValue)) {
                return {
                    success: false,
                    value: value as T,
                    error: `Property '${key}' ${validator.errorMessage || `is not of type ${validator.typeName}`}`,
                    expectedType: validator.typeName,
                    actualType: typeof propValue
                };
            }
            
            result[key as keyof T] = propValue as T[keyof T];
        }

        return {
            success: true,
            value: result as T
        };
    }

    /**
     * 安全类型转换
     */
    public static safeCast<T>(
        value: unknown,
        validator: TypeValidator<T>
    ): TypeCheckResult<T> {
        if (validator.validate(value)) {
            return {
                success: true,
                value
            };
        }

        return {
            success: false,
            value: value as T,
            error: validator.errorMessage || `Value is not of type ${validator.typeName}`,
            expectedType: validator.typeName,
            actualType: typeof value
        };
    }

    /**
     * 断言类型（开发模式下抛出错误）
     */
    public static assertType<T>(
        value: unknown,
        validator: TypeValidator<T>,
        message?: string
    ): asserts value is T {
        if (!validator.validate(value)) {
            const error = message || 
                         validator.errorMessage || 
                         `Type assertion failed: expected ${validator.typeName}, got ${typeof value}`;
            throw new TypeError(error);
        }
    }

    /**
     * 尝试类型转换
     */
    public static tryConvert<T>(
        value: unknown,
        converter: (value: unknown) => T,
        validator: TypeValidator<T>
    ): TypeCheckResult<T> {
        try {
            const converted = converter(value);
            
            if (validator.validate(converted)) {
                return {
                    success: true,
                    value: converted
                };
            }

            return {
                success: false,
                value: converted,
                error: `Conversion result is not of type ${validator.typeName}`,
                expectedType: validator.typeName,
                actualType: typeof converted
            };
        } catch (error) {
            return {
                success: false,
                value: value as T,
                error: `Conversion failed: ${error instanceof Error ? error.message : String(error)}`,
                expectedType: validator.typeName,
                actualType: typeof value
            };
        }
    }

    // ===== 常用转换器 =====

    /**
     * 字符串转数字
     */
    public static stringToNumber(value: unknown): TypeCheckResult<number> {
        return this.tryConvert(
            value,
            (v) => {
                if (typeof v === 'string') {
                    const num = Number(v);
                    if (isNaN(num)) {
                        throw new Error('Invalid number format');
                    }
                    return num;
                }
                throw new Error('Value is not a string');
            },
            this.validators.number
        );
    }

    /**
     * 任意值转字符串
     */
    public static toString(value: unknown): TypeCheckResult<string> {
        return this.tryConvert(
            value,
            (v) => String(v),
            this.validators.string
        );
    }

    /**
     * 任意值转布尔值
     */
    public static toBoolean(value: unknown): TypeCheckResult<boolean> {
        return this.tryConvert(
            value,
            (v) => Boolean(v),
            this.validators.boolean
        );
    }

    // ===== 范围检查 =====

    /**
     * 检查数字是否在指定范围内
     */
    public static isInRange(
        value: unknown,
        min: number,
        max: number,
        inclusive: boolean = true
    ): value is number {
        if (!this.isNumber(value)) {
            return false;
        }

        return inclusive ? 
            (value >= min && value <= max) : 
            (value > min && value < max);
    }

    /**
     * 检查字符串长度是否在指定范围内
     */
    public static isStringLengthInRange(
        value: unknown,
        minLength: number,
        maxLength: number
    ): value is string {
        return this.isString(value) && 
               value.length >= minLength && 
               value.length <= maxLength;
    }

    /**
     * 检查数组长度是否在指定范围内
     */
    public static isArrayLengthInRange(
        value: unknown,
        minLength: number,
        maxLength: number
    ): value is any[] {
        return this.isArray(value) && 
               value.length >= minLength && 
               value.length <= maxLength;
    }

    // ===== 模式匹配 =====

    /**
     * 检查字符串是否匹配正则表达式
     */
    public static matchesPattern(
        value: unknown,
        pattern: RegExp
    ): value is string {
        return this.isString(value) && pattern.test(value);
    }

    /**
     * 检查是否为有效的电子邮件地址
     */
    public static isEmail(value: unknown): value is string {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return this.matchesPattern(value, emailPattern);
    }

    /**
     * 检查是否为有效的URL
     */
    public static isUrl(value: unknown): value is string {
        if (!this.isString(value)) {
            return false;
        }

        try {
            new URL(value);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 检查是否为有效的UUID
     */
    public static isUuid(value: unknown): value is string {
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return this.matchesPattern(value, uuidPattern);
    }
}