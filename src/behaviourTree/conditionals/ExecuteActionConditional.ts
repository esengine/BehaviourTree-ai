class ExecuteActionConditional<T> extends ExecuteAction<T> implements IConditional<T>{
    public constructor(action: Function){
        super(action);
    }
}