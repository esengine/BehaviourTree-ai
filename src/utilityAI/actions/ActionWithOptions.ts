/**
 * 包含选项列表的操作。 选项将传递给评估，评分和定位最佳选项。
 */
abstract class ActionWithOptions<T, U> implements IAction<T>{
    protected _appraisals: Array<IActionOptionAppraisal<T, U>> = new Array<IActionOptionAppraisal<T, U>>();

    public getBestOption(context: T, options: Array<U>): U{
        let result: U;
        // 表示单精度最小可能值
        let bestScore = -3.402823E+38;

        for (let i = 0; i < options.length; i ++){
            let option = options[i];
            let current = 0;
            for (let j = 0; j < this._appraisals.length; j ++){
                current += this._appraisals[j].getScore(context, option);
            }

            if (current > bestScore){
                bestScore = current;
                result = option;
            }
        }

        return result;
    }

    public abstract execute(context: T);

    public addScorer(scorer: IActionOptionAppraisal<T, U>): ActionWithOptions<T, U>{
        this._appraisals.push(scorer);
        return this;
    }
}