import { Behavior } from '../Behavior';
import { TaskStatus } from '../TaskStatus';

/**
 * 执行函数动作包装器
 * 
 * @description
 * 包装一个函数以便可以作为行为树节点使用，避免为简单逻辑创建子类。
 * 适合快速原型开发和简单的行为逻辑。
 * 
 * @template T 上下文类型
 * 
 * @example
 * ```typescript
 * // 创建简单的执行动作
 * const moveAction = new ExecuteAction<GameContext>((context) => {
 *   context.player.move();
 *   return TaskStatus.Success;
 * });
 * 
 * // 带条件的执行动作
 * const attackAction = new ExecuteAction<GameContext>((context) => {
 *   if (context.enemy.isInRange()) {
 *     context.player.attack();
 *     return TaskStatus.Success;
 *   }
 *   return TaskStatus.Failure;
 * });
 * ```
 */
export class ExecuteAction<T> extends Behavior<T> {
    /** 
     * 执行函数
     * @type {(context: T) => TaskStatus}
     */
    private readonly _action: (context: T) => TaskStatus;
    
    /** 是否启用错误处理（默认true） */
    private readonly _enableErrorHandling: boolean;
    
    /** 动作名称（用于调试和错误日志） */
    private readonly _name?: string;

    /**
     * 创建执行动作
     * @param action 要执行的函数，不能为null
     * @param options 配置选项
     * @throws {Error} 当action为null或undefined时抛出错误
     */
    public constructor(
        action: (context: T) => TaskStatus, 
        options: {
            /** 是否启用错误处理，默认true */
            enableErrorHandling?: boolean;
            /** 动作名称，用于调试 */
            name?: string;
        } = {}
    ) {
        super();

        if (action == null) {
            throw new Error('动作函数不能为null或undefined');
        }
        
        if (typeof action !== 'function') {
            throw new Error('动作必须是一个函数');
        }

        this._action = action;
        this._enableErrorHandling = options.enableErrorHandling ?? true;
        this._name = options.name;
    }

    /**
     * 执行包装的函数
     * @param context 执行上下文
     * @returns 执行结果状态
     */
    public update(context: T): TaskStatus {
        if (this._enableErrorHandling) {
            try {
                const result = this._action(context);
                
                // 验证返回值是否为有效的TaskStatus
                if (!this.isValidTaskStatus(result)) {
                    console.error(`ExecuteAction ${this._name || ''}: 动作函数返回了无效的TaskStatus: ${result}`);
                    return TaskStatus.Failure;
                }
                
                return result;
            } catch (error) {
                const actionName = this._name ? `"${this._name}"` : '';
                console.error(`ExecuteAction ${actionName} 执行时发生错误:`, error);
                return TaskStatus.Failure;
            }
        } else {
            // 高性能模式：跳过错误处理
            return this._action(context);
        }
    }

    /**
     * 验证TaskStatus是否有效
     * @param status 要验证的状态
     * @returns 是否为有效状态
     */
    private isValidTaskStatus(status: any): status is TaskStatus {
        return status === TaskStatus.Success || 
               status === TaskStatus.Failure || 
               status === TaskStatus.Running;
    }

    /**
     * 获取动作名称
     * @returns 动作名称或函数名
     */
    public getName(): string {
        return this._name || this._action.name || 'Anonymous Action';
    }

    /**
     * 创建一个始终成功的执行动作
     * @param action 要执行的无返回值函数
     * @param name 动作名称
     * @returns 新的ExecuteAction实例
     */
    public static createAlwaysSuccess<T>(
        action: (context: T) => void, 
        name?: string
    ): ExecuteAction<T> {
        return new ExecuteAction<T>((context) => {
            action(context);
            return TaskStatus.Success;
        }, { name: name || 'Always Success Action' });
    }

    /**
     * 创建一个条件执行动作
     * @param predicate 条件函数
     * @param name 动作名称
     * @returns 新的ExecuteAction实例
     */
    public static createConditional<T>(
        predicate: (context: T) => boolean, 
        name?: string
    ): ExecuteAction<T> {
        return new ExecuteAction<T>((context) => {
            return predicate(context) ? TaskStatus.Success : TaskStatus.Failure;
        }, { name: name || 'Conditional Action' });
    }
}
