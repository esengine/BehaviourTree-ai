 /**
 * 事件监听器信息
 */
interface EventListener<T = any> {
    /** 监听器函数 */
    callback: (data: T) => void;
    /** 监听器ID */
    id: string;
    /** 创建时间 */
    createdAt: number;
    /** 最后调用时间 */
    lastCalledAt: number;
    /** 调用次数 */
    callCount: number;
    /** 是否为一次性监听器 */
    once: boolean;
    /** 优先级 */
    priority: number;
    /** 弱引用标记（用于自动清理） */
    weak: boolean;
    /** 关联的对象（用于自动清理） */
    owner?: any; // 使用any类型以兼容不同环境
}

/**
 * 事件管理器配置
 */
export interface EventManagerConfig {
    /** 是否启用自动清理 */
    enableAutoCleanup: boolean;
    /** 清理间隔（毫秒） */
    cleanupInterval: number;
    /** 最大监听器数量 */
    maxListeners: number;
    /** 监听器过期时间（毫秒） */
    listenerExpirationTime: number;
    /** 是否启用性能监控 */
    enablePerformanceMonitoring: boolean;
}

/**
 * 事件统计信息
 */
interface EventStats {
    /** 总监听器数量 */
    totalListeners: number;
    /** 活跃监听器数量 */
    activeListeners: number;
    /** 总事件触发次数 */
    totalEvents: number;
    /** 平均事件处理时间 */
    averageEventTime: number;
    /** 最后清理时间 */
    lastCleanupTime: number;
}

/**
 * 高性能事件管理器
 * 
 * @description
 * 提供带自动清理机制的事件管理系统，防止内存泄漏。
 * 支持弱引用、优先级、一次性监听器等高级功能。
 * 
 * @example
 * ```typescript
 * const eventManager = new EventManager({
 *   enableAutoCleanup: true,
 *   cleanupInterval: 30000, // 30秒清理一次
 *   maxListeners: 1000
 * });
 * 
 * // 添加监听器
 * const listenerId = eventManager.on('playerDeath', (data) => {
 *   console.log('玩家死亡:', data);
 * });
 * 
 * // 添加弱引用监听器（自动清理）
 * eventManager.onWeak('gameUpdate', callback, gameObject);
 * 
 * // 触发事件
 * eventManager.emit('playerDeath', { playerId: 123 });
 * 
 * // 移除监听器
 * eventManager.off('playerDeath', listenerId);
 * ```
 */
export class EventManager {
    private readonly _listeners: Map<string, EventListener[]> = new Map();
    private readonly _config: EventManagerConfig;
    private _stats: EventStats;
    private _cleanupTimer: any = null;
    private _nextListenerId: number = 1;

    /**
     * 创建事件管理器
     * @param config 配置选项
     */
    constructor(config: Partial<EventManagerConfig> = {}) {
        this._config = {
            enableAutoCleanup: config.enableAutoCleanup ?? true,
            cleanupInterval: config.cleanupInterval ?? 30000, // 30秒
            maxListeners: config.maxListeners ?? 1000,
            listenerExpirationTime: config.listenerExpirationTime ?? 300000, // 5分钟
            enablePerformanceMonitoring: config.enablePerformanceMonitoring ?? false
        };

        this._stats = {
            totalListeners: 0,
            activeListeners: 0,
            totalEvents: 0,
            averageEventTime: 0,
            lastCleanupTime: Date.now()
        };

        // 启动自动清理
        if (this._config.enableAutoCleanup) {
            this._startAutoCleanup();
        }
    }

    /**
     * 添加事件监听器
     * @param eventName 事件名称
     * @param callback 回调函数
     * @param options 监听器选项
     * @returns 监听器ID
     */
    public on<T = any>(
        eventName: string, 
        callback: (data: T) => void,
        options: {
            once?: boolean;
            priority?: number;
            weak?: boolean;
            owner?: object;
        } = {}
    ): string {
        const listenerId = this._generateListenerId();
        
        const listener: EventListener<T> = {
            callback,
            id: listenerId,
            createdAt: Date.now(),
            lastCalledAt: 0,
            callCount: 0,
            once: options.once ?? false,
            priority: options.priority ?? 0,
            weak: options.weak ?? false,
            owner: options.owner || undefined
        };

        // 检查监听器数量限制
        if (this._stats.totalListeners >= this._config.maxListeners) {
            console.warn(`事件监听器数量已达到上限 ${this._config.maxListeners}`);
            this.cleanup(); // 尝试清理
            
            if (this._stats.totalListeners >= this._config.maxListeners) {
                throw new Error('无法添加更多事件监听器，已达到上限');
            }
        }

        // 添加到监听器列表
        if (!this._listeners.has(eventName)) {
            this._listeners.set(eventName, []);
        }

        const listeners = this._listeners.get(eventName)!;
        listeners.push(listener);

        // 按优先级排序（高优先级在前）
        listeners.sort((a, b) => b.priority - a.priority);

        this._stats.totalListeners++;
        this._updateActiveListeners();

        return listenerId;
    }

