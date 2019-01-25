abstract class Behavior<T>{
    public status: TaskStatus = TaskStatus.Invalid;

    public abstract update(context:T) : TaskStatus;

    public invalidate(){
        this.status = TaskStatus.Invalid;
    }

    public onStart(){}

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