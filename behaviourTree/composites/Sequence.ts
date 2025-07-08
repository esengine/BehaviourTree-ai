import { Composite } from './Composite';
import { TaskStatus } from '../TaskStatus';
import { AbortTypes, AbortTypesExt } from './AbortTypes';

/**
 * 序列组合器
 * 
 * @description
 * 类似于逻辑"与"操作，按顺序执行子节点直到所有节点成功：
 * - 任何子节点失败时返回失败
 * - 所有子节点成功时返回成功
 * - 子节点运行中时返回运行中
 * 
 * @template T 上下文类型
 */
export class Sequence<T> extends Composite<T> {
    /** 缓存的子节点数量，避免重复访问length属性*/
    private _childCount: number = 0;

    public constructor(abortType: AbortTypes = AbortTypes.None) {
        super();
        this.abortType = abortType;
    }

    public override onStart(): void {
        super.onStart();
        this._childCount = this._children.length;
        // 确保每次开始时都从第一个子节点开始
        this._currentChildIndex = 0;
    }

    public update(context: T): TaskStatus {
        // 检查是否有子节点
        if (this._childCount === 0) {
            return TaskStatus.Success;
        }

        // 处理条件性中止
        if (this._currentChildIndex !== 0) {
            this.handleConditionalAborts(context);
        }

        // 确保索引有效
        if (this._currentChildIndex >= this._childCount) {
            this._currentChildIndex = 0;
            return TaskStatus.Success;
        }

        const current = this._children[this._currentChildIndex]!;
        const status = current.tick(context);

        // 如果子节点失败或仍在运行，直接返回
        if (status !== TaskStatus.Success) {
            return status;
        }

        this._currentChildIndex++;

        // 如果已经是最后一个子节点，整个序列成功
        if (this._currentChildIndex >= this._childCount) {
            this._currentChildIndex = 0;
            return TaskStatus.Success;
        }

        return TaskStatus.Running;
    }

    /**
     * 重写invalidate方法，确保在节点无效化时重置索引
     */
    public override invalidate(): void {
        super.invalidate();
        this._currentChildIndex = 0;
    }

    /**
     * 添加子节点时更新缓存
     */
    public override addChild(child: import('../Behavior.js').Behavior<T>): void {
        super.addChild(child);
        this._childCount = this._children.length;
    }

    /**
     * 处理条件性中止
     */
    private handleConditionalAborts(context: T): void {
        // 检查低优先级任务的状态变化
        if (this._hasLowerPriorityConditionalAbort) {
            this.updateLowerPriorityAbortConditional(context, TaskStatus.Success);
        }

        // 检查自中止条件
        if (AbortTypesExt.has(this.abortType, AbortTypes.Self)) {
            this.updateSelfAbortConditional(context, TaskStatus.Success);
        }
    }
}

