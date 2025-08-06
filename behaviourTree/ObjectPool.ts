/**
 * 通用对象池，用于减少对象创建和销毁的开销
 * 
 * @template T 池中对象的类型
 * 
 * @example
 * ```typescript
 * // 创建一个ExecuteAction的对象池
 * const actionPool = new ObjectPool(
 *   () => new ExecuteAction(() => TaskStatus.Success),
 *   (action) => action.invalidate(),
 *   50 // 最大池大小
 * );
 * 
 * // 获取对象
 * const action = actionPool.get();
 * 
 * // 使用完毕后归还
 * actionPool.release(action);
 * ```
 */
export class ObjectPool<T> {
    private _pool: T[] = [];
    private _createFn: () => T;
    private _resetFn?: (obj: T) => void;
    private _maxSize: number;

    /**
     * 创建对象池
     * @param createFn 创建新对象的函数
     * @param resetFn 重置对象状态的函数（可选）
     * @param maxSize 池的最大大小，必须大于0，默认100
     * @throws {Error} 当maxSize小于等于0时抛出错误
     */
    constructor(createFn: () => T, resetFn?: (obj: T) => void, maxSize: number = 100) {
        if (maxSize <= 0) {
            throw new Error('池的最大大小必须大于0');
        }
        if (typeof createFn !== 'function') {
            throw new Error('createFn必须是一个函数');
        }
        
        this._createFn = createFn;
        this._resetFn = resetFn;
        this._maxSize = maxSize;
    }

    /**
     * 从池中获取一个对象
     * 如果池为空，则创建新对象
     * @returns 池中的对象或新创建的对象
     */
    public get(): T {
        if (this._pool.length > 0) {
            return this._pool.pop()!;
        }
        return this._createFn();
    }

    /**
     * 将对象归还到池中
     * @param obj 要归还的对象
     */
    public release(obj: T): void {
        if (obj == null) {
            return; // 静默处理null/undefined，避免异常开销
        }
        
        if (this._pool.length < this._maxSize) {
            // 重置对象状态
            if (this._resetFn) {
                this._resetFn(obj);
            }
            
            this._pool.push(obj);
        }
        // 如果池已满，对象会被丢弃，由GC回收
    }

    /**
     * 预填充池
     * @param count 要预创建的对象数量，必须大于等于0
     * @throws {Error} 当count小于0时抛出错误
     */
    public prewarm(count: number): void {
        if (count < 0) {
            throw new Error('预填充数量不能小于0');
        }
        
        const actualCount = Math.min(count, this._maxSize - this._pool.length);
        for (let i = 0; i < actualCount; i++) {
            try {
                this._pool.push(this._createFn());
            } catch (error) {
                console.error('预填充对象时发生错误:', error);
                break; // 停止预填充
            }
        }
    }

    /**
     * 清空池
     */
    public clear(): void {
        this._pool.length = 0;
    }

    /**
     * 获取池的当前大小
     */
    public get size(): number {
        return this._pool.length;
    }

    /**
     * 获取池的最大大小
     */
    public get maxSize(): number {
        return this._maxSize;
    }

    /**
     * 设置池的最大大小
     * @param value 新的最大大小，必须大于0
     * @throws {Error} 当value小于等于0时抛出错误
     */
    public set maxSize(value: number) {
        if (value <= 0) {
            throw new Error('池的最大大小必须大于0');
        }
        
        this._maxSize = value;
        // 如果当前池大小超过新的最大值，移除多余的对象
        while (this._pool.length > this._maxSize) {
            this._pool.pop();
        }
    }

    /**
     * 获取池的使用率（0-1之间）
     * @returns 当前大小与最大大小的比率
     */
    public get utilization(): number {
        return this._pool.length / this._maxSize;
    }

    /**
     * 检查池是否为空
     */
    public get isEmpty(): boolean {
        return this._pool.length === 0;
    }

    /**
     * 检查池是否已满
     */
    public get isFull(): boolean {
        return this._pool.length >= this._maxSize;
    }
}

