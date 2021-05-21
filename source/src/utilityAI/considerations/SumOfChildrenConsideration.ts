module utilityAI {
    /**
     * 通过总结所有子项评估的分数得分
     */
    export class SumOfChildrenConsideration<T> implements IConsideration<T>{
        public action!: IAction<T>;
        private _appraisals: Array<IAppraisal<T>> = new Array<IAppraisal<T>>();

        public getScore(context: T){
            let score = 0;
            for (let i = 0;i < this._appraisals.length; i++){
                score += this._appraisals[i].getScore(context);
            }

            return score;
        }
    }
}
