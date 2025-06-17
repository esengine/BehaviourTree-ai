import { IAction } from './IAction.js';

/**
 * 动作选项评估接口
 * 用于评估特定选项的分数
 */
export interface IActionOptionAppraisal<T, U> {
    /**
     * 获取选项的分数
     * @param context 上下文
     * @param option 要评估的选项
     * @returns 选项分数
     */
    getScore(context: T, option: U): number;
}

/**
 * 包含选项列表的动作
 * 
 * @description
 * 这些选项将传递给评估器，从而对最佳选项进行评分并找到最佳选择。
 * 适用于需要从多个选项中选择最优解的场景。
 * 
 * @template T 上下文类型
 * @template U 选项类型
 * 
 * @example
 * ```typescript
 * class AttackTargetAction extends ActionWithOptions<GameContext, Enemy> {
 *   execute(context: GameContext): void {
 *     const enemies = context.getEnemiesInRange();
 *     const bestTarget = this.getBestOption(context, enemies);
 *     if (bestTarget) {
 *       context.player.attack(bestTarget);
 *     }
 *   }
 * }
 * ```
 */
export abstract class ActionWithOptions<T, U> implements IAction<T> {
    /** 评估器列表，用于对选项进行评分 */
    protected _appraisals: Array<IActionOptionAppraisal<T, U>> = [];

    /**
     * 从选项列表中获取最佳选项
     * @param context 决策上下文
     * @param options 可选择的选项列表
     * @returns 最佳选项，如果没有合适选项则返回null
     */
    public getBestOption(context: T, options: Array<U>): U | null {
        if (options.length === 0) {
            return null;
        }

        if (this._appraisals.length === 0) {
            // 如果没有评估器，返回第一个选项
            return options[0] || null;
        }

        let result: U | null = null;
        let bestScore = Number.NEGATIVE_INFINITY;

        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            if (option === undefined) continue;

            let currentScore = 0;
            for (let j = 0; j < this._appraisals.length; j++) {
                const appraisal = this._appraisals[j];
                if (appraisal) {
                    currentScore += appraisal.getScore(context, option);
                }
            }

            if (currentScore > bestScore) {
                bestScore = currentScore;
                result = option;
            }
        }

        return result;
    }

    /**
     * 执行动作的抽象方法
     * 子类必须实现此方法来定义具体的执行逻辑
     * @param context 执行上下文
     */
    public abstract execute(context: T): void;

    /**
     * 添加选项评估器
     * @param scorer 评估器实例
     * @returns 返回自身以支持链式调用
     */
    public addScorer(scorer: IActionOptionAppraisal<T, U>): ActionWithOptions<T, U> {
        this._appraisals.push(scorer);
        return this;
    }

    /**
     * 移除指定的评估器
     * @param scorer 要移除的评估器
     * @returns 是否成功移除
     */
    public removeScorer(scorer: IActionOptionAppraisal<T, U>): boolean {
        const index = this._appraisals.indexOf(scorer);
        if (index !== -1) {
            this._appraisals.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * 清空所有评估器
     */
    public clearScorers(): void {
        this._appraisals.length = 0;
    }

    /**
     * 获取评估器数量
     * @returns 当前评估器的数量
     */
    public getScorerCount(): number {
        return this._appraisals.length;
    }
}
