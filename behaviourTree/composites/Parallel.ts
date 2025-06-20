import { Composite } from './Composite';
import { TaskStatus } from '../TaskStatus';

/**
 * 并行组合器
 * 
 * @description
 * 同时执行所有子节点，直到满足终止条件：
 * - 任何子节点失败时返回失败
 * - 所有子节点成功时返回成功
 * - 其他情况返回运行中
 * 
 * @template T 上下文类型
 */
export class Parallel<T> extends Composite<T> {
    /** 缓存的子节点数量，避免重复访问length属性*/
    private _childCount: number = 0;

    public override onStart(): void {
        super.onStart();
        this._childCount = this._children.length;
    }

    public update(context: T): TaskStatus {
        if (this._childCount === 0) {
            return TaskStatus.Success;
        }

        let successCount = 0;
        
        // 使用缓存的长度和提前退出优化
        for (let i = 0; i < this._childCount; i++) {
            const child = this._children[i]!;
            child.tick(context);

            const status = child.status;
            
            // 提前退出：任何子节点失败立即返回失败
            if (status === TaskStatus.Failure) {
                return TaskStatus.Failure;
            }
            
            // 计数成功的子节点
            if (status === TaskStatus.Success) {
                successCount++;
            }
        }

        // 所有子节点都成功
        if (successCount === this._childCount) {
            return TaskStatus.Success;
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

