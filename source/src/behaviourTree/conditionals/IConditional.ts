module behaviourTree {
    export interface IConditional<T>{
        readonly discriminator: 'IConditional';
        update(context: T): TaskStatus;
    }
    
    export function isIConditional(obj: any) {
        return obj.discriminator === 'IConditional';
    }
}
