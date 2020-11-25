interface IConditional<T>{
    update(context: T): TaskStatus;
}

var isIConditional = (props: any): props is IConditional<any> => typeof (props as IConditional<any>)['update'] !== 'undefined';