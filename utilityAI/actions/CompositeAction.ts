import { IAction } from './IAction.js';

/**
 * 复合动作
 * 
 * @description
 * 包含将按顺序执行的动作列表的动作。
 * 适用于需要组合多个简单动作来完成复杂任务的场景。
 * 
 * @template T 上下文类型
 * 
 * @example
 * ```typescript
 * const compositeAction = new CompositeAction<GameContext>()
 *   .addAction(new MoveToTargetAction())
 *   .addAction(new AttackAction())
 *   .addAction(new PlaySoundAction());
 * 
 * compositeAction.execute(gameContext);
 * ```
 */
export class CompositeAction<T> implements IAction<T> {
    /** 动作列表 */
    private _actions: Array<IAction<T>> = [];

    /**
     * 执行所有子动作
     * @param context 执行上下文
     */
    public execute(context: T): void {
        for (let i = 0; i < this._actions.length; i++) {
            const action = this._actions[i];
            if (action) {
                try {
                    action.execute(context);
                } catch (error) {
                    console.error(`执行复合动作中的第${i}个动作时发生错误:`, error);
                    // 继续执行其他动作，不中断整个序列
                }
            }
        }
    }

    /**
     * 添加动作到执行列表
     * @param action 要添加的动作
     * @returns 返回自身以支持链式调用
     */
    public addAction(action: IAction<T>): CompositeAction<T> {
        if (action == null) {
            throw new Error('动作不能为null或undefined');
        }
        
        this._actions.push(action);
        return this;
    }

    /**
     * 移除指定的动作
     * @param action 要移除的动作
     * @returns 是否成功移除
     */
    public removeAction(action: IAction<T>): boolean {
        const index = this._actions.indexOf(action);
        if (index !== -1) {
            this._actions.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * 在指定位置插入动作
     * @param index 插入位置
     * @param action 要插入的动作
     */
    public insertAction(index: number, action: IAction<T>): void {
        if (action == null) {
            throw new Error('动作不能为null或undefined');
        }
        
        if (index < 0 || index > this._actions.length) {
            throw new Error(`插入位置${index}超出有效范围[0, ${this._actions.length}]`);
        }
        
        this._actions.splice(index, 0, action);
    }

    /**
     * 清空所有动作
     */
    public clearActions(): void {
        this._actions.length = 0;
    }

    /**
     * 获取动作数量
     * @returns 当前动作的数量
     */
    public getActionCount(): number {
        return this._actions.length;
    }

    /**
     * 获取所有动作的只读副本
     * @returns 动作数组的副本
     */
    public getActions(): ReadonlyArray<IAction<T>> {
        return [...this._actions];
    }
}
