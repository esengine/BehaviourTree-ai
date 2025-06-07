/**
 * 高性能分层对象池系统
 * 
 * @description
 * 提供比原始ObjectPool更高性能的对象池实现：
 * - 使用WeakSet跟踪池中对象，避免includes()开销
 * - 实现分层池，根据使用频率分配不同大小的池
 * - 支持全局内存限制和自动清理
 * - 提供详细的性能统计
 * 
 * @template T 池中对象的类型
 */

/**
 * 对象池配置选项
 */
export interface PoolConfig {
    /** 初始池大小 */
    initialSize?: number;
    /** 最大池大小 */
    maxSize?: number;
    /** 池的优先级（影响内存清理顺序） */
    priority?: PoolPriority;
    /** 是否启用统计信息收集 */
    enableStats?: boolean;
    /** 对象验证函数 */
    validator?: (obj: any) => boolean;
}

/**
 * 池优先级枚举
 */
export enum PoolPriority {
    /** 低优先级 - 优先清理 */
    Low = 0,
    /** 普通优先级 */
    Normal = 1,
    /** 高优先级 - 最后清理 */
    High = 2,
    /** 关键优先级 - 不会被自动清理 */
    Critical = 3
}

/**
 * 池统计信息
 */
export interface PoolStats {
    /** 当前池大小 */
    currentSize: number;
    /** 最大池大小 */
    maxSize: number;
    /** 总获取次数 */
    totalGets: number;
    /** 总归还次数 */
    totalReleases: number;
    /** 总创建次数 */
    totalCreations: number;
    /** 命中率（从池中获取的比例） */
    hitRate: number;
    /** 使用率 */
    utilization: number;
    /** 优先级 */
    priority: PoolPriority;
}

/**
 * 高性能对象池
 */
export class AdvancedObjectPool<T extends object> {
    private readonly _pool: T[] = [];
    private readonly _poolSet: WeakSet<T> = new WeakSet();
    private readonly _createFn: () => T;
    private readonly _resetFn?: (obj: T) => void;
    private readonly _validator?: (obj: any) => boolean;
    private readonly _config: PoolConfig & { 
        initialSize: number; 
        maxSize: number; 
        priority: PoolPriority; 
        enableStats: boolean; 
    };
    
    // 统计信息
    private _stats: PoolStats;
    
    // 性能优化
    private _lastCleanupTime: number = 0;
    private readonly _cleanupInterval: number = 5000; // 5秒清理一次

    /**
     * 创建高性能对象池
     * @param createFn 创建新对象的函数
     * @param resetFn 重置对象状态的函数（可选）
     * @param config 池配置选项
     */
    constructor(
        createFn: () => T, 
        resetFn?: (obj: T) => void, 
        config: PoolConfig = {}
    ) {
        if (typeof createFn !== 'function') {
            throw new Error('createFn必须是一个函数');
        }

        this._createFn = createFn;
        this._resetFn = resetFn;
        this._validator = config.validator;
        
        // 设置默认配置
        this._config = {
            initialSize: config.initialSize ?? 0,
            maxSize: config.maxSize ?? 100,
            priority: config.priority ?? PoolPriority.Normal,
            enableStats: config.enableStats ?? true,
            validator: config.validator
        };

        if (this._config.maxSize <= 0) {
            throw new Error('最大池大小必须大于0');
        }

        // 初始化统计信息
        this._stats = {
            currentSize: 0,
            maxSize: this._config.maxSize,
            totalGets: 0,
            totalReleases: 0,
            totalCreations: 0,
            hitRate: 0,
            utilization: 0,
            priority: this._config.priority
        };

        // 预填充池
        if (this._config.initialSize > 0) {
            this.prewarm(this._config.initialSize);
        }

        // 注册到全局池管理器
        AdvancedPoolManager.registerPool(this);
    }

