class UntilSuccess<T> extends Decorator<T>{
    public update(context: T): TaskStatus{
        Assert.isNotNull(this.child, "child必须不为空");

        let status = this.child.update(context);

        if (status != TaskStatus.Success)
            return TaskStatus.Running;

        return TaskStatus.Success;
    }
}