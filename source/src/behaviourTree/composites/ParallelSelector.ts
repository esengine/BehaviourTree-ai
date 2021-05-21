module behaviourTree {
    /**
     * 与选择器任务类似，ParallelSelector任务一旦有子任务返回成功，就会返回成功。
     * 不同的是，并行任务将同时运行其所有的子任务，而不是一次运行每个任务。
     * 如果一个任务返回成功，并行选择器任务将结束所有的子任务并返回成功。
     * 如果每个子任务都返回失败，那么ParallelSelector任务将返回失败。
     */
    export class ParallelSelector<T> extends Composite<T>{
        public update(context: T): TaskStatus {
            let didAllFail = true;
            for (let i = 0; i < this._children.length; i++) {
                let child = this._children[i];
                child.tick(context);

                // 如果有子节点成功了，我们就返回成功
                if (child.status == TaskStatus.Success)
                    return TaskStatus.Success;

                // 如果所有的子节点没有失败，我们还没有完成
                if (child.status != TaskStatus.Failure)
                    didAllFail = false;
            }

            if (didAllFail)
                return TaskStatus.Failure;

            return TaskStatus.Running;
        }
    }
}
