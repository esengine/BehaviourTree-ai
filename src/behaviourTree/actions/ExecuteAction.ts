/**
 * 包装一个Func，以便您可以避免必须子类来创建新操作
 */
class ExecuteAction<T> extends Behavior<T>{
    /**
     * Func<T, TaskStatus>
     */
    private _action: Function;

    /**
     * Func<T, TaskStatus>
     */
    public constructor(action: Function){
        super();

        this._action = action;
    }

    public update(context: T): TaskStatus{
        Assert.isNotNull(this._action, "action 必须不为空");

        return this._action(context);
    }
}