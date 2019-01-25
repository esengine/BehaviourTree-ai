class ExecuteAction<T> extends Behavior<T>{
    private _action: Function;

    public constructor(action: Function){
        super();

        this._action = action;
    }

    public update(context: T): TaskStatus{
        Assert.isNotNull(this._action, "action 必须不为空");

        return this._action(context);
    }
}