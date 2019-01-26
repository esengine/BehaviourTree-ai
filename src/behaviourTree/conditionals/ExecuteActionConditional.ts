/**
 * 包装一个ExecuteAction，以便它可以用作条件
 */
class ExecuteActionConditional<T> extends ExecuteAction<T> implements IConditional<T>{
    public constructor(action: Function){
        super(action);
    }
}