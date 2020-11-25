/**
 * 等待指定的时间。 任务将返回运行，直到任务完成等待。 在等待时间结束后它将返回成功。
 */
class WaitAciton<T> extends Behavior<T>{
    /**
     * 等待的时间
     */
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
        // 我们不能使用Time.deltaTime，因为行为树会按照自己的速率tick，所以我们只存储起始时间
        if (this._startTime == 0)
            this._startTime = es.Time.totalTime;

        if (es.Time.totalTime - this._startTime >= this.waitTime)
            return TaskStatus.Success;

        return TaskStatus.Running;
    }
}