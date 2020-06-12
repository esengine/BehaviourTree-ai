/**
 * 序列任务类似于“和”操作。 一旦其子任务之一返回失败，它将返回失败。 
 * 如果子任务返回成功，则它将按顺序运行下一个任务。 如果所有子任务都返回成功，那么它将返回成功。
 */
class Sequence<T> extends Composite<T>{
    public constructor(abortType: AbortTypes = AbortTypes.None){
        super();

        this.abortType = abortType;
    }

    public update(context: T): TaskStatus{
        if (this._currentChildIndex != 0){
            this.handleConditionalAborts(context);
        }

        let current = this._children[this._currentChildIndex];
        let status = current.tick(context);

        if (status != TaskStatus.Success)
            return status;

        this._currentChildIndex ++;

        if (this._currentChildIndex == this._children.length){
            this._currentChildIndex = 0;
            return TaskStatus.Success;
        }

        return TaskStatus.Running;
    }

    private handleConditionalAborts(context: T){
        if (this._hasLowerPriorityConditionalAbort)
            this.updateLowerPriorityAbortConditional(context, TaskStatus.Success);

        if (AbortTypesExt.has(this.abortType, AbortTypes.Self))
            this.updateSelfAbortConditional(context, TaskStatus.Success);
    }
}