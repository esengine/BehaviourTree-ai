///<reference path="./Reasoner.ts"/>
/**
 * 选择评分最高的考虑因素
 */
class HighestScoreReasoner<T> extends Reasoner<T>{
    protected selectBestConsideration(context: T): IConsideration<T>{
        let highsetScore = this.defaultConsideration.getScore(context);
        let consideration: IConsideration<T> = null;
        for (let i = 0; i < this._condiderations.length; i ++){
            let score = this._condiderations[i].getScore(context);
            if (score > highsetScore){
                highsetScore = score;
                consideration = this._condiderations[i];
            }
        }

        if (consideration == null)
            return this.defaultConsideration;

        return consideration;
    }
}