import { IAction } from './IAction';
import { Reasoner } from '../reasoners/Reasoner';

/**
 * 包装一个Reasoner，以便它可以作为一个Action使用
 */
export class ActionExecutor<T> implements IAction<T> {
    private _reasoner: Reasoner<T>;

    public constructor(reasoner: Reasoner<T>) {
        this._reasoner = reasoner;
    }

    public execute(context: T): void {
        let action = this._reasoner.select(context);
        if (action != null)
            action.execute(context);
    }
}
