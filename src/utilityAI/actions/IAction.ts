interface IAction<T>{
    execute(context: T);
}