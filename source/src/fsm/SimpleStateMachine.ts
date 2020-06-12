module fsm{
    /**
     * 具有字符串约束的简单状态机。 使用此功能时必须遵循一些规则：
     *  - 在调用update之前必须设置initialState（使用构造函数）
     *  - 如果在子类中实现更新，则必须调用super.update（）
     *
     * @abstract
     * @class SimpleStateMachine
     * @template TEnum
     */
    export abstract class SimpleStateMachine{
        protected elapsedTimeInState: number = 0;
        protected previousState: string;
        private _stateCache: {[key: string]: StateMethodCache};
        private _stateMethods: StateMethodCache;

        private _currentState: string;
        public get currentState(): string{
            return this._currentState;
        }

        public set currentState(value: string){
            if (this._currentState == value)
                return;

            this.previousState = this._currentState;
            this._currentState = value;

            if (this._stateMethods.exitState != null)
                this._stateMethods.exitState();

            this.elapsedTimeInState = 0;
            this._stateMethods = this._stateCache[this._currentState];

            if (this._stateMethods.enterState != null)
                this._stateMethods.enterState();
        }

        protected set initialState(value: string){
            this._currentState = value;
            this._stateMethods = this._stateCache[this._currentState];

            if (this._stateMethods.enterState != null)
                this._stateMethods.enterState();
        }

        constructor(){
            this._stateCache = {};
        }

        public update(){
            if (this._stateMethods.tick != null)
                this._stateMethods.tick();
        }

        public setEnterMethod(stateName: string, enterState: Function, tickState: Function, exitState: Function){
            let state = new StateMethodCache();
            state.enterState = enterState;
            state.tick = tickState;
            state.exitState = exitState;

            this._stateCache[stateName] = state;
        }
    }

    export class StateMethodCache{
        public enterState: Function;
        public tick: Function;
        public exitState: Function;
    }
}
