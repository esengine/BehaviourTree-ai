import { IAction } from '../actions/IAction';

/**
 * 封装一个Action并生成一个分数，Reasoner可以使用该分数来决定使用哪个代价
 */
export interface IConsideration<T> {
    action: IAction<T>;
    getScore(context: T): number;
}
