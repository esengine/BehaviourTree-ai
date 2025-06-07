import { Reasoner } from './Reasoner.js';
import { IConsideration } from '../considerations/IConsideration.js';

/**
 * 选择评分最高的考虑因素
 * 
 * @description 
 * 遍历所有考虑因素，找到评分最高的一个。
 * 如果没有考虑因素的分数高于默认分数，则返回默认考虑因素。
 * 
 * @template T 上下文类型
 */
export class HighestScoreReasoner<T> extends Reasoner<T> {
    /**
     * 选择最佳考虑因素
     * @param context 决策上下文
     * @returns 选中的考虑因素
     */
    protected selectBestConsideration(context: T): IConsideration<T> {
        let highestScore = this.defaultConsideration.getScore(context);
        let bestConsideration: IConsideration<T> | null = null;
        
        for (let i = 0; i < this._considerations.length; i++) {
            const currentConsideration = this._considerations[i];
            if (currentConsideration) {
                const score = currentConsideration.getScore(context);
                if (score > highestScore) {
                    highestScore = score;
                    bestConsideration = currentConsideration;
                }
            }
        }

        if (bestConsideration == null) {
            return this.defaultConsideration;
        }

        return bestConsideration;
    }
}
