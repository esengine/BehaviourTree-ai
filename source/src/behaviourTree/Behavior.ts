/**
 * 所有节点的根类
 */
abstract class Behavior<T>{
    public status: TaskStatus = TaskStatus.Invalid;

    public abstract update(context:T) : TaskStatus;

    public invalidate(){
        this.status = TaskStatus.Invalid;
    }

    /**
     * 执行前立即调用。
     * 它用于设置需要从上一次运行中重置的任何变量。
     */
    public onStart(){}

    /**
     * 当任务的状态更改为非运行时调用
     */
    public onEnd(){}

    public tick(context: T): TaskStatus{
        if (this.status == TaskStatus.Invalid)
            this.onStart();

        this.status = this.update(context);

        if (this.status != TaskStatus.Running)
            this.onEnd();

        return this.status;
    }
}