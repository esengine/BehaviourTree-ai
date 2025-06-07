/**
 * 动作评估接口
 */
export interface IAppraisal<T> {
    getScore(context: T): number;
}

/**
 * 动作评估包装器
 * 
 * @description
 * 包装一个函数，以便您可以避免必须子类来创建新的评估。
 * 
 * @template T 上下文类型
 */
export class ActionAppraisal<T> implements IAppraisal<T> {
    private _appraisalAction: (context: T) => number;

    constructor(appraisalAction: (context: T) => number) {
        this._appraisalAction = appraisalAction;
    }

    public getScore(context: T): number {
        return this._appraisalAction(context);
    }
}
