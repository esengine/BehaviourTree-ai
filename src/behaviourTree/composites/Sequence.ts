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

        if (this._currentChildIndex == this._children.length - 1){
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