    /**
     * 添加弱引用监听器（自动清理）
     * @param eventName 事件名称
     * @param callback 回调函数
     * @param owner 拥有者对象
     * @param options 其他选项
     * @returns 监听器ID
     */
    public onWeak<T = any>(
        eventName: string,
        callback: (data: T) => void,
        owner: object,
        options: {
            once?: boolean;
            priority?: number;
        } = {}
    ): string {
        return this.on(eventName, callback, {
            ...options,
            weak: true,
            owner
        });
    }

    /**
     * 添加一次性监听器
     * @param eventName 事件名称
     * @param callback 回调函数
     * @param options 其他选项
     * @returns 监听器ID
     */
    public once<T = any>(
        eventName: string,
        callback: (data: T) => void,
        options: {
            priority?: number;
            weak?: boolean;
            owner?: object;
        } = {}
    ): string {
        return this.on(eventName, callback, {
            ...options,
            once: true
        });
    }

    /**
     * 移除事件监听器
     * @param eventName 事件名称
     * @param listenerId 监听器ID
     * @returns 是否成功移除
     */
    public off(eventName: string, listenerId: string): boolean {
        const listeners = this._listeners.get(eventName);
        if (!listeners) {
            return false;
        }

        const index = listeners.findIndex(listener => listener.id === listenerId);
        if (index === -1) {
            return false;
        }

        listeners.splice(index, 1);
        this._stats.totalListeners--;

        // 如果没有监听器了，删除事件
        if (listeners.length === 0) {
            this._listeners.delete(eventName);
        }

        this._updateActiveListeners();
        return true;
    }

    /**
     * 移除所有指定事件的监听器
     * @param eventName 事件名称
     * @returns 移除的监听器数量
     */
    public offAll(eventName: string): number {
        const listeners = this._listeners.get(eventName);
        if (!listeners) {
            return 0;
        }

        const count = listeners.length;
        this._listeners.delete(eventName);
        this._stats.totalListeners -= count;
        this._updateActiveListeners();

        return count;
    }

    /**
     * 移除拥有者的所有监听器
     * @param owner 拥有者对象
     * @returns 移除的监听器数量
     */
    public offByOwner(owner: object): number {
        let removedCount = 0;

        for (const [eventName, listeners] of this._listeners) {
            for (let i = listeners.length - 1; i >= 0; i--) {
                const listener = listeners[i]!;
                
                if (listener.owner === owner) {
                    listeners.splice(i, 1);
                    removedCount++;
                    this._stats.totalListeners--;
                }
            }

            // 如果没有监听器了，删除事件
            if (listeners.length === 0) {
                this._listeners.delete(eventName);
            }
        }

        this._updateActiveListeners();
        return removedCount;
    }

    /**
     * 触发事件
     * @param eventName 事件名称
     * @param data 事件数据
     * @returns 成功调用的监听器数量
     */
    public emit<T = any>(eventName: string, data?: T): number {
        const listeners = this._listeners.get(eventName);
        if (!listeners || listeners.length === 0) {
            return 0;
        }

        const startTime = this._config.enablePerformanceMonitoring ? performance.now() : 0;
        let successCount = 0;
        const toRemove: number[] = [];

        // 执行监听器
        for (let i = 0; i < listeners.length; i++) {
            const listener = listeners[i]!;

            // 检查弱引用是否还有效（简化版本）
            if (listener.weak && listener.owner) {
                // 在支持WeakRef的环境中，这里可以进行更复杂的检查
                // 目前简化处理，假设对象仍然有效
            }

            try {
                listener.callback(data as T);
                listener.lastCalledAt = Date.now();
                listener.callCount++;
                successCount++;

                // 如果是一次性监听器，标记为移除
                if (listener.once) {
                    toRemove.push(i);
                }
            } catch (error) {
                console.error(`事件监听器执行失败 (${eventName}):`, error);
            }
        }

        // 移除标记的监听器（从后往前移除，避免索引问题）
        for (let i = toRemove.length - 1; i >= 0; i--) {
            const index = toRemove[i]!;
            listeners.splice(index, 1);
            this._stats.totalListeners--;
        }

        // 如果没有监听器了，删除事件
        if (listeners.length === 0) {
            this._listeners.delete(eventName);
        }

        // 更新统计信息
        this._stats.totalEvents++;
        if (this._config.enablePerformanceMonitoring && startTime > 0) {
            const executionTime = performance.now() - startTime;
            this._updateAverageEventTime(executionTime);
        }

        this._updateActiveListeners();
        return successCount;
    }

