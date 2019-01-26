/**
 * 并行任务将运行每个子任务，直到子任务返回失败为止。
 * 不同之处在于，并行任务将同时运行其所有子任务，而不是一次运行一个任务。
 * 与Sequence类一样，一旦并行任务的所有子任务都返回成功，它将返回成功。
 * 如果一个任务返回失败，则并行任务将结束所有子任务并返回失败。
 */
class Parallel<T> extends Composite<T>{
    public update(context: T): TaskStatus{
        let didAllSucceed = true;
        for (let i = 0; i < this._children.length; i++) {
            let child = this._children[i];
            child.tick(context);

            if (child.status == TaskStatus.Failure)
                return TaskStatus.Failure;
            else if(child.status != TaskStatus.Success)
                didAllSucceed = false;
        }

        if (didAllSucceed)
            return TaskStatus.Success;

        return TaskStatus.Running;
    }
}