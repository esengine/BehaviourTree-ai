import { IConsideration } from './IConsideration';
import { IAction } from '../actions/IAction';
import { IAppraisal } from './appraisals/ActionAppraisal';

/**
 * 子项求和考虑因素
 * 
 * @description
 * 通过总结所有子项评估的分数来计算最终得分。
 * 适用于需要综合多个因素进行决策的场景。
 * 
 * @template T 上下文类型
 * 
 * @example
 * ```typescript
 * const consideration = new SumOfChildrenConsideration<GameContext>();
 * consideration.addAppraisal(new HealthAppraisal());
 * consideration.addAppraisal(new DistanceAppraisal());
 * consideration.action = new AttackAction();
 * 
 * const score = consideration.getScore(gameContext);
 * ```
 */
export class SumOfChildrenConsideration<T> implements IConsideration<T> {
    /** 关联的动作 */
    public action!: IAction<T>;
    
    /** 子评估器列表 */
    private _appraisals: Array<IAppraisal<T>> = [];

    /**
     * 计算总分数
     * @param context 决策上下文
     * @returns 所有子评估器分数的总和
     */
    public getScore(context: T): number {
        let score = 0;
        for (let i = 0; i < this._appraisals.length; i++) {
            const appraisal = this._appraisals[i];
            if (appraisal) {
                score += appraisal.getScore(context);
            }
        }
        return score;
    }

    /**
     * 添加评估器
     * @param appraisal 要添加的评估器
     * @returns 返回自身以支持链式调用
     */
    public addAppraisal(appraisal: IAppraisal<T>): SumOfChildrenConsideration<T> {
        if (appraisal == null) {
            throw new Error('评估器不能为null或undefined');
        }
        
        this._appraisals.push(appraisal);
        return this;
    }

    /**
     * 移除指定的评估器
     * @param appraisal 要移除的评估器
     * @returns 是否成功移除
     */
    public removeAppraisal(appraisal: IAppraisal<T>): boolean {
        const index = this._appraisals.indexOf(appraisal);
        if (index !== -1) {
            this._appraisals.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * 清空所有评估器
     */
    public clearAppraisals(): void {
        this._appraisals.length = 0;
    }

    /**
     * 获取评估器数量
     * @returns 当前评估器的数量
     */
    public getAppraisalCount(): number {
        return this._appraisals.length;
    }

    /**
     * 获取所有评估器的只读副本
     * @returns 评估器数组的副本
     */
    public getAppraisals(): ReadonlyArray<IAppraisal<T>> {
        return [...this._appraisals];
    }
}
