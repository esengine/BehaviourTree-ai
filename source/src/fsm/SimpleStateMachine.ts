module fsm {
    class StateMethodCache {
        public enterState!: ()=>void;
        public tick!: ()=>void;
        public exitState!: ()=>void;
    }

    export abstract class SimpleStateMachine<TEnum> extends es.Component implements es.IUpdatable {
        protected elapsedTimeInState = 0;
        protected previousState!: TEnum;
        private _stateCache!: Map<TEnum, StateMethodCache>;
        private _stateMethods!: StateMethodCache;

        private _currentState!: TEnum;

        protected get currentState(): TEnum {
            return this._currentState;
        }

        protected set currentState(value: TEnum) {
            if (this._currentState == value)
                return;

            this.previousState = this._currentState;
            this._currentState = value;

            if (this._stateMethods.exitState != null)
                this._stateMethods.exitState.call(this);

            this.elapsedTimeInState = 0;
            this._stateMethods = this._stateCache.get(this._currentState)!;

            if (this._stateMethods.enterState != null)
                this._stateMethods.enterState.call(this);
        }

        protected set initialState(value: TEnum) {
            this._currentState = value;
            this._stateMethods = this._stateCache.get(this._currentState)!;

            if (this._stateMethods.enterState != null)
                this._stateMethods.enterState.call(this);
        }

        constructor(stateType: any) {
            super();

            this._stateCache = new Map();
            for (let enumValues in stateType) {
                this.configureAndCacheState(stateType, stateType[enumValues]);
            }
        }

        private configureAndCacheState(stateType: any, stateEnum: TEnum) {
            let stateName = stateType[stateEnum];

            let state = new StateMethodCache();
            state.enterState = (this as any)[stateName + "_enter"];
            state.tick = (this as any)[stateName + "_tick"];
            state.exitState = (this as any)[stateName + "_exit"];

            this._stateCache.set(stateEnum, state);
        }

        update() {
            this.elapsedTimeInState += es.Time.deltaTime;

            if (this._stateMethods.tick != null)
                this._stateMethods.tick.call(this);
        }
    }
}