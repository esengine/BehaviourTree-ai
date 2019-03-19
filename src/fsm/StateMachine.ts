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
        private _states: {[key: number]: State<T>} = {};

        constructor(context: T, initialState: State<T>){
            this._context = context;
            this.addState(initialState);
        }

        public addState(state: State<T>){
            state.setMachineAndContext(this, this._context);
        }
    }
}