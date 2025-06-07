/**
 * 高性能伪随机数生成器
 * 使用xorshift128算法，比原生Math.random()更快且质量更好
 * 
 * @example
 * ```typescript
 * // 设置种子（可选，默认使用当前时间）
 * Random.setSeed(12345);
 * 
 * // 生成0-1之间的随机数
 * const value = Random.value();
 * 
 * // 生成指定范围的随机数
 * const rangeValue = Random.range(10, 20);
 * 
 * // 生成随机整数
 * const intValue = Random.integer(1, 100);
 * 
 * // 随机布尔值
 * const bool = Random.boolean();
 * 
 * // 带概率的布尔值
 * const probBool = Random.chance(0.7); // 70%概率返回true
 * ```
 */
export class Random {
    private static _x: number = 123456789;
    private static _y: number = 362436069;
    private static _z: number = 521288629;
    private static _w: number = 88675123;
    private static _initialized: boolean = false;

    /**
     * 设置随机数种子
     * @param seed 种子值，如果不提供则使用当前时间
     */
    public static setSeed(seed?: number): void {
        if (seed === undefined) {
            seed = Date.now();
        }
        
        // 使用种子初始化四个状态变量
        this._x = seed >>> 0;
        this._y = (seed * 1812433253 + 1) >>> 0;
        this._z = (this._y * 1812433253 + 1) >>> 0;
        this._w = (this._z * 1812433253 + 1) >>> 0;
        
        // 确保所有状态变量都非零
        if (this._x === 0) this._x = 1;
        if (this._y === 0) this._y = 1;
        if (this._z === 0) this._z = 1;
        if (this._w === 0) this._w = 1;
        
        this._initialized = true;
        
        // 预热生成器
        for (let i = 0; i < 10; i++) {
            this.next();
        }
    }

    /**
     * 生成下一个32位无符号整数（内部使用）
     * 使用xorshift128算法
     */
    private static next(): number {
        if (!this._initialized) {
            this.setSeed();
        }
        
        const t = this._x ^ (this._x << 11);
        this._x = this._y;
        this._y = this._z;
        this._z = this._w;
        this._w = (this._w ^ (this._w >>> 19)) ^ (t ^ (t >>> 8));
        
        return this._w >>> 0; // 确保返回无符号32位整数
    }

    /**
     * 生成0到1之间的随机浮点数（不包括1）
     * @returns 0 <= value < 1的随机数
     */
    public static value(): number {
        return this.next() / 0x100000000; // 2^32
    }

    /**
     * 生成指定范围内的随机浮点数
     * @param min 最小值（包含）
     * @param max 最大值（不包含）
     * @returns min <= value < max的随机数
     */
    public static range(min: number = 0, max: number = 1): number {
        if (min >= max) {
            throw new Error(`最小值(${min})必须小于最大值(${max})`);
        }
        return min + (max - min) * this.value();
    }

    /**
     * 生成指定范围内的随机整数
     * @param min 最小值（包含）
     * @param max 最大值（包含）
     * @returns min <= value <= max的随机整数
     */
    public static integer(min: number, max: number): number {
        if (!Number.isInteger(min) || !Number.isInteger(max)) {
            throw new Error('最小值和最大值必须是整数');
        }
        if (min > max) {
            throw new Error(`最小值(${min})必须小于等于最大值(${max})`);
        }
        return Math.floor(this.range(min, max + 1));
    }

    /**
     * 生成随机布尔值
     * @returns 随机的true或false
     */
    public static boolean(): boolean {
        return this.value() < 0.5;
    }

    /**
     * 根据概率生成布尔值
     * @param probability 返回true的概率（0-1之间）
     * @returns 根据概率返回的布尔值
     */
    public static chance(probability: number): boolean {
        if (probability < 0 || probability > 1) {
            throw new Error(`概率值必须在0-1之间，当前值: ${probability}`);
        }
        return this.value() < probability;
    }

    /**
     * 从数组中随机选择一个元素
     * @param array 要选择的数组
     * @returns 随机选中的元素
     */
    public static choice<T>(array: T[]): T {
        if (array.length === 0) {
            throw new Error('数组不能为空');
        }
        const index = this.integer(0, array.length - 1);
        return array[index]!; // 使用非空断言，因为我们已经检查了数组长度
    }

    /**
     * 从数组中随机选择多个不重复的元素
     * @param array 要选择的数组
     * @param count 选择的数量
     * @returns 随机选中的元素数组
     */
    public static sample<T>(array: T[], count: number): T[] {
        if (count < 0 || count > array.length) {
            throw new Error(`选择数量(${count})必须在0-${array.length}之间`);
        }
        
        if (count === 0) {
            return [];
        }
        
        if (count === array.length) {
            return [...array];
        }
        
        // 对于小的选择数量，使用Set避免重复
        if (count <= array.length / 2) {
            const result: T[] = [];
            const indices = new Set<number>();
            
            while (result.length < count) {
                const index = this.integer(0, array.length - 1);
                if (!indices.has(index)) {
                    indices.add(index);
                    result.push(array[index]!);
                }
            }
            
            return result;
        } else {
            // 对于大的选择数量，使用Fisher-Yates洗牌算法的部分版本
            const shuffled = [...array];
            
            for (let i = 0; i < count; i++) {
                const j = this.integer(i, shuffled.length - 1);
                [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
            }
            
            return shuffled.slice(0, count);
        }
    }

    /**
     * 生成符合正态分布的随机数（Box-Muller变换）
     * @param mean 均值
     * @param standardDeviation 标准差
     * @returns 符合正态分布的随机数
     */
    public static gaussian(mean: number = 0, standardDeviation: number = 1): number {
        // 使用Box-Muller变换生成正态分布随机数
        const u1 = this.value();
        const u2 = this.value();
        
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return z0 * standardDeviation + mean;
    }

    /**
     * 获取当前随机数生成器的状态（用于保存/恢复）
     * @returns 生成器状态对象
     */
    public static getState(): { x: number; y: number; z: number; w: number } {
        if (!this._initialized) {
            this.setSeed();
        }
        return {
            x: this._x,
            y: this._y,
            z: this._z,
            w: this._w
        };
    }

    /**
     * 恢复随机数生成器的状态
     * @param state 要恢复的状态对象
     */
    public static setState(state: { x: number; y: number; z: number; w: number }): void {
        this._x = state.x;
        this._y = state.y;
        this._z = state.z;
        this._w = state.w;
        this._initialized = true;
    }
}
