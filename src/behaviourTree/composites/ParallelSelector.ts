class ParallelSelector<T> extends Composite<T>{
    public update(context: T): TaskStatus{
        let didAllFail = true;
        for (let i = 0; i < this._children.length - 1; i++) {
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