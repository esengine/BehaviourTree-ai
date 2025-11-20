import { Behavior } from './Behavior';
import { TimeManager } from '../core/TimeManager';
import { ErrorHandler } from '../core/ErrorHandler';
import { Blackboard } from './Blackboard';

/**
 * 行为树控制器
 * 
 * @description 管理行为树的执行，支持定时更新和上下文管理
 * @template T 上下文对象类型
 * 
 * @example
 * ```typescript
 * // 创建游戏AI的行为树
 * interface GameContext {
 *   player: Player;
 *   enemies: Enemy[];
 *   gameTime: number;
 * }
 * 
 * const context: GameContext = { ... };
 * const rootNode = new Selector(...);
 * const behaviorTree = new BehaviorTree(context, rootNode, 0.1); // 每100ms更新一次
 * 
 * // 在游戏循环中调用
 * behaviorTree.tick();
 * ```
 */
export class BehaviorTree<T> {
    /**
     * 行为树更新周期（秒）
     * 
     * @description 
     * - 大于0：按照指定间隔更新（如0.2表示每秒更新5次）
     * - 小于等于0：每帧都更新
     * @default 0.2
     */
    private _updatePeriod: number;

    public get updatePeriod(): number {
        return this._updatePeriod;
    }

    public set updatePeriod(value: number) {
        if (value < 0) {
            throw new Error('更新周期不能为负数');
        }
        
        const wasFrameMode = this._updatePeriod <= 0;
        const isFrameMode = value <= 0;
        
        this._updatePeriod = value;
        
        // 当从每帧模式切换到定时模式时，初始化等待时间
        if (wasFrameMode && !isFrameMode) {
            this._elapsedTime = value; // 设置为完整周期，需要等待
        }
        // 当切换到每帧模式时，清零等待时间
        else if (!wasFrameMode && isFrameMode) {
            this._elapsedTime = 0;
        }
    }

    /** 执行上下文，包含行为树运行所需的所有数据 */
    private _context: T;
    
    /** 黑板实例，用于节点间的数据共享 */
    private _blackboard: Blackboard;
    
    /** 行为树的根节点 */
    private _root: Behavior<T>;
    
    /** 距离下次更新的剩余时间 */
    private _elapsedTime: number;
    
    /** 上次更新的时间戳（秒） */
    private _lastTime: number = 0;
    
    /** 是否启用性能优化模式 */
    private _performanceMode: boolean = false;
    
    /** 性能统计信息 */
    private _stats: {
        totalTicks: number;
        totalExecutionTime: number;
        averageExecutionTime: number;
        lastExecutionTime: number;
    } = {
        totalTicks: 0,
        totalExecutionTime: 0,
        averageExecutionTime: 0,
        lastExecutionTime: 0
    };

    /**
     * 创建行为树实例
     * 
     * @param context 执行上下文对象
     * @param rootNode 根节点
     * @param updatePeriod 更新周期，0表示每帧更新
     * @param performanceMode 是否启用性能优化模式，默认false
     * @param blackboard 可选的黑板实例，如果不提供将自动创建
     * @throws {Error} 当context或rootNode为null时抛出错误
     */
    constructor(
        context: T, 
        rootNode: Behavior<T>, 
        updatePeriod: number = 0.2, 
        performanceMode: boolean = false,
        blackboard?: Blackboard
    ) {
        if (context == null) {
            throw new Error('上下文不能为null或undefined');
        }
        if (rootNode == null) {
            throw new Error('根节点不能为null或undefined');
        }
        if (updatePeriod < 0) {
            throw new Error('更新周期不能为负数');
        }

        this._context = context;
        this._root = rootNode;
        this._updatePeriod = updatePeriod;
        // 修正的初始化逻辑：
        // - 每帧模式: _elapsedTime = 0 (总是更新)
        // - 定时模式: _elapsedTime = updatePeriod (需要累积时间)
        this._elapsedTime = updatePeriod;
        this._performanceMode = performanceMode;
        this._lastTime = this._getCurrentTime();
        this._blackboard = blackboard || new Blackboard();
        
        // 将黑板注入到上下文中
        (this._context as any).blackboard = this._blackboard;
    }

    /**
     * 获取当前时间（秒）
     * 优先使用全局时间管理器，回退到本地时间计算
     */
    private _getCurrentTime(): number {
        // 优先使用全局时间管理器
        try {
            return TimeManager.getCurrentTime();
        } catch {
            // 回退到本地时间计算
            if (this._performanceMode) {
                return Date.now() / 1000;
            } else {
                return performance.now() / 1000;
            }
        }
    }

