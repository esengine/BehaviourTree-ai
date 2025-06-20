import { Composite } from './Composite';
import { TaskStatus } from '../TaskStatus';

/**
 * 并行选择器
 * 
 * @description
 * 同时执行所有子节点，直到满足终止条件：
 * - 任何子节点成功时返回成功
 * - 所有子节点失败时返回失败
 * - 其他情况返回运行中
 * 
 * @template T 上下文类型
 */
export class ParallelSelector<T> extends Composite<T> {
    /** 缓存的子节点数量，避免重复访问length属性*/
    private _childCount: number = 0;

    public override onStart(): void {
        super.onStart();
        this._childCount = this._children.length;
    }

    public update(context: T): TaskStatus {
        if (this._childCount === 0) {
            return TaskStatus.Failure;
        }

        let failureCount = 0;
        
        // 使用缓存的长度和提前退出优化
        for (let i = 0; i < this._childCount; i++) {
            const child = this._children[i]!;
            child.tick(context);

            const status = child.status;
            
            // 提前退出：任何子节点成功立即返回成功
            if (status === TaskStatus.Success) {
                return TaskStatus.Success;
            }
            
            // 计数失败的子节点
            if (status === TaskStatus.Failure) {
                failureCount++;
            }
        }

        // 所有子节点都失败
        if (failureCount === this._childCount) {
            return TaskStatus.Failure;
        }

        return TaskStatus.Running;
    }

    /**
     * 添加子节点时更新缓存
     */
    public override addChild(child: import('../Behavior.js').Behavior<T>): void {
        super.addChild(child);
        this._childCount = this._children.length;
    }
}

