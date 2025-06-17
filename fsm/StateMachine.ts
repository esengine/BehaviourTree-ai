import { State } from './State.js';

/**
 * 状态构造函数类型定义
 */
type StateConstructor<T> = new (...args: any[]) => State<T>;

/**
 * 状态机实现
 * 
 * @description 
 * 基于"状态作为对象"模式的状态机实现。
 * 每个状态使用单独的类，适合复杂的状态管理系统。
 * 
 * @template T 上下文类型
 * 
 * @example
 * ```typescript
 * interface GameContext {
 *   player: Player;
 *   enemies: Enemy[];
 * }
 * 
 * const context: GameContext = { ... };
 * const machine = new StateMachine(context, new IdleState());
 * 
 * machine.addState(new AttackState());
 * machine.addState(new DefendState());
 * 
 * // 在游戏循环中更新
 * machine.update(deltaTime);
 * 
 * // 切换状态
 * machine.changeState(AttackState);
 * ```
 */
export class StateMachine<T> {
    /** 状态改变时的回调函数 */
    public onStateChanged?: () => void;

    /** 获取当前状态 */
    public get currentState(): State<T> {
        return this._currentState;
    }

    /** 前一个状态 */
    public previousState?: State<T>;
    
    /** 在当前状态中的经过时间（秒） */
    public elapsedTimeInState: number = 0;
    
    /** 当前状态实例 */
    protected _currentState: State<T>;
    
    /** 执行上下文 */
    protected _context: T;
    
    /** 状态实例缓存 */
    private _states: Map<StateConstructor<T>, State<T>> = new Map();

    /**
     * 创建状态机
     * @param context 执行上下文
     * @param initialState 初始状态实例
     * @throws {Error} 当context或initialState为null时抛出错误
     */
    constructor(context: T, initialState: State<T>) {
        if (context == null) {
            throw new Error('上下文不能为null或undefined');
        }
        if (initialState == null) {
            throw new Error('初始状态不能为null或undefined');
        }

        this._context = context;
        this.addState(initialState);
        this._currentState = initialState;
        this._currentState.begin();
    }

    /**
     * 将状态添加到状态机
     * @param state 要添加的状态实例
     * @throws {Error} 当state为null或已存在时抛出错误
     */
    public addState(state: State<T>): void {
        if (state == null) {
            throw new Error('状态不能为null或undefined');
        }

        const stateConstructor = state.constructor as StateConstructor<T>;
        
        if (this._states.has(stateConstructor)) {
            throw new Error(`状态 ${stateConstructor.name} 已经存在`);
        }

        state.setMachineAndContext(this, this._context);
        this._states.set(stateConstructor, state);
    }

    /**
     * 移除指定类型的状态
     * @param stateType 状态构造函数
     * @returns 是否成功移除
     */
    public removeState<R extends State<T>>(stateType: StateConstructor<R>): boolean {
        if (this._currentState instanceof stateType) {
            console.warn('无法移除当前正在使用的状态');
            return false;
        }

        return this._states.delete(stateType as unknown as StateConstructor<T>);
    }

    /**
     * 使用提供的时间差更新状态机
     * @param deltaTime 时间差（秒）
     * @throws {Error} 当deltaTime为负数或无效时抛出错误
     */
    public update(deltaTime: number): void {
        if (deltaTime < 0 || !isFinite(deltaTime)) {
            throw new Error('deltaTime必须是非负的有限数');
        }

        this.elapsedTimeInState += deltaTime;
        
        try {
            this._currentState.reason();
            this._currentState.update(deltaTime);
        } catch (error) {
            console.error('更新状态时发生错误:', error);
        }
    }

    /**
     * 从状态机获取特定状态实例，而不改变当前状态
     * @param stateType 状态构造函数
     * @returns 状态实例，如果不存在则返回null
     */
    public getState<R extends State<T>>(stateType: StateConstructor<R>): R | null {
        const state = this._states.get(stateType as unknown as StateConstructor<T>);
        if (!state) {
            console.error(`状态 ${stateType.name} 不存在。请确保已调用 addState 添加该状态。`);
            return null;
        }

        return state as R;
    }

    /**
     * 更改当前状态
     * @param newStateType 新状态的构造函数
     * @returns 新状态实例，如果切换失败则返回null
     */
    public changeState<R extends State<T>>(newStateType: StateConstructor<R>): R | null {
        // 如果已经是目标状态，直接返回
        if (this._currentState instanceof newStateType) {
            return this._currentState as R;
        }

        const newState = this._states.get(newStateType as unknown as StateConstructor<T>);
        if (!newState) {
            console.error(`状态 ${newStateType.name} 不存在。请确保已调用 addState 添加该状态。`);
            return null;
        }

        try {
            // 结束当前状态
            (this._currentState as State<T>).end();

            // 切换到新状态
            this.elapsedTimeInState = 0;
            this.previousState = this._currentState;
            this._currentState = newState;
            this._currentState.begin();

            // 触发状态改变回调
            if (this.onStateChanged) {
                this.onStateChanged();
            }

            return this._currentState as R;
        } catch (error) {
            console.error('切换状态时发生错误:', error);
            return null;
        }
    }

    /**
     * 强制切换到指定状态（即使是相同状态也会重新初始化）
     * @param stateType 状态构造函数
     * @returns 状态实例，如果切换失败则返回null
     */
    public forceChangeState<R extends State<T>>(stateType: StateConstructor<R>): R | null {
        const state = this._states.get(stateType as unknown as StateConstructor<T>);
        if (!state) {
            console.error(`状态 ${stateType.name} 不存在。请确保已调用 addState 添加该状态。`);
            return null;
        }

        try {
            // 结束当前状态
            (this._currentState as State<T>).end();

            // 切换到新状态
            this.elapsedTimeInState = 0;
            this.previousState = this._currentState;
            this._currentState = state;
            this._currentState.begin();

            // 触发状态改变回调
            if (this.onStateChanged) {
                this.onStateChanged();
            }

            return this._currentState as R;
        } catch (error) {
            console.error('强制切换状态时发生错误:', error);
            return null;
        }
    }

    /**
     * 检查当前是否为指定状态
     * @param stateType 状态构造函数
     * @returns 是否为指定状态
     */
    public isInState<R extends State<T>>(stateType: StateConstructor<R>): boolean {
        return this._currentState instanceof stateType;
    }

    /**
     * 获取所有已注册的状态类型
     * @returns 状态构造函数数组
     */
    public getRegisteredStateTypes(): StateConstructor<T>[] {
        return Array.from(this._states.keys());
    }

    /**
     * 获取状态机的统计信息
     * @returns 包含状态数量和当前状态信息的对象
     */
    public getStats(): {
        stateCount: number;
        currentStateName: string;
        elapsedTimeInState: number;
        previousStateName?: string;
    } {
        return {
            stateCount: this._states.size,
            currentStateName: this._currentState.constructor.name,
            elapsedTimeInState: this.elapsedTimeInState,
            previousStateName: this.previousState?.constructor.name
        };
    }
}