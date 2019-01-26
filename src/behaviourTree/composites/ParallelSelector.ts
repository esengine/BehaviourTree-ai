/**
 * 与选择器任务类似，ParallelSelector任务将在子任务返回成功时立即返回Success。
 * 不同之处在于，并行任务将同时运行其所有子任务，而不是一次运行一个任务。
 * 如果一个任务返回成功，则并行选择器任务将结束所有子任务并返回成功。
 * 如果每个子任务都返回失败，则ParallelSelector任务将返回失败。
 */
class ParallelSelector<T> extends Composite<T>{
    public update(context: T): TaskStatus{
        let didAllFail = true;
        for (let i = 0; i < this._children.length; i++) {
            let child = this._children[i];
            child.tick(context);

            if (child.status == TaskStatus.Success)
                return TaskStatus.Success;

            if (child.status != TaskStatus.Failure)
                didAllFail = false;
        }

        if (didAllFail)
            return TaskStatus.Failure;

        return TaskStatus.Running;
    }
}