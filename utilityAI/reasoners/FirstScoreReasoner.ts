import { Reasoner } from './Reasoner';
import { IConsideration } from '../considerations/IConsideration';

/**
 * 选择高于默认考虑分数的第一个考虑因素
 * 
 * @description 
 * 遍历所有考虑因素，返回第一个分数高于或等于默认分数的考虑因素。
 * 如果没有找到合适的考虑因素，则返回默认考虑因素。
 * 
 * @template T 上下文类型
 */
export class FirstScoreReasoner<T> extends Reasoner<T> {
    /**
     * 选择最佳考虑因素
     * @param context 决策上下文
     * @returns 选中的考虑因素
     */
    protected selectBestConsideration(context: T): IConsideration<T> {
        const defaultScore = this.defaultConsideration.getScore(context);
        
        for (let i = 0; i < this._considerations.length; i++) {
            const consideration = this._considerations[i];
            if (consideration && consideration.getScore(context) >= defaultScore) {
                return consideration;
            }
        }

        return this.defaultConsideration;
    }
}
