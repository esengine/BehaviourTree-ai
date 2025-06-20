import { TaskStatus } from './TaskStatus';

/**
 * 行为树节点的抽象基类
 * 
 * @description 所有行为树节点的基类，定义了节点的生命周期和基本行为
 * @template T 上下文对象类型，通常包含游戏状态、AI数据等
 * 
 * @example
 * ```typescript
 * class CustomAction<GameContext> extends Behavior<GameContext> {
 *   update(context: GameContext): TaskStatus {
 *     // 执行自定义逻辑
 *     return TaskStatus.Success;
 *   }
 * }
 * ```
 */
export abstract class Behavior<T> {
    /** 
     * 当前节点的执行状态
     * @default TaskStatus.Invalid
     */
    public status: TaskStatus = TaskStatus.Invalid;

    /**
     * 抽象方法：节点的核心执行逻辑
     * 
     * @description 子类必须实现此方法来定义节点的具体行为
     * @param context 上下文对象，包含执行所需的数据
     * @returns 执行后的状态（Success、Failure或Running）
     */
    public abstract update(context: T): TaskStatus;

    /**
     * 重置节点状态为无效
     * 
     * @description 使该节点的状态无效，复合节点可以重写此方法来同时重置子节点
     */
    public invalidate(): void {
        this.status = TaskStatus.Invalid;
    }

    /**
     * 节点开始执行时的回调
     * 
     * @description 在节点首次执行或状态从Invalid变为其他状态时调用
     * 用于初始化变量、重置状态等准备工作
     */
    public onStart(): void {}

    /**
     * 节点执行结束时的回调
     * 
     * @description 当节点状态变为Success或Failure时调用
     * 用于清理资源、记录结果等收尾工作
     */
    public onEnd(): void {}

    /**
     * 节点执行的主要入口点
     * 
     * @description 处理节点的完整执行流程，包括生命周期管理
     * 1. 如果状态为Invalid，调用onStart()
     * 2. 调用update()执行核心逻辑
     * 3. 如果状态不为Running，调用onEnd()
     * 
     * @param context 执行上下文
     * @returns 执行后的状态
     */
    public tick(context: T): TaskStatus {
        if (this.status == TaskStatus.Invalid)
            this.onStart();

        this.status = this.update(context);

        if (this.status != TaskStatus.Running)
            this.onEnd();

        return this.status;
    }
}
