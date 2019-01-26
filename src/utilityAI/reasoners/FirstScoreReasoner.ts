/**
 * 选择高于默认考虑分数的第一个考虑因素
 */
class FirstScoreReasoner<T> extends Reasoner<T>{
    protected selectBestConsideration(context: T): IConsideration<T>{
        let defaultScore = this.defaultConsideration.getScore(context);
        for (let i = 0; i < this._condiderations.length; i ++){
            if (this._condiderations[i].getScore(context) >= defaultScore)
                return this._condiderations[i];
        }

        return this.defaultConsideration;
    }
}