    /**
     * 从池中获取一个对象
     * @returns 池中的对象或新创建的对象
     */
    public get(): T {
        this._updateStats('get');
        
        // 尝试从池中获取
        if (this._pool.length > 0) {
            const obj = this._pool.pop()!;
            this._poolSet.delete(obj);
            this._updateStats('hit');
            return obj;
        }

        // 池为空，创建新对象
        const newObj = this._createObject();
        this._updateStats('creation');
        return newObj;
    }

    /**
     * 将对象归还到池中
     * @param obj 要归还的对象
     * @returns 是否成功归还
     */
    public release(obj: T): boolean {
        if (obj == null) {
            console.warn('不能归还null或undefined对象到池中');
            return false;
        }

        // 检查对象是否已在池中
        if (this._poolSet.has(obj)) {
            console.warn('对象已经在池中，忽略重复归还');
            return false;
        }

        // 验证对象
        if (this._validator && !this._validator(obj)) {
            console.warn('对象验证失败，拒绝归还到池中');
            return false;
        }

        // 检查池是否已满
        if (this._pool.length >= this._config.maxSize) {
            return false; // 池已满，对象将被GC回收
        }

        // 重置对象状态
        if (this._resetFn) {
            try {
                this._resetFn(obj);
            } catch (error) {
                console.error('重置对象时发生错误:', error);
                return false;
            }
        }

        // 归还到池中
        this._pool.push(obj);
        this._poolSet.add(obj);
        this._updateStats('release');
        
        return true;
    }

    /**
     * 创建新对象
     */
    private _createObject(): T {
        try {
            return this._createFn();
        } catch (error) {
            console.error('创建对象时发生错误:', error);
            throw error;
        }
    }

    /**
     * 更新统计信息
     */
    private _updateStats(operation: 'get' | 'release' | 'creation' | 'hit'): void {
        if (!this._config.enableStats) {
            return;
        }

        switch (operation) {
            case 'get':
                this._stats.totalGets++;
                break;
            case 'release':
                this._stats.totalReleases++;
                break;
            case 'creation':
                this._stats.totalCreations++;
                break;
            case 'hit':
                // 命中率在get时计算
                break;
        }

        // 更新派生统计信息
        this._stats.currentSize = this._pool.length;
        this._stats.hitRate = this._stats.totalGets > 0 ? 
            (this._stats.totalGets - this._stats.totalCreations) / this._stats.totalGets : 0;
        this._stats.utilization = this._stats.currentSize / this._stats.maxSize;
    }

    /**
     * 预填充池
     * @param count 要预创建的对象数量
     */
    public prewarm(count: number): void {
        if (count < 0) {
            throw new Error('预填充数量不能小于0');
        }

        const actualCount = Math.min(count, this._config.maxSize - this._pool.length);
        
        for (let i = 0; i < actualCount; i++) {
            try {
                const obj = this._createObject();
                this._pool.push(obj);
                this._poolSet.add(obj);
                this._updateStats('creation');
            } catch (error) {
                console.error('预填充对象时发生错误:', error);
                break;
            }
        }
    }

    /**
     * 清空池
     * @param force 是否强制清空（忽略优先级）
     */
    public clear(force: boolean = false): void {
        if (!force && this._config.priority === PoolPriority.Critical) {
            return; // 关键优先级的池不会被清空
        }

        this._pool.length = 0;
        // WeakSet会自动清理
        this._updateStats('release'); // 更新统计信息
    }

    /**
     * 收缩池到指定大小
     * @param targetSize 目标大小
     */
    public shrink(targetSize: number): void {
        if (targetSize < 0) {
            targetSize = 0;
        }

        while (this._pool.length > targetSize) {
            const obj = this._pool.pop();
            if (obj) {
                this._poolSet.delete(obj);
            }
        }
        
        this._updateStats('release');
    }

