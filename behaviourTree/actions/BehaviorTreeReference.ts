import { Behavior } from '../Behavior';
import { BehaviorTree } from '../BehaviorTree';
import { TaskStatus } from '../TaskStatus';

/**
 * 作为子项运行整个BehaviorTree并返回成功
 */
export class BehaviorTreeReference<T> extends Behavior<T> {
    private _childTree: BehaviorTree<T>;

    constructor(tree: BehaviorTree<T>) {
        super();

        this._childTree = tree;
    }

    public update(_context: T): TaskStatus {
        this._childTree.tick();

        return TaskStatus.Success;
    }
}
