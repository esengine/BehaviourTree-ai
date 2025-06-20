import { IConsideration } from './IConsideration';
import { IAction } from '../actions/IAction';
import { IAppraisal } from './appraisals/ActionAppraisal';

/**
 * 阈值考虑因素
 * 
 * @description
 * 通过总结子项评估得分，直到某个子项得分低于阈值时停止计算。
 * 适用于需要"全部满足最低要求"的决策场景。
 * 
 * @template T 上下文类型
 * 
 * @example
 * ```typescript
 * // 只有当所有条件都满足最低要求时才继续
 * const consideration = new ThresholdConsideration<GameContext>(0.5);
 * consideration.addAppraisal(new HealthAppraisal()); // 必须>0.5
 * consideration.addAppraisal(new AmmoAppraisal());   // 必须>0.5
 * consideration.action = new AttackAction();
 * 
 * const score = consideration.getScore(gameContext);
 * ```
 */
export class ThresholdConsideration<T> implements IConsideration<T> {
    /** 阈值，低于此值将停止计算 */
    public threshold: number;
    
    /** 关联的动作 */
    public action!: IAction<T>;
    
    /** 子评估器列表 */
    private _appraisals: Array<IAppraisal<T>> = [];

    /**
     * 创建阈值考虑因素
     * @param threshold 阈值，必须是有效数字
     * @throws {Error} 当threshold不是有效数字时抛出错误
     */
    public constructor(threshold: number) {
        if (typeof threshold !== 'number' || isNaN(threshold)) {
            throw new Error('阈值必须是有效数字');
        }
        
        this.threshold = threshold;
    }

    /**
     * 计算分数，直到遇到低于阈值的评估器
     * @param context 决策上下文
     * @returns 累计分数，如果某个评估器低于阈值则提前返回
     */
    public getScore(context: T): number {
        let sum = 0;
        
        for (let i = 0; i < this._appraisals.length; i++) {
            const appraisal = this._appraisals[i];
            if (!appraisal) continue;
            
            const score = appraisal.getScore(context);
            
            // 如果分数低于阈值，立即返回当前累计分数
            if (score < this.threshold) {
                return sum;
            }
            
            sum += score;
        }

        return sum;
    }

    /**
     * 添加评估器
     * @param appraisal 要添加的评估器
     * @returns 返回自身以支持链式调用
     */
    public addAppraisal(appraisal: IAppraisal<T>): ThresholdConsideration<T> {
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

    /**
     * 设置新的阈值
     * @param newThreshold 新的阈值
     * @throws {Error} 当newThreshold不是有效数字时抛出错误
     */
    public setThreshold(newThreshold: number): void {
        if (typeof newThreshold !== 'number' || isNaN(newThreshold)) {
            throw new Error('阈值必须是有效数字');
        }
        
        this.threshold = newThreshold;
    }

    /**
     * 检查所有评估器是否都满足阈值要求
     * @param context 决策上下文
     * @returns 是否所有评估器都满足阈值
     */
    public allMeetThreshold(context: T): boolean {
        for (let i = 0; i < this._appraisals.length; i++) {
            const appraisal = this._appraisals[i];
            if (appraisal && appraisal.getScore(context) < this.threshold) {
                return false;
            }
        }
        return true;
    }
}
