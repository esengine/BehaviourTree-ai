module fsm{
    export class StateMachine<T>{
        public onStateChanged: Function;

        public get currentState(): State<T>{
            return this._currentState;
        }
        public previousState: State<T>;
        public elapsedTimeInState: number = 0;
        protected _currentState: State<T>;
        protected _context: T;
        private _states: Map<any, State<T>> = new Map<any, State<T>>();

        constructor(context: T, initialStateType: any, initialState: State<T>){
            this._context = context;

            this.addState(initialStateType, initialState);
            this._currentState = initialState;
            this._currentState.begin();
        }

        /**
         * 将状态添加到状态机
         * @param stateType
         * @param state
         */
        public addState(stateType: any, state: State<T>){
            state.setMachineAndContext(this, this._context);
            this._states.set(stateType, state);
        }

        /**
         * 使用提供的增量时间为状态机计时
         * @param deltaTime
         */
        public update(deltaTime: number){
            this.elapsedTimeInState += deltaTime;
            this._currentState.reason();
            this._currentState.update(deltaTime);
        }

        /**
         * 从机器获取特定状态，而不必对其进行更改。
         * @param type
         */
        public getState<R extends State<T>>(type: any): R {
            if (!this._states.has(type)){
                console.error(`状态${type}不存在。你是不是在调用addState的时候忘记添加了?`);
                return null;
            }

            return this._states.get(type) as R;
        }


        /**
         * 更改当前状态
         * @param newType
         */
        public changeState<R extends State<T>>(newType: any): R {
            if (this._currentState instanceof newType){
                return this._currentState as R;
            }

            if (this.currentState){
                this._currentState.end();
            }

            if (!this._states.has(newType)){
                console.error(`状态${newType}不存在。你是不是在调用addState的时候忘记添加了?`);
                return;
            }

            this.elapsedTimeInState = 0;
            this.previousState = this._currentState;
            this._currentState = this._states.get(newType);
            this._currentState.begin();

            if (this.onStateChanged)
                this.onStateChanged();

            return this._currentState as R;
        }
    }
}