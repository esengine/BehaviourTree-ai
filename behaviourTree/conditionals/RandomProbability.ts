import { Behavior } from '../Behavior';
import { TaskStatus } from '../TaskStatus';
import { IConditional } from './IConditional';

/**
 * 当随机概率高于successProbability概率时返回成功。
 * 否则它将返回失败。
 * successProbability应该在0和1之间
 */
export class RandomProbability<T> extends Behavior<T> implements IConditional<T> {
    public readonly discriminator: "IConditional" = "IConditional";
    /** 任务返回成功的机会 */
    private _successProbability: number;

    public constructor(successProbability: number) {
        super();

        this._successProbability = successProbability;
    }

    public update(_context: T): TaskStatus {
        if (Math.random() > this._successProbability)
            return TaskStatus.Success;

        return TaskStatus.Failure;
    }
}
