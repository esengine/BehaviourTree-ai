import { TaskStatus } from '../TaskStatus';

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
 * 行为树动作结果类型
 * 支持TaskStatus枚举、字符串字面量、boolean和Promise
 */
export type ActionResult = 
    | TaskStatus
    | 'success' 
    | 'failure' 
    | 'running' 
    | boolean 
    | Promise<ActionResult>;

/**
 * 事件注册表类
 * 管理行为树中的动作和条件事件处理器
 * 支持精确匹配和正则表达式匹配
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
 * // 注册精确匹配的动作处理器
 * registry.registerAction<GameContext, MoveParams>(
 *     'move-to', 
 *     (context, params) => {
 *         context.player.moveTo(params.targetX, params.targetY, params.speed || 1);
 *         return 'success';
 *     }
 * );
 * 
 * // 注册正则表达式动作处理器 - 匹配所有以 "enemy." 开头的事件
 * registry.registerActionRegex<GameContext>(
 *     /^enemy\..+$/,
 *     (context, params) => {
 *         // 处理所有敌人相关的动作：enemy.attack, enemy.move, enemy.die 等
 *         console.log('处理敌人动作:', params);
 *         return 'success';
 *     }
 * );
 * 
 * // 注册正则表达式条件检查器 - 匹配所有以 "player." 开头的条件
 * registry.registerConditionRegex<GameContext>(
 *     /^player\..+$/,
 *     (context, params) => {
 *         // 处理所有玩家相关的条件：player.alive, player.hasItem, player.canMove 等
 *         return context.player.health > 0;
 *     }
 * );
 * 
 * // 异步动作示例
 * registry.registerAction<GameContext>(
 *     'async-action',
 *     async (context) => {
 *         await context.player.performComplexAction();
 *         return 'success';
 *     }
 * );
 * ```
 */
export class EventRegistry {
    private actionHandlers = new Map<string, IEventHandler>();
    private conditionHandlers = new Map<string, IConditionChecker>();
    
    // 正则表达式处理器存储
    private regexActionHandlers = new Map<RegExp, IEventHandler>();
    private regexConditionHandlers = new Map<RegExp, IConditionChecker>();
    
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
     * 注册正则表达式动作处理器
     * @template TContext 上下文类型
     * @template TParams 参数类型
     * @param eventPattern 事件名称正则表达式
     * @param handler 处理器函数，必须返回 ActionResult 类型
     */
    registerActionRegex<TContext = IBehaviorTreeContext, TParams = Record<string, any>>(
        eventPattern: RegExp, 
        handler: IEventHandler<TContext, TParams>
    ): void {
        this.regexActionHandlers.set(eventPattern, handler as IEventHandler);
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
     * 注册正则表达式条件检查器
     * @template TContext 上下文类型
     * @template TParams 参数类型
     * @param eventPattern 事件名称正则表达式
     * @param checker 检查器函数，必须返回 boolean 类型
     */
    registerConditionRegex<TContext = IBehaviorTreeContext, TParams = Record<string, any>>(
        eventPattern: RegExp, 
        checker: IConditionChecker<TContext, TParams>
    ): void {
        this.regexConditionHandlers.set(eventPattern, checker as IConditionChecker);
    }
    
    /**
     * 获取动作处理器
     * @param eventName 事件名称
     * @returns 处理器函数或undefined
     */
    getActionHandler(eventName: string): IEventHandler | undefined {
        const exactMatch = this.actionHandlers.get(eventName);
        if (exactMatch) {
            return exactMatch;
        }
        
        for (const [pattern, handler] of this.regexActionHandlers) {
            if (pattern.test(eventName)) {
                return handler;
            }
        }
        
        return undefined;
    }
    
    /**
     * 获取条件检查器
     * @param eventName 事件名称
     * @returns 检查器函数或undefined
     */
    getConditionHandler(eventName: string): IConditionChecker | undefined {
        const exactMatch = this.conditionHandlers.get(eventName);
        if (exactMatch) {
            return exactMatch;
        }
        
        for (const [pattern, handler] of this.regexConditionHandlers) {
            if (pattern.test(eventName)) {
                return handler;
            }
        }
        
        return undefined;
    }
    
    getAllEventNames(): string[] {
        const actionNames = Array.from(this.actionHandlers.keys());
        const conditionNames = Array.from(this.conditionHandlers.keys());
        return [...new Set([...actionNames, ...conditionNames])];
    }
    
    /**
     * 获取所有正则表达式模式
     * @returns 包含所有注册的正则表达式模式的数组
     */
    getAllRegexPatterns(): RegExp[] {
        const actionPatterns = Array.from(this.regexActionHandlers.keys());
        const conditionPatterns = Array.from(this.regexConditionHandlers.keys());
        return [...new Set([...actionPatterns, ...conditionPatterns])];
    }
    
    /**
     * 测试事件名是否匹配任何已注册的处理器（包括正则表达式）
     * @param eventName 事件名称
     * @returns 是否有匹配的处理器
     */
    hasHandler(eventName: string): boolean {
        return this.getActionHandler(eventName) !== undefined || 
               this.getConditionHandler(eventName) !== undefined;
    }
    
    clear(): void {
        this.actionHandlers.clear();
        this.conditionHandlers.clear();
        this.regexActionHandlers.clear();
        this.regexConditionHandlers.clear();
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