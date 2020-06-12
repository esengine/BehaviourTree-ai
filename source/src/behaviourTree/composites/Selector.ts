/**
 * 选择器任务类似于“或”操作。一旦它的一个子任务返回成功，它就会返回成功。
 * 如果子任务返回失败，则它将按顺序运行下一个任务。
 * 如果没有子任务返回成功，那么它将返回失败。
 */
class Selector<T> extends Composite<T>{
    constructor(abortType: AbortTypes = AbortTypes.None){
        super();

        this.abortType = abortType;
    }

    public update(context: T): TaskStatus{
        if (this._currentChildIndex != 0)
            this.handleConditionalAborts(context);

        let current = this._children[this._currentChildIndex];
        let status = current.tick(context);

        if (status != TaskStatus.Failure)
            return status;

        this._currentChildIndex++;

        if (this._currentChildIndex == this._children.length){
            this._currentChildIndex = 0;
            return TaskStatus.Failure;
        }

        return TaskStatus.Running;
    }

    private handleConditionalAborts(context: T){
        if (this._hasLowerPriorityConditionalAbort)
            this.updateLowerPriorityAbortConditional(context, TaskStatus.Failure);

        if (AbortTypesExt.has(this.abortType, AbortTypes.Self))
            this.updateSelfAbortConditional(context, TaskStatus.Failure);
    }
}