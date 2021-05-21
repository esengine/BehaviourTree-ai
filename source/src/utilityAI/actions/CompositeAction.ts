module utilityAI {
    /**
     * 包含将按顺序执行的动作列表的动作
     */
    export class CompositeAction<T> implements IAction<T>{
        private _actions: Array<IAction<T>> = new Array<IAction<T>>();

        public execute(context: T){
            for (let i = 0; i < this._actions.length; i++){
                this._actions[i].execute(context);
            }
        }

        public addAction(action: IAction<T>): CompositeAction<T>{
            this._actions.push(action);

            return this;
        }
    }
}
