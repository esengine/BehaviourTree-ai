module utilityAI {
    /**
     * 只有当所有的子项得分高于阈值的分数
     */
    export class AllOrNothingConsideration<T> implements IConsideration<T>{
        public threshold: number;
        public action!: IAction<T>;
        private _appraisals: Array<IAppraisal<T>> = new Array<IAppraisal<T>>();

        constructor(threshold: number = 0){
            this.threshold = threshold;
        }

        public addAppraisal(appraisal: IAppraisal<T>){
            this._appraisals.push(appraisal);
            return this;
        }

        public getScore(context: T): number{
            let sum = 0;
            for (let i = 0; i < this._appraisals.length; i++){
                let score = this._appraisals[i].getScore(context);
                if (score < this.threshold)
                    return 0;
                sum += score;
            }

            return sum;
        }
    }
}
