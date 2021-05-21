module utilityAI {
    /**
     * 调用另一个Reasoner的操作
     */
    export class ReasonerAction<T> implements IAction<T>{
        private _reasoner: Reasoner<T>;

        public constructor(reasoner: Reasoner<T>){
            this._reasoner = reasoner;
        }

        public execute(context: T){
            let action = this._reasoner.select(context);
            if (action != null)
                action.execute(context);
        }
    }
}
