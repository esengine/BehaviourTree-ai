import { TaskStatus } from '../TaskStatus';

export interface IConditional<T> {
    readonly discriminator: 'IConditional';
    update(context: T): TaskStatus;
}

export function isIConditional(obj: any): obj is IConditional<any> {
    return obj && obj.discriminator === 'IConditional';
}
