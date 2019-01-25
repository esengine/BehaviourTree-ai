interface IConditional<T>{
    update(context: T): TaskStatus;
}