/**
 * 总是返回一个固定的分数。 作为默认考虑，提供双重任务。
 */
class FixedScoreConsideration<T> implements IConsideration<T>{
    public score: number;
    public action: IAction<T>;

    constructor(score: number = 1){
        this.score = score;
    }

    public getScore(context: T): number{
        return this.score;
    }
}