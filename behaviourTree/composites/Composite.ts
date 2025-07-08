import { Behavior } from '../Behavior';
import { TaskStatus } from '../TaskStatus';
import { AbortTypes, AbortTypesExt } from './AbortTypes';
import { isIConditional, IConditional } from '../conditionals/IConditional';

/**
 * 条件装饰器接口，用于类型安全的条件性中止逻辑
 */
interface IConditionalDecorator<T> extends IConditional<T> {
    abortType: AbortTypes;
    executeConditional(context: T, forceUpdate?: boolean): TaskStatus;
}

/**
 * 检查节点是否为条件装饰器
 * @param node 要检查的节点
 * @returns 如果是条件装饰器则返回true
 */
function isConditionalDecorator<T>(node: Behavior<T>): node is Behavior<T> & IConditionalDecorator<T> {
    return isIConditional(node) && 
           'abortType' in node && 
           'executeConditional' in node &&
           typeof (node as IConditionalDecorator<T>).executeConditional === 'function';
}

/**
 * 复合节点基类
 * 
 * 所有复合节点（如Sequence、Selector等）都必须继承此类。
 * 提供子节点管理和中止类型处理的基础功能。
 * 
 * @template T 上下文类型
 * @abstract
 */
export abstract class Composite<T> extends Behavior<T> {
    /** 中止类型，决定节点在何种情况下会被中止*/
    public abortType: AbortTypes = AbortTypes.None;

    /** 子节点数组*/
    protected _children: Array<Behavior<T>> = new Array<Behavior<T>>();
    
    /** 是否存在低优先级条件中止 */
    protected _hasLowerPriorityConditionalAbort: boolean = false;
    
    /** 当前执行的子节点索引 */
    protected _currentChildIndex: number = 0;

    /**
     * 使节点及其所有子节点无效
     * 
     * 重写父类方法，递归使所有子节点无效
     */
    public override invalidate(): void {
        super.invalidate();

        const childrenLength = this._children.length;
        for (let i = 0; i < childrenLength; i++) {
            this._children[i]!.invalidate();
        }
    }

    /**
     * 节点开始执行时的初始化
     * 
     * 检查是否存在低优先级条件中止，并重置当前子节点索引
     */
    public override onStart(): void {
        // 检查子节点中是否存在低优先级条件中止
        this._hasLowerPriorityConditionalAbort = this.hasLowerPriorityConditionalAbortInChildren();
        this._currentChildIndex = 0;
    }

    /**
     * 节点执行结束时的清理
     * 
     * 使所有子节点无效，为下一次执行做准备
     */
    public override onEnd(): void {
        // 使所有子节点无效，为下一帧做准备
        const childrenLength = this._children.length;
        for (let i = 0; i < childrenLength; i++) {
            this._children[i]!.invalidate();
        }
    }

    /**
     * 检查子节点中是否存在低优先级条件中止
     * 
     * 遍历所有子节点，查找设置了LowerPriority中止类型的节点
     * 
     * @returns 如果存在低优先级条件中止则返回true，否则返回false
     * @private
     */
    private hasLowerPriorityConditionalAbortInChildren(): boolean {
        for (let i = 0; i < this._children.length; i++) {
            const child = this._children[i];
            
            // 检查条件装饰器的中止类型
            if (isConditionalDecorator(child) && AbortTypesExt.has(child.abortType, AbortTypes.LowerPriority)) {
                return true;
            }
            
            // 检查复合节点的中止类型
            const composite = child as Composite<T>;
            if (composite != null && AbortTypesExt.has(composite.abortType, AbortTypes.LowerPriority)) {
                // 确保第一个子节点是条件节点
                if (composite.isFirstChildConditional())
                    return true;
            }
        }

        return false;
    }

    /**
     * 添加子节点
     * 
     * @param child 要添加的子节点
     */
    public addChild(child: Behavior<T>): void {
        this._children.push(child);
    }

    /**
     * 检查第一个子节点是否为条件节点
     * 
     * 用于处理条件性中止逻辑
     * 
     * @returns 如果第一个子节点是条件节点则返回true，否则返回false
     */
    public isFirstChildConditional(): boolean {
        return isIConditional(this._children[0]);
    }

