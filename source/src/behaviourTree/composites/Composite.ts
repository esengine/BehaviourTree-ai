/**
 * 任何Composite节点都必须将其子类化。 为帮助子类提供存储以处理AbortTypes
 */
abstract class Composite<T> extends Behavior<T>{
    public abortType: AbortTypes = AbortTypes.None;

    protected _children: Array<Behavior<T>> = new Array<Behavior<T>>();
    protected _hasLowerPriorityConditionalAbort: boolean;
    protected _currentChildIndex: number = 0;

    public invalidate(){
        super.invalidate();

        for (let i = 0; i < this._children.length; i++) {
            this._children[i].invalidate();
        }
    }

    public onStart(){
        // LowerPriority中止发生一级下降所以我们在这里检查
        this._hasLowerPriorityConditionalAbort = this.hasLowerPriorityConditionalAbortInChildren();
        this._currentChildIndex = 0;
    }

    public onEnd(){
        // 我们这样做是为了让我们的子类无效，这样他们就可以为下一个选择做好准备了。
        for (let i = 0; i < this._children.length; i++) {
            this._children[i].invalidate();
        }
    }

    /**
     * 检查复合的子级以查看是否有任何是具有LowerPriority AbortType的复合
     */
    private hasLowerPriorityConditionalAbortInChildren() : boolean
    {
        for( var i = 0; i < this._children.length; i++ )
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

    /**
     * 向此组合中添加子级
     */
    public addChild(child: Behavior<T>){
        this._children.push(child);
    }

    /**
     * 如果复合的第一个子级是条件的，则返回true。用于处理条件中止。
     */
    public isFirstChildConditional(): boolean
    {
        return isIConditional(this._children[0]);
    }

    /**
     * 检查任何子项以查看它们是否已更改状态
     */
    protected updateSelfAbortConditional(context: T, statusCheck: TaskStatus){
        // 检查任何子任务以查看它们是否更改了状态
        for (let i = 0; i < this._currentChildIndex; i++) {
            
            let child = this._children[i];
            if (!isIConditional(child)){
                continue;
            }
            
            let status = this.updateConditionalNode(context, child);
            if (status != statusCheck)
            {
                this._currentChildIndex = i;

                // 我们有一个中止所以我们使子项无效，所以他们得到重新评估
                for (let j = i; j < this._children.length; j++) {
                    this._children[j].invalidate();
                }
                
                break;
            }
        }
    }

    /**
     * 检查具有较低优先级中止类型和条件为第一个子级的任何子组合。
     * 如果找到一个，它将勾选条件，如果状态不等于statuscheck，将更新_currentChildIndex，即当前正在运行的操作将中止。
     */
    protected updateLowerPriorityAbortConditional(context: T, statusCheck: TaskStatus){
        // 检查任何较低优先级的任务，查看它们是否更改了状态
        for (let i = 0; i < this._currentChildIndex; i++) {
            let composite = this._children[i] as Composite<T>;
            if (composite != null && AbortTypesExt.has(composite.abortType, AbortTypes.LowerPriority))
            {
                // 现在，我们只获得条件（更新而不是勾选）的状态，以查看它是否发生了更改，同时注意条件标识符。
                let child = composite._children[0];
                let status = this.updateConditionalNode(context, child);
                if (status != statusCheck){
                    this._currentChildIndex = i;

                    for (let j = i; j < this._children.length; j++) {
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