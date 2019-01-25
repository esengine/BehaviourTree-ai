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

        if (this._currentChildIndex == this._children.length - 1){
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