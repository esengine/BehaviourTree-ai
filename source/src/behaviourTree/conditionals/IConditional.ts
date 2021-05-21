module behaviourTree {
    export interface IConditional<T>{
        update(context: T): TaskStatus;
    }
    
    export var isIConditional = (props: any): props is IConditional<any> => typeof (props as IConditional<any>)['update'] !== 'undefined';
}
