module behaviourTree {
    /**
     * 并行任务将运行每个子任务，直到一个子任务返回失败。
     * 不同的是，并行任务将同时运行其所有的子任务，而不是一次运行每个任务。
     * 像序列类一样，一旦它的所有子任务都返回成功，并行任务将返回成功。
     * 如果一个任务返回失败，并行任务将结束所有的子任务并返回失败。
     */
    export class Parallel<T> extends Composite<T>{
        public update(context: T): TaskStatus{
            let didAllSucceed = true;
            for (let i = 0; i < this._children.length; i++) {
                let child = this._children[i];
                child.tick(context);

                // 如果任何一个子节点失败了，整个分支都会失败
                if (child.status == TaskStatus.Failure)
                    return TaskStatus.Failure;

                // 如果所有的子节点没有成功，我们还没有完成
                else if(child.status != TaskStatus.Success)
                    didAllSucceed = false;
            }

            if (didAllSucceed)
                return TaskStatus.Success;

            return TaskStatus.Running;
        }
    }
}
