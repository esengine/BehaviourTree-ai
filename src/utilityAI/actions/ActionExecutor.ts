/**
 * 包装Action以用作IAction而无需创建新类
 */
class ActionExecutor<T> implements IAction<T>{
    private _action: Function;

    public constructor(action: Function){
        this._action = action;
    }

    public execute(context: T){
        this._action(context);
    }
}