import { ExecuteAction } from '../actions/ExecuteAction';
import { TaskStatus } from '../TaskStatus';
import { IConditional } from './IConditional';

/**
 * 执行动作条件包装器
 * 
 * @description
 * 包装一个ExecuteAction，使其可以作为条件节点使用。
 * 适用于需要将简单的函数逻辑用作条件判断的场景。
 * 
 * @template T 上下文类型
 * 
 * @example
 * ```typescript
 * // 创建一个检查玩家血量的条件
 * const healthCheck = new ExecuteActionConditional<GameContext>((context) => {
 *   return context.player.health > 50 ? TaskStatus.Success : TaskStatus.Failure;
 * }, { name: 'HealthCheck' });
 * 
 * // 创建一个检查敌人距离的条件
 * const enemyInRange = ExecuteActionConditional.createPredicate<GameContext>(
 *   (context) => context.getClosestEnemy()?.distance < 10,
 *   'EnemyInRange'
 * );
 * ```
 */
export class ExecuteActionConditional<T> extends ExecuteAction<T> implements IConditional<T> {
    /** 条件节点标识符 */
    public readonly discriminator: "IConditional" = "IConditional";
    
    /**
     * 创建执行动作条件
     * @param action 条件判断函数，应返回Success或Failure
     * @param options 配置选项
     */
    public constructor(
        action: (context: T) => TaskStatus, 
        options: {
            /** 是否启用错误处理，默认true */
            enableErrorHandling?: boolean;
            /** 条件名称，用于调试 */
            name?: string;
        } = {}
    ) {
        super(action, options);
    }

    /**
     * 创建基于布尔值的条件
     * @param predicate 返回布尔值的判断函数
     * @param name 条件名称
     * @returns 新的ExecuteActionConditional实例
     */
    public static createPredicate<T>(
        predicate: (context: T) => boolean, 
        name?: string
    ): ExecuteActionConditional<T> {
        return new ExecuteActionConditional<T>((context) => {
            return predicate(context) ? TaskStatus.Success : TaskStatus.Failure;
        }, { name: name || 'Predicate Condition' });
    }

    /**
     * 创建数值比较条件
     * @param getValue 获取数值的函数
     * @param threshold 阈值
     * @param comparison 比较类型
     * @param name 条件名称
     * @returns 新的ExecuteActionConditional实例
     */
    public static createNumericComparison<T>(
        getValue: (context: T) => number,
        threshold: number,
        comparison: 'greater' | 'less' | 'equal' | 'greaterEqual' | 'lessEqual',
        name?: string
    ): ExecuteActionConditional<T> {
        const compareFunctions = {
            greater: (value: number, threshold: number) => value > threshold,
            less: (value: number, threshold: number) => value < threshold,
            equal: (value: number, threshold: number) => Math.abs(value - threshold) < Number.EPSILON,
            greaterEqual: (value: number, threshold: number) => value >= threshold,
            lessEqual: (value: number, threshold: number) => value <= threshold
        };

        const compareFunc = compareFunctions[comparison];
        const conditionName = name || `Numeric ${comparison} ${threshold}`;

        return new ExecuteActionConditional<T>((context) => {
            try {
                const value = getValue(context);
                if (typeof value !== 'number' || isNaN(value)) {
                    console.warn(`${conditionName}: getValue返回了无效的数值: ${value}`);
                    return TaskStatus.Failure;
                }
                return compareFunc(value, threshold) ? TaskStatus.Success : TaskStatus.Failure;
            } catch (error) {
                console.error(`${conditionName}: 获取数值时发生错误:`, error);
                return TaskStatus.Failure;
            }
        }, { name: conditionName });
    }

    /**
     * 创建属性存在检查条件
     * @param getProperty 获取属性的函数
     * @param name 条件名称
     * @returns 新的ExecuteActionConditional实例
     */
    public static createPropertyExists<T>(
        getProperty: (context: T) => any,
        name?: string
    ): ExecuteActionConditional<T> {
        return new ExecuteActionConditional<T>((context) => {
            try {
                const property = getProperty(context);
                return (property != null) ? TaskStatus.Success : TaskStatus.Failure;
            } catch (error) {
                console.error(`${name || 'Property Check'}: 检查属性时发生错误:`, error);
                return TaskStatus.Failure;
            }
        }, { name: name || 'Property Exists Check' });
    }

    /**
     * 创建组合条件（AND逻辑）
     * @param conditions 条件函数数组
     * @param name 条件名称
     * @returns 新的ExecuteActionConditional实例
     */
    public static createAnd<T>(
        conditions: Array<(context: T) => boolean>,
        name?: string
    ): ExecuteActionConditional<T> {
        return new ExecuteActionConditional<T>((context) => {
            for (const condition of conditions) {
                if (!condition(context)) {
                    return TaskStatus.Failure;
                }
            }
            return TaskStatus.Success;
        }, { name: name || 'AND Condition' });
    }

    /**
     * 创建组合条件（OR逻辑）
     * @param conditions 条件函数数组
     * @param name 条件名称
     * @returns 新的ExecuteActionConditional实例
     */
    public static createOr<T>(
        conditions: Array<(context: T) => boolean>,
        name?: string
    ): ExecuteActionConditional<T> {
        return new ExecuteActionConditional<T>((context) => {
            for (const condition of conditions) {
                if (condition(context)) {
                    return TaskStatus.Success;
                }
            }
            return TaskStatus.Failure;
        }, { name: name || 'OR Condition' });
    }
}
