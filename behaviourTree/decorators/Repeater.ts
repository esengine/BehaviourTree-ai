import { Decorator } from './Decorator';
import { TaskStatus } from '../TaskStatus';

/**
 * 重复执行装饰器
 * 
 * @description
 * 重复执行其子节点，直到达到指定次数或条件满足。
 * 支持无限重复、失败时停止等多种模式。
 * 
 * @template T 上下文类型
 * 
 * @example
 * ```typescript
 * // 重复3次
 * const repeater = new Repeater<GameContext>(3);
 * repeater.child = new AttackAction();
 * 
 * // 无限重复，失败时停止
 * const infiniteRepeater = new Repeater<GameContext>(-1, true);
 * 
 * // 重复直到成功
 * const untilSuccess = Repeater.createUntilSuccess<GameContext>();
 * ```
 */
export class Repeater<T> extends Decorator<T> {
    /** 重复执行其子任务的次数（-1表示无限重复） */
    public count: number;
    
    /** 如果子任务返回失败，该任务是否应该停止重复 */
    public endOnFailure: boolean;
    
    /** 如果子任务返回成功，该任务是否应该停止重复 */
    public endOnSuccess: boolean;

    /** 当前已执行的迭代次数 */
    private _iterationCount: number = 0;
    
    /** 最后一次子节点的执行结果 */
    private _lastChildStatus: TaskStatus = TaskStatus.Invalid;

    /**
     * 创建重复装饰器
     * @param count 重复次数，-1表示无限重复，必须是整数
     * @param endOnFailure 子节点失败时是否停止，默认false
     * @param endOnSuccess 子节点成功时是否停止，默认false
     * @throws {Error} 当count不是有效整数时抛出错误
     */
    public constructor(count: number, endOnFailure: boolean = false, endOnSuccess: boolean = false) {
        super();

        if (!Number.isInteger(count) || count < -1 || count === 0) {
            throw new Error('重复次数必须是正整数或-1（无限重复）');
        }

        this.count = count;
        this.endOnFailure = endOnFailure;
        this.endOnSuccess = endOnSuccess;
    }

    /**
     * 是否永远重复
     */
    public get repeatForever(): boolean {
        return this.count === -1;
    }

    /**
     * 设置是否永远重复
     */
    public set repeatForever(value: boolean) {
        this.count = value ? -1 : Math.max(1, this.count);
    }

    public override onStart(): void {
        this._iterationCount = 0;
        this._lastChildStatus = TaskStatus.Invalid;
    }

    public update(context: T): TaskStatus {
        if (!this.child) {
            throw new Error('子节点不能为空');
        }

        // 检查是否已经达到重复次数（非无限重复的情况）
        if (!this.repeatForever && this._iterationCount >= this.count) {
            return TaskStatus.Success;
        }

        // 执行子节点
        const status = this.child.tick(context);
        this._lastChildStatus = status;
        
        // 如果子节点仍在运行，继续等待
        if (status === TaskStatus.Running) {
            return TaskStatus.Running;
        }

        // 子节点完成了一次执行
        this._iterationCount++;

        // 检查停止条件
        if (this.endOnFailure && status === TaskStatus.Failure) {
            return TaskStatus.Success;
        }

        if (this.endOnSuccess && status === TaskStatus.Success) {
            return TaskStatus.Success;
        }

        // 检查是否已经达到重复次数
        if (!this.repeatForever && this._iterationCount >= this.count) {
            return TaskStatus.Success;
        }

        // 重置子节点状态以便下次执行
        this.child.invalidate();
        
        return TaskStatus.Running;
    }

    /**
     * 获取当前执行次数
     * @returns 已执行的次数
     */
    public getIterationCount(): number {
        return this._iterationCount;
    }

    /**
     * 获取剩余执行次数
     * @returns 剩余次数，无限重复时返回-1
     */
    public getRemainingCount(): number {
        if (this.repeatForever) {
            return -1;
        }
        return Math.max(0, this.count - this._iterationCount);
    }

    /**
     * 获取执行进度（0-1）
     * @returns 进度百分比，无限重复时返回-1
     */
    public getProgress(): number {
        if (this.repeatForever) {
            return -1;
        }
        return Math.min(this._iterationCount / this.count, 1.0);
    }

    /**
     * 获取最后一次子节点的执行结果
     * @returns 最后的执行状态
     */
    public getLastChildStatus(): TaskStatus {
        return this._lastChildStatus;
    }

    /**
     * 重置重复器状态
     */
    public reset(): void {
        this._iterationCount = 0;
        this._lastChildStatus = TaskStatus.Invalid;
        if (this.child) {
            this.child.invalidate();
        }
    }

    /**
     * 创建一个重复直到成功的装饰器
     * @param maxAttempts 最大尝试次数，-1表示无限
     * @returns 新的Repeater实例
     */
    public static createUntilSuccess<T>(maxAttempts: number = -1): Repeater<T> {
        return new Repeater<T>(maxAttempts, false, true);
    }

    /**
     * 创建一个重复直到失败的装饰器
     * @param maxAttempts 最大尝试次数，-1表示无限
     * @returns 新的Repeater实例
     */
    public static createUntilFailure<T>(maxAttempts: number = -1): Repeater<T> {
        return new Repeater<T>(maxAttempts, true, false);
    }

    /**
     * 创建一个无限重复的装饰器
     * @returns 新的Repeater实例
     */
    public static createInfinite<T>(): Repeater<T> {
        return new Repeater<T>(-1, false, false);
    }
}
