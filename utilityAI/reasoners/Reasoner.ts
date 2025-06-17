import { IConsideration } from '../considerations/IConsideration.js';
import { IAction } from '../actions/IAction.js';
import { FixedScoreConsideration } from '../considerations/FixedScoreConsideration.js';

/**
 * UtilityAI的根节点推理器
 * 
 * @description 
 * 推理器负责从多个考虑因素中选择最佳的行动方案。
 * 它是效用AI系统的核心组件，通过评估各种考虑因素来做出决策。
 * 
 * @template T 上下文类型
 * 
 * @example
 * ```typescript
 * class MyReasoner extends Reasoner<GameContext> {
 *   protected selectBestConsideration(context: GameContext): IConsideration<GameContext> {
 *     // 实现选择逻辑
 *     return this._considerations[0];
 *   }
 * }
 * 
 * const reasoner = new MyReasoner();
 * reasoner.addConsideration(new AttackConsideration());
 * reasoner.addConsideration(new DefendConsideration());
 * 
 * const action = reasoner.select(gameContext);
 * if (action) {
 *   action.execute(gameContext);
 * }
 * ```
 */
export abstract class Reasoner<T> {
    /** 
     * 默认考虑因素，当没有其他考虑因素可用时使用
     * 通常返回一个固定的低分数
     */
    public defaultConsideration: IConsideration<T> = new FixedScoreConsideration<T>();

    /** 
     * 考虑因素列表
     * 推理器将从这些考虑因素中选择最佳的一个
     */
    protected _considerations: Array<IConsideration<T>> = new Array<IConsideration<T>>();

    /**
     * 选择并返回最佳行动
     * 
     * @param context 决策上下文
     * @returns 选中的行动，如果没有可用行动则返回null
     */
    public select(context: T): IAction<T> | null {
        try {
            const consideration = this.selectBestConsideration(context);
            if (consideration != null) {
                return consideration.action;
            }
        } catch (error) {
            console.error('选择最佳考虑因素时发生错误:', error);
        }

        return null;
    } 

    /**
     * 选择最佳考虑因素的抽象方法
     * 子类必须实现此方法来定义具体的选择策略
     * 
     * @param context 决策上下文
     * @returns 选中的考虑因素，如果没有合适的则返回默认考虑因素
     */
    protected abstract selectBestConsideration(context: T): IConsideration<T>;

    /**
     * 添加考虑因素到推理器
     * 
     * @param consideration 要添加的考虑因素
     * @returns 返回自身以支持链式调用
     * @throws {Error} 当consideration为null或undefined时抛出错误
     */
    public addConsideration(consideration: IConsideration<T>): Reasoner<T> {
        if (consideration == null) {
            throw new Error('考虑因素不能为null或undefined');
        }
        
        this._considerations.push(consideration);
        return this;
    }

    /**
     * 移除指定的考虑因素
     * 
     * @param consideration 要移除的考虑因素
     * @returns 是否成功移除
     */
    public removeConsideration(consideration: IConsideration<T>): boolean {
        const index = this._considerations.indexOf(consideration);
        if (index !== -1) {
            this._considerations.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * 清空所有考虑因素
     */
    public clearConsiderations(): void {
        this._considerations.length = 0;
    }

    /**
     * 获取考虑因素数量
     * 
     * @returns 当前考虑因素的数量
     */
    public getConsiderationCount(): number {
        return this._considerations.length;
    }

    /**
     * 获取所有考虑因素的只读副本
     * 
     * @returns 考虑因素数组的副本
     */
    public getConsiderations(): ReadonlyArray<IConsideration<T>> {
        return [...this._considerations];
    }

    /**
     * 设置默认考虑因素
     * 
     * @param defaultConsideration 新的默认考虑因素
     * @returns 返回自身以支持链式调用
     * @throws {Error} 当defaultConsideration为null或undefined时抛出错误
     */
    public setDefaultConsideration(defaultConsideration: IConsideration<T>): Reasoner<T> {
        if (defaultConsideration == null) {
            throw new Error('默认考虑因素不能为null或undefined');
        }
        
        this.defaultConsideration = defaultConsideration;
        return this;
    }

    /**
     * 检查是否有可用的考虑因素
     * 
     * @returns 是否有考虑因素可用
     */
    public hasConsiderations(): boolean {
        return this._considerations.length > 0;
    }
}