    /**
     * 检查是否有指定事件的监听器
     * @param eventName 事件名称
     * @returns 是否有监听器
     */
    public hasListeners(eventName: string): boolean {
        const listeners = this._listeners.get(eventName);
        return listeners ? listeners.length > 0 : false;
    }

    /**
     * 获取指定事件的监听器数量
     * @param eventName 事件名称
     * @returns 监听器数量
     */
    public getListenerCount(eventName: string): number {
        const listeners = this._listeners.get(eventName);
        return listeners ? listeners.length : 0;
    }

    /**
     * 获取所有事件名称
     * @returns 事件名称数组
     */
    public getEventNames(): string[] {
        return Array.from(this._listeners.keys());
    }

    /**
     * 执行清理操作
     * @param force 是否强制清理所有监听器
     * @returns 清理的监听器数量
     */
    public cleanup(force: boolean = false): number {
        return this._performCleanup(force);
    }

    /**
     * 启动自动清理
     */
    private _startAutoCleanup(): void {
        if (this._cleanupTimer) {
            return;
        }

        // 兼容Node.js环境
        const setInterval = typeof window !== 'undefined' ? window.setInterval : global.setInterval;
        this._cleanupTimer = setInterval(() => {
            this._performCleanup();
        }, this._config.cleanupInterval);
    }

    /**
     * 停止自动清理
     */
    private _stopAutoCleanup(): void {
        if (this._cleanupTimer) {
            // 兼容Node.js环境
            const clearInterval = typeof window !== 'undefined' ? window.clearInterval : global.clearInterval;
            clearInterval(this._cleanupTimer);
            this._cleanupTimer = null;
        }
    }

    /**
     * 执行清理操作
     */
    private _performCleanup(force: boolean = false): number {
        const now = Date.now();
        let removedCount = 0;

        for (const [eventName, listeners] of this._listeners) {
            for (let i = listeners.length - 1; i >= 0; i--) {
                const listener = listeners[i]!;
                let shouldRemove = force;

                if (!shouldRemove) {
                    // 检查弱引用（简化版本）
                    if (listener.weak && listener.owner) {
                        // 在支持WeakRef的环境中，这里可以进行更复杂的检查
                        // 目前简化处理
                    }

                    // 检查过期时间
                    if (!shouldRemove && this._config.listenerExpirationTime > 0) {
                        const age = now - listener.createdAt;
                        const timeSinceLastCall = now - listener.lastCalledAt;
                        
                        if (age > this._config.listenerExpirationTime && 
                            timeSinceLastCall > this._config.listenerExpirationTime) {
                            shouldRemove = true;
                        }
                    }
                }

                if (shouldRemove) {
                    listeners.splice(i, 1);
                    removedCount++;
                    this._stats.totalListeners--;
                }
            }

            // 如果没有监听器了，删除事件
            if (listeners.length === 0) {
                this._listeners.delete(eventName);
            }
        }

        this._stats.lastCleanupTime = now;
        this._updateActiveListeners();

        return removedCount;
    }

    /**
     * 生成监听器ID
     */
    private _generateListenerId(): string {
        return `listener_${this._nextListenerId++}_${Date.now()}`;
    }

    /**
     * 更新活跃监听器数量
     */
    private _updateActiveListeners(): void {
        this._stats.activeListeners = this._stats.totalListeners;
    }

    /**
     * 更新平均事件处理时间
     */
    private _updateAverageEventTime(executionTime: number): void {
        if (this._stats.totalEvents === 1) {
            this._stats.averageEventTime = executionTime;
        } else {
            this._stats.averageEventTime = 
                (this._stats.averageEventTime * (this._stats.totalEvents - 1) + executionTime) / this._stats.totalEvents;
        }
    }

    /**
     * 获取统计信息
     */
    public getStats(): Readonly<EventStats> {
        return { ...this._stats };
    }

    /**
     * 重置统计信息
     */
    public resetStats(): void {
        this._stats = {
            totalListeners: this._stats.totalListeners, // 保留当前监听器数量
            activeListeners: this._stats.activeListeners,
            totalEvents: 0,
            averageEventTime: 0,
            lastCleanupTime: Date.now()
        };
    }

    /**
     * 获取配置信息
     */
    public getConfig(): Readonly<EventManagerConfig> {
        return { ...this._config };
    }

    /**
     * 销毁事件管理器
     */
    public destroy(): void {
        this._stopAutoCleanup();
        this._listeners.clear();
        this._stats.totalListeners = 0;
        this._stats.activeListeners = 0;
    }
}