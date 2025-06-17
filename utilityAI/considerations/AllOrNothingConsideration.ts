import { IConsideration } from './IConsideration.js';
import { IAction } from '../actions/IAction.js';
import { IAppraisal } from './appraisals/IAppraisal.js';

/**
 * 全或无考量器
 * 
 * @description
 * 只有当所有评估项的得分都高于阈值时才返回总分，否则返回0。
 * 适用于需要满足多个前置条件的行为选择。
 * 
 * @template T 上下文类型
 */
export class AllOrNothingConsideration<T> implements IConsideration<T> {
    /** 阈值，所有评估项必须超过此值 */
    public threshold: number;
    
    /** 关联的行为 */
    public action!: IAction<T>;
    
    /** 评估项列表 */
    private _appraisals: IAppraisal<T>[] = [];

    /**
     * 创建全或无考量器
     * @param threshold 阈值，默认为0
     */
    constructor(threshold: number = 0) {
        this.threshold = threshold;
    }

    /**
     * 添加评估项
     * @param appraisal 评估项
     * @returns 返回自身以支持链式调用
     */
    public addAppraisal(appraisal: IAppraisal<T>): this {
        this._appraisals.push(appraisal);
        return this;
    }

    /**
     * 计算考量得分
     * @param context 上下文
     * @returns 如果所有评估项都超过阈值则返回总分，否则返回0
     */
    public getScore(context: T): number {
        if (this._appraisals.length === 0) {
            return 0;
        }

        let sum = 0;
        const length = this._appraisals.length;
        
        // 优化：使用缓存长度和提前退出
        for (let i = 0; i < length; i++) {
            const score = this._appraisals[i]!.getScore(context);
            if (score < this.threshold) {
                return 0; // 提前退出
            }
            sum += score;
        }

        return sum;
    }

    /**
     * 获取评估项数量
     */
    public get appraisalCount(): number {
        return this._appraisals.length;
    }

    /**
     * 清空所有评估项
     */
    public clearAppraisals(): void {
        this._appraisals.length = 0;
    }
}