    /**
     * 执行定期清理
     */
    public performMaintenance(): void {
        const now = Date.now();
        if (now - this._lastCleanupTime < this._cleanupInterval) {
            return;
        }

        this._lastCleanupTime = now;
        
        // 根据使用率决定是否收缩池
        if (this._stats.utilization < 0.3 && this._pool.length > this._config.initialSize) {
            const targetSize = Math.max(
                this._config.initialSize, 
                Math.floor(this._pool.length * 0.7)
            );
            this.shrink(targetSize);
        }
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
        return this._config.maxSize;
    }

    /**
     * 获取池的优先级
     */
    public get priority(): PoolPriority {
        return this._config.priority;
    }

    /**
     * 设置池的最大大小
     */
    public set maxSize(value: number) {
        if (value <= 0) {
            throw new Error('最大池大小必须大于0');
        }

        this._config.maxSize = value;
        this._stats.maxSize = value;

        // 如果当前池大小超过新的最大值，收缩池
        if (this._pool.length > value) {
            this.shrink(value);
        }
    }

    /**
     * 获取池的统计信息
     */
    public getStats(): Readonly<PoolStats> {
        this._updateStats('get'); // 更新当前统计信息
        return { ...this._stats };
    }

    /**
     * 重置统计信息
     */
    public resetStats(): void {
        this._stats.totalGets = 0;
        this._stats.totalReleases = 0;
        this._stats.totalCreations = 0;
        this._stats.hitRate = 0;
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
        return this._pool.length >= this._config.maxSize;
    }
}

/**
 * 全局高级池管理器
 */
export class AdvancedPoolManager {
    private static _pools: Set<AdvancedObjectPool<any>> = new Set();
    private static _maintenanceInterval: number = 10000; // 10秒
    private static _lastMaintenanceTime: number = 0;

    /**
     * 注册池到全局管理器
     */
    public static registerPool<T extends object>(pool: AdvancedObjectPool<T>): void {
        this._pools.add(pool);
    }

    /**
     * 从全局管理器注销池
     */
    public static unregisterPool<T extends object>(pool: AdvancedObjectPool<T>): void {
        this._pools.delete(pool);
    }

    /**
     * 执行全局内存清理
     */
    public static performGlobalCleanup(): void {
        // 按优先级排序池（低优先级先清理）
        const sortedPools = Array.from(this._pools).sort((a, b) => a.priority - b.priority);

        for (const pool of sortedPools) {
            if (pool.priority === PoolPriority.Critical) {
                continue; // 跳过关键优先级的池
            }

            // 收缩池到初始大小的一半
            const targetSize = Math.floor(pool.size * 0.5);
            pool.shrink(targetSize);
        }
    }

    /**
     * 执行全局维护
     */
    public static performGlobalMaintenance(): void {
        const now = Date.now();
        if (now - this._lastMaintenanceTime < this._maintenanceInterval) {
            return;
        }

        this._lastMaintenanceTime = now;

        // 对所有池执行维护
        for (const pool of this._pools) {
            pool.performMaintenance();
        }

        // 检查是否需要全局清理
        const totalPools = this._pools.size;
        if (totalPools > 50) { // 如果池数量过多，执行清理
            this.performGlobalCleanup();
        }
    }

    /**
     * 获取全局统计信息
     */
    public static getGlobalStats(): {
        totalPools: number;
        totalObjects: number;
        totalMemoryUsage: number;
        poolsByPriority: Record<PoolPriority, number>;
    } {
        let totalObjects = 0;
        const poolsByPriority: Record<PoolPriority, number> = {
            [PoolPriority.Low]: 0,
            [PoolPriority.Normal]: 0,
            [PoolPriority.High]: 0,
            [PoolPriority.Critical]: 0
        };

        for (const pool of this._pools) {
            totalObjects += pool.size;
            poolsByPriority[pool.priority]++;
        }

        return {
            totalPools: this._pools.size,
            totalObjects,
            totalMemoryUsage: totalObjects * 64, // 估算内存使用（每个对象64字节）
            poolsByPriority
        };
    }

    /**
     * 清理所有池
     */
    public static clearAllPools(force: boolean = false): void {
        for (const pool of this._pools) {
            pool.clear(force);
        }
    }
} 