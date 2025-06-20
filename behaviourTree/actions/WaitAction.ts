import { Behavior } from '../Behavior';
import { TaskStatus } from '../TaskStatus';

/**
 * 时间上下文接口
 * 定义包含时间信息的上下文对象结构
 */
export interface ITimeContext {
    /** 帧间时间差（秒） */
    deltaTime: number;
}

/**
 * 类型守卫：检查对象是否包含时间信息
 * @param obj 要检查的对象
 * @returns 是否为时间上下文对象
 */
function hasTimeContext(obj: unknown): obj is ITimeContext {
    return obj != null && 
           typeof obj === 'object' && 
           'deltaTime' in obj && 
           typeof (obj as ITimeContext).deltaTime === 'number';
}

/**
 * 等待指定时间的行为节点
 * 
 * @description 
 * 在指定时间内返回Running状态，时间到达后返回Success状态。
 * 支持外部时间管理以提高性能。
 * 
 * @template T 上下文类型
 * 
 * @example
 * ```typescript
 * // 基本用法
 * const waitAction = new WaitAction<any>(2.0); // 等待2秒
 * 
 * // 使用外部时间管理
 * interface GameContext extends ITimeContext {
 *   player: Player;
 *   deltaTime: number;
 * }
 * const waitAction = new WaitAction<GameContext>(1.5, true);
 * ```
 */
export class WaitAction<T> extends Behavior<T> {
    /** 等待的时间（秒） */
    public waitTime: number;
    
    /** 已等待的时间（秒） */
    private _elapsedTime: number = 0;
    
    /** 是否使用外部时间管理 */
    private _useExternalTime: boolean = false;
    
    /** 上次更新的时间戳（用于内部时间计算） */
    private _lastUpdateTime: number = 0;

    /**
     * 创建等待动作
     * @param waitTime 等待时间（秒），必须大于0
     * @param useExternalTime 是否使用外部时间管理，默认false
     * @throws {Error} 当waitTime小于等于0时抛出错误
     */
    constructor(waitTime: number, useExternalTime: boolean = false) {
        super();
        
        if (waitTime <= 0) {
            throw new Error('等待时间必须大于0');
        }
        
        this.waitTime = waitTime;
        this._useExternalTime = useExternalTime;
    }

    public override onStart(): void {
        this._elapsedTime = 0;
        this._lastUpdateTime = performance.now() / 1000;
    }

    /**
     * 更新等待状态
     * @param context 上下文对象，如果包含deltaTime属性则使用外部时间
     * @returns 当前执行状态
     */
    public update(context: T): TaskStatus {
        let deltaTime: number;
        
        if (this._useExternalTime && hasTimeContext(context)) {
            // 使用外部提供的deltaTime
            deltaTime = context.deltaTime;
            
            // 验证deltaTime的有效性
            if (deltaTime < 0 || !isFinite(deltaTime)) {
                console.warn('WaitAction: 无效的deltaTime值，回退到内部时间计算');
                deltaTime = this._calculateInternalDeltaTime();
            }
        } else {
            // 使用内部时间计算
            deltaTime = this._calculateInternalDeltaTime();
        }
        
        this._elapsedTime += deltaTime;
        
        if (this._elapsedTime >= this.waitTime) {
            return TaskStatus.Success;
        }

        return TaskStatus.Running;
    }

    /**
     * 计算内部时间差
     * @returns 时间差（秒）
     */
    private _calculateInternalDeltaTime(): number {
        const currentTime = performance.now() / 1000;
        const deltaTime = currentTime - this._lastUpdateTime;
        this._lastUpdateTime = currentTime;
        
        // 防止异常大的时间跳跃（比如页面失焦后恢复）
        return Math.min(deltaTime, 0.1); // 最大100ms
    }

    /**
     * 获取等待进度（0-1）
     * @returns 当前进度百分比
     */
    public getProgress(): number {
        return Math.min(this._elapsedTime / this.waitTime, 1.0);
    }

    /**
     * 获取剩余等待时间
     * @returns 剩余时间（秒）
     */
    public getRemainingTime(): number {
        return Math.max(this.waitTime - this._elapsedTime, 0);
    }

    /**
     * 设置新的等待时间
     * @param newWaitTime 新的等待时间（秒）
     * @param resetProgress 是否重置当前进度，默认false
     * @throws {Error} 当newWaitTime小于等于0时抛出错误
     */
    public setWaitTime(newWaitTime: number, resetProgress: boolean = false): void {
        if (newWaitTime <= 0) {
            throw new Error('等待时间必须大于0');
        }
        
        this.waitTime = newWaitTime;
        
        if (resetProgress) {
            this._elapsedTime = 0;
            this._lastUpdateTime = performance.now() / 1000;
        }
    }

    /**
     * 检查是否已完成等待
     * @returns 是否已完成
     */
    public isCompleted(): boolean {
        return this._elapsedTime >= this.waitTime;
    }
}
