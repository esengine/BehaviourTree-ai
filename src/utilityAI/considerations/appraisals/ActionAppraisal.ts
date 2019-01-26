/**
 * 包装Func以用作评估而无需创建子类
 */
class ActionAppraisal<T> implements IAppraisal<T>{
    private _appraisalAction: Function;

    constructor(appraisalAction: Function){
        this._appraisalAction = appraisalAction;
    }

    public getScore(context: T): number{
        return this._appraisalAction(context);
    }
}