/**
 * 行为树节点池管理器
 * 为常用的行为树节点类型提供专门的对象池
 * 
 * @example
 * ```typescript
 * const poolManager = BehaviorNodePoolManager.getInstance();
 * 
 * // 注册节点池
 * poolManager.registerPool('ExecuteAction', 
 *   () => new ExecuteAction(() => TaskStatus.Success),
 *   (action) => action.invalidate()
 * );
 * 
 * // 获取和归还对象
 * const action = poolManager.get<ExecuteAction>('ExecuteAction');
 * poolManager.release('ExecuteAction', action);
 * ```
 */
export class BehaviorNodePoolManager {
    private static _instance: BehaviorNodePoolManager;
    private _pools: Map<string, ObjectPool<unknown>> = new Map();

    private constructor() {}

    /**
     * 获取单例实例
     */
    public static getInstance(): BehaviorNodePoolManager {
        if (!this._instance) {
            this._instance = new BehaviorNodePoolManager();
        }
        return this._instance;
    }

    /**
     * 注册一个节点类型的对象池
     * @param typeName 节点类型名称，不能为空字符串
     * @param createFn 创建函数
     * @param resetFn 重置函数
     * @param maxSize 最大池大小，默认50
     * @throws {Error} 当typeName为空或已存在时抛出错误
     */
    public registerPool<T>(
        typeName: string, 
        createFn: () => T, 
        resetFn?: (obj: T) => void, 
        maxSize: number = 50
    ): void {
        if (!typeName || typeName.trim() === '') {
            throw new Error('节点类型名称不能为空');
        }
        
        if (this._pools.has(typeName)) {
            throw new Error(`节点类型 "${typeName}" 的池已经存在`);
        }
        
        const pool = new ObjectPool(createFn, resetFn, maxSize);
        this._pools.set(typeName, pool as ObjectPool<unknown>);
    }

    /**
     * 从指定类型的池中获取对象
     * @param typeName 节点类型名称
     * @returns 池中的对象，如果池不存在则返回null
     */
    public get<T>(typeName: string): T | null {
        const pool = this._pools.get(typeName);
        return pool ? (pool.get() as T) : null;
    }

    /**
     * 将对象归还到对应的池中
     * @param typeName 节点类型名称
     * @param obj 要归还的对象
     * @returns 是否成功归还
     */
    public release<T>(typeName: string, obj: T): boolean {
        const pool = this._pools.get(typeName);
        if (pool && obj != null) {
            try {
                pool.release(obj);
                return true;
            } catch (error) {
                console.error(`归还对象到池 "${typeName}" 时发生错误:`, error);
                return false;
            }
        }
        return false;
    }

    /**
     * 预热所有池
     * @param count 每个池预创建的对象数量，默认10
     */
    public prewarmAll(count: number = 10): void {
        for (const [typeName, pool] of this._pools.entries()) {
            try {
                pool.prewarm(count);
            } catch (error) {
                console.error(`预热池 "${typeName}" 时发生错误:`, error);
            }
        }
    }

    /**
     * 清空所有池
     */
    public clearAll(): void {
        for (const pool of this._pools.values()) {
            pool.clear();
        }
    }

    /**
     * 移除指定类型的池
     * @param typeName 节点类型名称
     * @returns 是否成功移除
     */
    public removePool(typeName: string): boolean {
        const pool = this._pools.get(typeName);
        if (pool) {
            pool.clear();
            this._pools.delete(typeName);
            return true;
        }
        return false;
    }

    /**
     * 获取池的统计信息
     * @returns 包含所有池统计信息的对象
     */
    public getStats(): { [typeName: string]: { size: number; maxSize: number; utilization: number } } {
        const stats: { [typeName: string]: { size: number; maxSize: number; utilization: number } } = {};
        for (const [typeName, pool] of this._pools.entries()) {
            stats[typeName] = {
                size: pool.size,
                maxSize: pool.maxSize,
                utilization: pool.utilization
            };
        }
        return stats;
    }

    /**
     * 获取已注册的池类型列表
     */
    public getRegisteredTypes(): string[] {
        return Array.from(this._pools.keys());
    }
} 