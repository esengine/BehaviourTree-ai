abstract class Composite<T> extends Behavior<T>{
    public abortType: AbortTypes = AbortTypes.None;

    protected _children: Array<Behavior<T>> = new Array<Behavior<T>>();
    protected _hasLowerPriorityConditionalAbort: boolean;
    protected _currentChildIndex: number = 0;

    public invalidate(){
        super.invalidate();

        for (let i = 0; i < this._children.length - 1; i++) {
            this._children[i].invalidate();
        }
    }

    public onStart(){
        this._hasLowerPriorityConditionalAbort = this.hasLowerPriorityConditionalAbortInChildren();
        this._currentChildIndex = 0;
    }

    public onEnd(){
        for (let i = 0; i < this._children.length - 1; i++) {
            this._children[i].invalidate();
        }
    }

    private hasLowerPriorityConditionalAbortInChildren() : boolean
    {
        for( var i = 0; i < this._children.length - 1; i++ )
        {
            var composite = this._children[i] as Composite<T>;
            if( composite != null && AbortTypesExt.has(composite.abortType, AbortTypes.LowerPriority ) )
            {
                if( composite.isFirstChildConditional() )
                    return true;
            }
        }

        return false;
    }

    public addChild(child: Behavior<T>){
        this._children.push(child);
    }

    public isFirstChildConditional(): boolean
    {
        let result = this._children[0] as IConditional<T>

        return result != null;
    }

    protected updateSelfAbortConditional(context: T, statusCheck: TaskStatus){
        for (let i = 0; i < this._currentChildIndex; i++) {
            let child = this._children[i];

            if (egret.is(child, "IConditional") == null){
                continue;
            }
            
            let status = this.updateConditionalNode(context, child);
            if (status != statusCheck)
            {
                this._currentChildIndex = i;

                for (let j = i; j < this._children.length - 1; j++) {
                    this._children[j].invalidate();
                }
                
                break;
            }
        }
    }

    protected updateLowerPriorityAbortConditional(context: T, statusCheck: TaskStatus){
        for (let i = 0; i < this._currentChildIndex; i++) {
            let composite = this._children[i] as Composite<T>;
            if (composite != null && AbortTypesExt.has(composite.abortType, AbortTypes.LowerPriority))
            {
                let child = composite._children[0];
                let status = this.updateConditionalNode(context, child);
                if (status != statusCheck){
                    this._currentChildIndex = i;

                    for (let j = i; j < this._children.length - 1; j++) {
                        this._children[j].invalidate();
                    }

                    break;
                }
            }
        }
    }

    private updateConditionalNode(context: T, node: Behavior<T>): TaskStatus{
        if (node instanceof ConditionalDecorator)
            return (node as ConditionalDecorator<T>).executeConditional(context, true);
        else
            return node.update(context);
    }
}