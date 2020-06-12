///<reference path="./Decorator.ts"/>
class AlwaysFail<T> extends Decorator<T>{
    public update(context: T): TaskStatus{
        Assert.isNotNull(this.child, "child必须不能为空");

        let status = this.child.update(context);

        if (status == TaskStatus.Running)
            return TaskStatus.Running;

        return TaskStatus.Failure;
    }
}