class WaitAciton<T> extends Behavior<T>{
    public waitTime: number;
    private _startTime: number;

    constructor(waitTime: number){
        super();

        this.waitTime = waitTime;
    }

    public onStart(){
        this._startTime = 0;
    }

    public update(context: T) : TaskStatus{
        if (this._startTime == 0)
            this._startTime = Timer.time;

        if (Timer.time - this._startTime >= this.waitTime)
            return TaskStatus.Success;

        return TaskStatus.Running;
    }
}