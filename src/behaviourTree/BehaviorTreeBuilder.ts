class BehaviorTreeBuilder<T>{
    private _context: T;
    private _currentNode: Behavior<T>;
    private _parentNodeStack: Array<Behavior<T>> = new Array<Behavior<T>>();

    public constructor(context: T){
        this._context = context;
    }

    public static begin<T>(context: T): BehaviorTreeBuilder<T>{
        return new BehaviorTreeBuilder<T>(context);
    }

    private setChildOnParent(child: Behavior<T>): BehaviorTreeBuilder<T>{
        let parent = ArrayExt.peek(this._parentNodeStack);
        if ( parent instanceof Composite){
            (parent as Composite<T>).addChild(child);
        }
        else if( parent instanceof Decorator ){
            (parent as Decorator<T>).child = child;
            this.endDecorator();
        }

        return this;
    }

    private pushParentNode(composite: Behavior<T>){
        if (this._parentNodeStack.length > 0)
            this.setChildOnParent(composite);

        this._parentNodeStack.push(composite);
        return this;
    }

    private endDecorator(): BehaviorTreeBuilder<T>{
        this._currentNode = this._parentNodeStack.pop();
        return this;
    }

    public action(func: Function): BehaviorTreeBuilder<T>{
        Assert.isFalse(this._parentNodeStack.length == 0, "无法创建无嵌套的动作节点, 它必须是一个叶节点");
        return this.setChildOnParent(new ExecuteAction<T>(func));
    }

    public actionR(func: Function): BehaviorTreeBuilder<T>{
        return this.action(t => func(t) ? TaskStatus.Success : TaskStatus.Failure);
    }

    public conditional(func: Function): BehaviorTreeBuilder<T>{
        Assert.isFalse(this._parentNodeStack.length == 0, "无法创建无嵌套的条件节点, 它必须是一个叶节点");
        return this.setChildOnParent(new ExecuteActionConditional<T>(func));
    }

    public conditionalR(func: Function) : BehaviorTreeBuilder<T>{
        return this.conditional(t => func(t) ? TaskStatus.Success : TaskStatus.Failure);
    }

    public logAction(text: string): BehaviorTreeBuilder<T>{
        Assert.isFalse(this._parentNodeStack.length == 0, "无法创建无嵌套的动作节点, 它必须是一个叶节点");
        return this.setChildOnParent(new LogAction<T>(text));
    }

    public waitAction(waitTime: number): BehaviorTreeBuilder<T>{
        Assert.isFalse(this._parentNodeStack.length == 0, "无法创建无嵌套的动作节点, 它必须是一个叶节点");
        return this.setChildOnParent(new WaitAciton<T>(waitTime));
    }

    public subTree(subTree: BehaviorTree<T>): BehaviorTreeBuilder<T>{
        Assert.isFalse(this._parentNodeStack.length == 0, "无法创建无嵌套的动作节点, 它必须是一个叶节点");
        return this.setChildOnParent(new BehaviorTreeReference<T>(subTree));
    }

    public conditionalDecorator(func: Function, shouldReevaluate: boolean = true): BehaviorTreeBuilder<T>{
        let conditional = new ExecuteActionConditional<T>(func);
        return this.pushParentNode(new ConditionalDecorator<T>(conditional, shouldReevaluate));
    }

    public conditionalDecoratorR(func: Function, shouldReevaluate: boolean = true): BehaviorTreeBuilder<T>{
        return this.conditionalDecorator(t => func(t) ? TaskStatus.Success : TaskStatus.Failure, shouldReevaluate);
    }

    public alwaysFail(): BehaviorTreeBuilder<T>{
        return this.pushParentNode(new AlwaysFail<T>());
    }

    public alwaysSucceed(): BehaviorTreeBuilder<T>{
        return this.pushParentNode(new AlwaysSucceed<T>());
    }

    public inverter(): BehaviorTreeBuilder<T>{
        return this.pushParentNode(new Inverter());
    }

    public repeater(count: number): BehaviorTreeBuilder<T>{
        return this.pushParentNode(new Repeater<T>(count));
    }

    public untilFail(): BehaviorTreeBuilder<T>{
        return this.pushParentNode(new UntilFail<T>());
    }

    public untilSuccess(): BehaviorTreeBuilder<T>{
        return this.pushParentNode(new UntilSuccess<T>());
    }

    public paraller(): BehaviorTreeBuilder<T>{
        return this.pushParentNode(new Parallel<T>());
    }

    public parallelSelector(): BehaviorTreeBuilder<T>{
        return this.pushParentNode(new ParallelSelector<T>());
    }

    public selector(abortType: AbortTypes = AbortTypes.None): BehaviorTreeBuilder<T>{
        return this.pushParentNode(new Selector<T>(abortType));
    }

    public randomSelector(): BehaviorTreeBuilder<T>{
        return this.pushParentNode(new RandomSelector());
    }

    public sequence(abortType: AbortTypes = AbortTypes.None){
        return this.pushParentNode(new Sequence<T>(abortType));
    }

    public randomSequence(): BehaviorTreeBuilder<T>{
        return this.pushParentNode(new RandomSequence<T>());
    }

    public endComposite(): BehaviorTreeBuilder<T>{
        Assert.isTrue( ArrayExt.peek(this._parentNodeStack) instanceof Composite, "尝试结束复合器，但顶部节点是装饰器" );
        this._currentNode = this._parentNodeStack.pop();
        return this;
    }

    public build(updatePeriod: number = 0.2): BehaviorTree<T>{
        Assert.isNotNull(this._currentNode, "无法创建零节点的行为树");
        return new BehaviorTree<T>(this._context, this._currentNode, updatePeriod);
    }
}