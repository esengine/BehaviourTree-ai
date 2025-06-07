/**
 * 评估接口
 * 
 * @description
 * 定义评估项的基本契约，用于计算特定上下文下的得分。
 * 
 * @template T 上下文类型
 */
export interface IAppraisal<T> {
    /**
     * 计算评估得分
     * @param context 上下文对象
     * @returns 评估得分，通常在0-1之间
     */
    getScore(context: T): number;
}
