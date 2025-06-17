/**
 * 状态方法缓存
 * 存储状态的进入、更新和退出方法
 */
class StateMethodCache {
    public enterState?: () => void;
    public tick?: () => void;
    public exitState?: () => void;
}

/**
 * 简单状态机实现
 * 
 * @description 
 * 基于枚举的简单状态机，通过约定的方法名来处理状态逻辑。
 * 适合简单的状态管理场景，状态逻辑直接写在状态机类中。
 * 
 * @template TEnum 状态枚举类型
 * 
 * @example
 * ```typescript
 * enum PlayerState {
 *   Idle = "Idle",
 *   Running = "Running",
 *   Jumping = "Jumping"
 * }
 * 
 * class PlayerStateMachine extends SimpleStateMachine<PlayerState> {
 *   constructor() {
 *     super(PlayerState);
 *     this.initialState = PlayerState.Idle;
 *   }
 * 
 *   // 状态方法按照 "状态名_enter/tick/exit" 的约定命名
 *   Idle_enter() { 
 *     console.log("进入空闲状态"); 
 *   }
 *   
 *   Idle_tick() { 
 *     // 空闲状态逻辑
 *   }
 *   
 *   Idle_exit() { 
 *     console.log("退出空闲状态"); 
 *   }
 * 
 *   Running_enter() { 
 *     console.log("开始跑步"); 
 *   }
 *   
 *   Running_tick() { 
 *     // 跑步状态逻辑
 *   }
 *   
 *   Running_exit() { 
 *     console.log("停止跑步"); 
 *   }
 * }
 * ```
 */
export abstract class SimpleStateMachine<TEnum extends string | number> {
    /** 在当前状态中的经过时间 */
    protected elapsedTimeInState = 0;
    
    /** 前一个状态 */
    protected previousState?: TEnum;
    
    /** 状态方法缓存 */
    private _stateCache: Map<TEnum, StateMethodCache> = new Map();
    
    /** 当前状态的方法缓存 */
    private _stateMethods: StateMethodCache = new StateMethodCache();

    /** 当前状态 */
    private _currentState?: TEnum;

    /**
     * 获取当前状态
     */
    protected get currentState(): TEnum | undefined {
        return this._currentState;
    }

    /**
     * 设置当前状态
     * @param value 新状态
     */
    protected set currentState(value: TEnum) {
        if (this._currentState === value) {
            return;
        }

        this.previousState = this._currentState;
        this._currentState = value;

        // 退出前一个状态
        if (this._stateMethods.exitState) {
            try {
                this._stateMethods.exitState.call(this);
            } catch (error) {
                console.error('退出状态时发生错误:', error);
            }
        }

        this.elapsedTimeInState = 0;
        const newStateMethods = this._stateCache.get(this._currentState);
        if (newStateMethods) {
            this._stateMethods = newStateMethods;
        } else {
            console.warn('状态的方法缓存不存在');
            this._stateMethods = new StateMethodCache();
        }

        // 进入新状态
        if (this._stateMethods.enterState) {
            try {
                this._stateMethods.enterState.call(this);
            } catch (error) {
                console.error('进入状态时发生错误:', error);
            }
        }
    }

    /**
     * 设置初始状态
     * @param value 初始状态
     */
    protected set initialState(value: TEnum) {
        this._currentState = value;
        const stateMethods = this._stateCache.get(this._currentState);
        if (stateMethods) {
            this._stateMethods = stateMethods;
        } else {
            console.warn('初始状态的方法缓存不存在');
            this._stateMethods = new StateMethodCache();
        }

        if (this._stateMethods.enterState) {
            try {
                this._stateMethods.enterState.call(this);
            } catch (error) {
                console.error('进入初始状态时发生错误:', error);
            }
        }
    }

    /**
     * 创建简单状态机
     * @param stateEnum 状态枚举对象
     */
    constructor(stateEnum: Record<string, TEnum>) {
        this._stateCache = new Map();
        
        // 遍历枚举值并配置状态方法
        for (const enumKey in stateEnum) {
            if (Object.prototype.hasOwnProperty.call(stateEnum, enumKey)) {
                const enumValue = stateEnum[enumKey];
                if (enumValue !== undefined) {
                    this.configureAndCacheState(enumKey, enumValue);
                }
            }
        }
    }

    /**
     * 配置并缓存状态方法
     * @param stateName 状态名称
     * @param stateEnum 状态枚举值
     */
    private configureAndCacheState(stateName: string, stateEnum: TEnum): void {
        const state = new StateMethodCache();
        
        // 使用类型安全的方法查找
        const enterMethodName = stateName + '_enter';
        const tickMethodName = stateName + '_tick';
        const exitMethodName = stateName + '_exit';
        
        // 检查方法是否存在并且是函数
        if (this.hasMethod(enterMethodName)) {
            state.enterState = (this as any)[enterMethodName].bind(this);
        }
        
        if (this.hasMethod(tickMethodName)) {
            state.tick = (this as any)[tickMethodName].bind(this);
        }
        
        if (this.hasMethod(exitMethodName)) {
            state.exitState = (this as any)[exitMethodName].bind(this);
        }

        this._stateCache.set(stateEnum, state);
    }

    /**
     * 检查方法是否存在
     * @param methodName 方法名
     * @returns 方法是否存在且为函数
     */
    private hasMethod(methodName: string): boolean {
        return methodName in this && typeof (this as any)[methodName] === 'function';
    }

    /**
     * 更新状态机
     * @param deltaTime 时间差
     */
    public update(deltaTime: number): void {
        if (deltaTime < 0 || !isFinite(deltaTime)) {
            console.warn('SimpleStateMachine: 无效的deltaTime值');
            return;
        }

        this.elapsedTimeInState += deltaTime;

        if (this._stateMethods.tick) {
            try {
                this._stateMethods.tick.call(this);
            } catch (error) {
                console.error('更新状态时发生错误:', error);
            }
        }
    }

    /**
     * 强制切换到指定状态
     * @param newState 新状态
     */
    protected changeState(newState: TEnum): void {
        this.currentState = newState;
    }

    /**
     * 检查当前是否为指定状态
     * @param state 要检查的状态
     * @returns 是否为指定状态
     */
    protected isInState(state: TEnum): boolean {
        return this._currentState === state;
    }

    /**
     * 获取状态机统计信息
     * @returns 统计信息对象
     */
    protected getStats(): {
        currentState?: TEnum;
        previousState?: TEnum;
        elapsedTimeInState: number;
        registeredStatesCount: number;
    } {
        return {
            currentState: this._currentState,
            previousState: this.previousState,
            elapsedTimeInState: this.elapsedTimeInState,
            registeredStatesCount: this._stateCache.size
        };
    }
}