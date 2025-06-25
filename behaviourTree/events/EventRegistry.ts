/**
 * 事件处理器接口
 * @template TContext 执行上下文类型，通常包含 node、component、blackboard 等
 * @template TParams 参数类型，可以是具体的参数对象类型
 */
export interface IEventHandler<TContext = IBehaviorTreeContext, TParams = Record<string, any>> {
    (context: TContext, parameters?: TParams): ActionResult;
}

/**
 * 条件检查器接口
 * @template TContext 执行上下文类型
 * @template TParams 参数类型
 */
export interface IConditionChecker<TContext = IBehaviorTreeContext, TParams = Record<string, any>> {
    (context: TContext, parameters?: TParams): boolean;
}

/**
 * 行为树执行上下文的基础接口
 * 这是一个通用的基础接口
 * 用户可以扩展这个接口来定义自己的上下文类型
 */
export interface IBehaviorTreeContext {
    /** 黑板实例 */
    blackboard?: any;
    /** 事件注册表 */
    eventRegistry?: EventRegistry;
    /** 其他自定义属性 - 用户可以添加任何引擎特定的属性 */
    [key: string]: any;
}

/**
 * 行为树动作的标准返回类型
 * 
 * - 字符串形式：'success' | 'failure' | 'running'
 * - 布尔形式：true (成功) | false (失败)
 * - Promise：用于异步操作，会被转换为 'running' 状态
 */
export type ActionResult = 
    | 'success' 
    | 'failure' 
    | 'running' 
    | boolean 
    | Promise<ActionResult>;

/**
 * 事件注册表类
 * 管理行为树中的动作和条件事件处理器
 * 
 * @example
 * ```typescript
 * // 定义自定义上下文类型
 * interface GameContext extends IBehaviorTreeContext {
 *     player: Player;
 *     enemies: Enemy[];
 * }
 * 
 * // 定义参数类型
 * interface MoveParams {
 *     targetX: number;
 *     targetY: number;
 *     speed?: number;
 * }
 * 
 * const registry = new EventRegistry();
 * 
 * // 注册类型安全的动作处理器 - 必须返回 ActionResult
 * registry.registerAction<GameContext, MoveParams>(
 *     'move-to', 
 *     (context, params) => {
 *         context.player.moveTo(params.targetX, params.targetY, params.speed || 1);
 *         return 'success'; // 只能返回: 'success' | 'failure' | 'running' | boolean | Promise
 *     }
 * );
 * 
 * // 异步动作示例
 * registry.registerAction<GameContext>(
 *     'async-action',
 *     async (context) => {
 *         await context.player.performComplexAction();
 *         return 'success'; // Promise<ActionResult> 会被转换为 'running'
 *     }
 * );
 * 
 * // 注册条件检查器 - 必须返回 boolean
 * registry.registerCondition<GameContext>(
 *     'player-alive',
 *     (context) => context.player.health > 0 // 只能返回 boolean
 * );
 * ```
 */
export class EventRegistry {
    private actionHandlers = new Map<string, IEventHandler>();
    private conditionHandlers = new Map<string, IConditionChecker>();
    
    /**
     * 注册动作处理器
     * @template TContext 上下文类型
     * @template TParams 参数类型
     * @param eventName 事件名称
     * @param handler 处理器函数，必须返回 ActionResult 类型
     */
    registerAction<TContext = IBehaviorTreeContext, TParams = Record<string, any>>(
        eventName: string, 
        handler: IEventHandler<TContext, TParams>
    ): void {
        this.actionHandlers.set(eventName, handler as IEventHandler);
    }
    
    /**
     * 注册条件检查器
     * @template TContext 上下文类型
     * @template TParams 参数类型
     * @param eventName 事件名称
     * @param checker 检查器函数，必须返回 boolean 类型
     */
    registerCondition<TContext = IBehaviorTreeContext, TParams = Record<string, any>>(
        eventName: string, 
        checker: IConditionChecker<TContext, TParams>
    ): void {
        this.conditionHandlers.set(eventName, checker as IConditionChecker);
    }
    
    /**
     * 获取动作处理器
     * @param eventName 事件名称
     * @returns 处理器函数或undefined
     */
    getActionHandler(eventName: string): IEventHandler | undefined {
        return this.actionHandlers.get(eventName);
    }
    
    /**
     * 获取条件检查器
     * @param eventName 事件名称
     * @returns 检查器函数或undefined
     */
    getConditionHandler(eventName: string): IConditionChecker | undefined {
        return this.conditionHandlers.get(eventName);
    }
    
    getAllEventNames(): string[] {
        const actionNames = Array.from(this.actionHandlers.keys());
        const conditionNames = Array.from(this.conditionHandlers.keys());
        return [...new Set([...actionNames, ...conditionNames])];
    }
    
    clear(): void {
        this.actionHandlers.clear();
        this.conditionHandlers.clear();
    }
}

export class GlobalEventRegistry {
    private static instance: EventRegistry | null = null;
    
    static getInstance(): EventRegistry {
        if (!GlobalEventRegistry.instance) {
            GlobalEventRegistry.instance = new EventRegistry();
        }
        return GlobalEventRegistry.instance;
    }
} 