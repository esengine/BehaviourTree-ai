class Repeater<T> extends Decorator<T>{
    public count: number;
    public repeatForever: boolean;
    public endOnFailure: boolean;

    private _iterationCount: number;

    public constructor(count: number, endOnFailure: boolean = false){
        super();

        this.count = count;
        this.endOnFailure = endOnFailure;
    }

    public onStart(){
        this._iterationCount = 0;
    }

    public update(context: T): TaskStatus{
        Assert.isNotNull(this.child, "child必须不能为空");

        if (!this.repeatForever && this._iterationCount == this.count)
            return TaskStatus.Success;

        let status = this.child.tick(context);
        this._iterationCount++;

        if (this.endOnFailure && status == TaskStatus.Failure)
            return TaskStatus.Success;

        if (!this.repeatForever && this._iterationCount == this.count)
            return TaskStatus.Success;

        return TaskStatus.Running;
    }
}