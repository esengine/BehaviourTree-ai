export interface IAction<T> {
    execute(context: T): void;
}
