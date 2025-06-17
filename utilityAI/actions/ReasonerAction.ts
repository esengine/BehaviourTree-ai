import { IAction } from './IAction.js';
import { Reasoner } from '../reasoners/Reasoner.js';

/**
 * 推理器动作包装器
 * 
 * @description
 * 包装推理器的动作，以便它可以用作动作。
 * 允许在动作系统中使用推理器的决策能力。
 * 
 * @template T 上下文类型
 */
export class ReasonerAction<T> implements IAction<T> {
    private _reasoner: Reasoner<T>;

    public constructor(reasoner: Reasoner<T>) {
        this._reasoner = reasoner;
    }

    public execute(context: T): void {
        const action = this._reasoner.select(context);
        if (action != null) {
            action.execute(context);
        }
    }
}
