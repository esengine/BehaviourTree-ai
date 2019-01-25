class BehaviorTreeReference<T> extends Behavior<T>{
    private _childTree: BehaviorTree<T>;

    constructor(tree: BehaviorTree<T>){
        super();

        this._childTree = tree;
    }

    public update(context: T): TaskStatus{
        this._childTree.tick();

        return TaskStatus.Success;
    }
}