    /**
     * 更新行为树
     * 
     * @description 
     * 根据updatePeriod设置决定是否执行根节点：
     * - updatePeriod > 0：按时间间隔更新
     * - updatePeriod <= 0：每次调用都更新
     * 
     * 通常在游戏主循环中每帧调用此方法
     * 
     * @param deltaTime 可选的时间差值（秒），如果提供则使用此值而不是计算
     */
    public tick(deltaTime?: number): void {
        const startTime = this._performanceMode ? 0 : this._getCurrentTime();

        try {
            if (this.updatePeriod > 0) {
                let actualDeltaTime: number;
                
                if (deltaTime !== undefined) {
                    // 使用提供的deltaTime，避免时间计算开销
                    actualDeltaTime = deltaTime;
                } else {
                    // 优先使用全局时间管理器的deltaTime
                    try {
                        actualDeltaTime = TimeManager.getDeltaTime();
                        if (actualDeltaTime <= 0) {
                            // 如果全局时间管理器未初始化，回退到本地计算
                            const currentTime = this._getCurrentTime();
                            actualDeltaTime = currentTime - this._lastTime;
                            this._lastTime = currentTime;
                        }
                    } catch {
                        // 回退到本地时间计算
                        const currentTime = this._getCurrentTime();
                        actualDeltaTime = currentTime - this._lastTime;
                        this._lastTime = currentTime;
                    }
                }
                
                // 验证deltaTime的有效性
                if (actualDeltaTime < 0 || !isFinite(actualDeltaTime)) {
                    ErrorHandler.warn('BehaviorTree: 无效的deltaTime值，跳过此次更新', { deltaTime: actualDeltaTime });
                    return;
                }
                
                // 防止异常大的时间跳跃
                actualDeltaTime = Math.min(actualDeltaTime, 1.0);
                
                this._elapsedTime -= actualDeltaTime;
                if (this._elapsedTime <= 0) {
                    // 处理可能的时间累积，确保稳定的更新频率
                    while (this._elapsedTime <= 0) {
                        this._elapsedTime += this.updatePeriod;
                    }

                    this._executeRoot();
                }
            } else {
                // 每帧更新模式
                this._executeRoot();
            }
        } catch (error) {
            ErrorHandler.warn('行为树更新时发生错误', { error, context: this._context });
        } finally {
            // 更新性能统计
            if (!this._performanceMode && startTime > 0) {
                const executionTime = this._getCurrentTime() - startTime;
                this._updateStats(executionTime);
            }
        }
    }

    /**
     * 执行根节点
     */
    private _executeRoot(): void {
        this._root.tick(this._context);
        this._stats.totalTicks++;
    }

    /**
     * 更新性能统计信息
     * @param executionTime 执行时间
     */
    private _updateStats(executionTime: number): void {
        this._stats.lastExecutionTime = executionTime;
        this._stats.totalExecutionTime += executionTime;
        this._stats.averageExecutionTime = this._stats.totalExecutionTime / this._stats.totalTicks;
    }

    /**
     * 获取当前上下文
     * @returns 执行上下文对象
     */
    public getContext(): T {
        return this._context;
    }

    /**
     * 获取黑板实例
     * @returns 黑板实例
     */
    public getBlackboard(): Blackboard {
        return this._blackboard;
    }

    /**
     * 更新上下文
     * @param context 新的上下文对象
     * @throws {Error} 当context为null时抛出错误
     */
    public setContext(context: T): void {
        if (context == null) {
            throw new Error('上下文不能为null或undefined');
        }
        this._context = context;
        // 确保新上下文中也包含黑板引用
        (this._context as any).blackboard = this._blackboard;
    }

    /**
     * 获取根节点
     * @returns 根节点实例
     */
    public getRoot(): Behavior<T> {
        return this._root;
    }

    /**
     * 设置新的根节点
     * @param rootNode 新的根节点
     * @throws {Error} 当rootNode为null时抛出错误
     */
    public setRoot(rootNode: Behavior<T>): void {
        if (rootNode == null) {
            throw new Error('根节点不能为null或undefined');
        }
        this._root = rootNode;
    }

    /**
     * 强制重置整个行为树
     * @description 将根节点及其所有子节点重置为Invalid状态
     */
    public reset(): void {
        try {
            this._root.invalidate();
            this._elapsedTime = this.updatePeriod;
            this._lastTime = this._getCurrentTime();
        } catch (error) {
            console.error('重置行为树时发生错误:', error);
        }
    }

    /**
     * 设置性能模式
     * @param enabled 是否启用性能模式
     */
    public setPerformanceMode(enabled: boolean): void {
        this._performanceMode = enabled;
        if (enabled) {
            console.log('行为树性能模式已启用：使用较低精度的时间计算以提高性能');
        }
    }

    /**
     * 获取性能统计信息
     * @returns 性能统计对象
     */
    public getStats(): Readonly<typeof this._stats> {
        return { ...this._stats };
    }

    /**
     * 重置性能统计信息
     */
    public resetStats(): void {
        this._stats = {
            totalTicks: 0,
            totalExecutionTime: 0,
            averageExecutionTime: 0,
            lastExecutionTime: 0
        };
    }

    /**
     * 检查行为树是否处于活动状态
     * @returns 是否有待处理的更新
     */
    public isActive(): boolean {
        if (this.updatePeriod <= 0) {
            return true; // 每帧更新模式：总是活动
        }
        // 定时更新模式：如果还没有执行过任何tick，或者准备更新时，为活动状态
        return this._elapsedTime <= 0 || this._elapsedTime === this.updatePeriod;
    }

    /**
     * 获取到下次更新的剩余时间
     * @returns 剩余时间（秒），如果是每帧更新模式则返回0
     */
    public getTimeToNextUpdate(): number {
        return this.updatePeriod > 0 ? Math.max(this._elapsedTime, 0) : 0;
    }

    /**
     * 释放行为树资源
     *
     * @description 递归释放根节点及其所有子节点，清理黑板数据
     * 调用后行为树不应再被使用
     */
    public dispose(): void {
        if (this._root) {
            this._root.dispose();
            this._root = null!;
        }
        if (this._blackboard) {
            // 清空所有变量
            const variableNames = this._blackboard.getVariableNames();
            for (const name of variableNames) {
                this._blackboard.removeVariable(name);
            }
            this._blackboard = null!;
        }
        this._context = null!;
    }
}
