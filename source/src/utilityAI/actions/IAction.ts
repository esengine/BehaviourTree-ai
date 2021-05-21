module utilityAI {
    export interface IAction<T>{
        execute(context: T): void;
    }
}