    /**
     * 更新自中止条件节点
     * 
     * 检查当前索引之前的条件节点状态变化，支持自中止功能。
     * 当条件节点状态不符合预期时，会重置当前索引并使后续子节点无效。
     * 
     * @param context 执行上下文
     * @param statusCheck 期望的状态值
     * @protected
     */
    protected updateSelfAbortConditional(context: T, statusCheck: TaskStatus): void {
        // 检查当前索引之前的条件节点
        for (let i = 0; i < this._currentChildIndex; i++) {
            const child = this._children[i]!;
            if (!isIConditional(child)) {
                continue;
            }
            
            const status = this.updateConditionalNode(context, child);
            if (status !== statusCheck) {
                this._currentChildIndex = i;

                // 中止时使后续子节点无效
                const childrenLength = this._children.length;
                for (let j = i; j < childrenLength; j++) {
                    this._children[j]!.invalidate();
                }
                break;
            }
        }
    }

    /**
     * 更新低优先级中止条件节点
     * 
     * 检查具有低优先级中止类型的组合节点，当其条件节点状态发生变化时
     * 执行中止操作。
     * 
     * @param context 执行上下文
     * @param statusCheck 期望的状态值
     * @protected
     */
    protected updateLowerPriorityAbortConditional(context: T, statusCheck: TaskStatus): void {
        // 检查当前索引之前的低优先级任务
        for (let i = 0; i < this._currentChildIndex; i++) {
            const child = this._children[i];
            
            // 检查是否为条件装饰器或设置了LowerPriority中止类型的复合节点
            if (isConditionalDecorator(child) && AbortTypesExt.has(child.abortType, AbortTypes.LowerPriority)) {
                // 对于条件装饰器，检查条件本身而不是装饰器的整体状态
                const conditionStatus = child.executeConditional(context, true); // 强制更新条件
                
                // 对于选择器：当高优先级条件变为Success时，应该中止低优先级任务
                // 对于序列器：当高优先级条件变为Failure时，应该中止低优先级任务
                const shouldAbort = (statusCheck === TaskStatus.Failure) ? (conditionStatus === TaskStatus.Success) : (conditionStatus === TaskStatus.Failure);
                
                if (shouldAbort) {
                    // 条件满足，需要中止当前执行，回到这个节点
                    this._currentChildIndex = i;

                    // 中止时使后续子节点无效
                    const childrenLength = this._children.length;
                    for (let j = i + 1; j < childrenLength; j++) {
                        this._children[j]!.invalidate();
                    }
                    
                    break;
                }
            } else {
                // 检查是否为设置了LowerPriority的复合节点
                const composite = child as Composite<T>;
                if (composite && AbortTypesExt.has(composite.abortType, AbortTypes.LowerPriority)) {
                    // 获取复合节点的第一个子节点作为条件
                    const firstChild = composite._children[0];
                    if (firstChild && isIConditional(firstChild)) {
                        const status = this.updateConditionalNode(context, firstChild);
                        // 对于选择器：当高优先级条件变为Success时，应该中止低优先级任务
                        // 对于序列器：当高优先级条件变为Failure时，应该中止低优先级任务
                        const shouldAbort = (statusCheck === TaskStatus.Failure) ? (status === TaskStatus.Success) : (status === TaskStatus.Failure);
                        
                        if (shouldAbort) {
                            this._currentChildIndex = i;

                            // 中止时使后续子节点无效
                            const childrenLength = this._children.length;
                            for (let j = i + 1; j < childrenLength; j++) {
                                this._children[j]!.invalidate();
                            }
                            
                            break;
                        }
                    }
                }
            }
        }
    }

    /**
     * 更新条件节点状态
     * 
     * 辅助方法，用于获取条件节点或条件装饰器的任务状态
     * 
     * @param context 执行上下文
     * @param node 要更新的节点
     * @returns 节点的执行状态
     * @private
     */
    private updateConditionalNode(context: T, node: Behavior<T>): TaskStatus {
        // 直接调用节点的update方法获取状态
        return node.update(context);
    }
}

