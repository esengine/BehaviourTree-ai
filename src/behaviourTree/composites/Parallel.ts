class Parallel<T> extends Composite<T>{
    public update(context: T): TaskStatus{
        let didAllSucceed = true;
        for (let i = 0; i < this._children.length - 1; i++) {
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