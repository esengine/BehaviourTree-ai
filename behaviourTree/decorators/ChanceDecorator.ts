import { Decorator } from './Decorator';
import { TaskStatus } from '../TaskStatus';

/**
 * 概率装饰器
 * 
 * @description 以指定概率执行子节点，用于实现随机性行为
 */
export class ChanceDecorator<T> extends Decorator<T> {
    /** 成功概率（0.0 - 1.0） */
    private successChance: number;

    constructor(successChance: number) {
        super();
        this.successChance = Math.max(0, Math.min(1, successChance)); // 确保在0-1范围内
    }

    public override onStart(): void {
        if (this.child && this.child.onStart) {
            this.child.onStart();
        }
    }

    public update(context: T): TaskStatus {
        // 进行概率检查
        const random = Math.random();
        
        if (random > this.successChance) {
            // 概率检查失败，不执行子节点
            return TaskStatus.Failure;
        }
        
        // 概率检查成功，执行子节点
        return this.child ? this.child.update(context) : TaskStatus.Success;
    }

    public override onEnd(): void {
        if (this.child && this.child.onEnd) {
            this.child.onEnd();
        }
    }

    /**
     * 设置成功概率
     */
    public setSuccessChance(chance: number): void {
        this.successChance = Math.max(0, Math.min(1, chance));
    }

    /**
     * 获取成功概率
     */
    public getSuccessChance(): number {
        return this.successChance;
    }

    /**
     * 获取成功概率百分比
     */
    public getSuccessChancePercentage(): number {
        return this.successChance * 100;
    }
} 