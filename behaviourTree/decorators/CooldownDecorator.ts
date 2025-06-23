import { Decorator } from './Decorator';
import { TaskStatus } from '../TaskStatus';

/**
 * 冷却装饰器
 * 
 * @description 在指定时间内阻止子节点重复执行，实现技能冷却等机制
 */
export class CooldownDecorator<T> extends Decorator<T> {
    /** 冷却时间（秒） */
    private cooldownTime: number;
    
    /** 上次执行时间 */
    private lastExecutionTime: number = 0;

    constructor(cooldownTime: number) {
        super();
        this.cooldownTime = cooldownTime;
    }

    public override onStart(): void {
        if (this.child && this.child.onStart) {
            this.child.onStart();
        }
    }

    public update(context: T): TaskStatus {
        const currentTime = performance.now() / 1000;
        
        // 检查是否还在冷却中
        if (currentTime - this.lastExecutionTime < this.cooldownTime) {
            return TaskStatus.Failure; // 还在冷却中
        }
        
        // 执行子节点
        const childResult = this.child ? this.child.update(context) : TaskStatus.Success;
        
        // 如果子节点执行完成（成功或失败），更新最后执行时间
        if (childResult === TaskStatus.Success || childResult === TaskStatus.Failure) {
            this.lastExecutionTime = currentTime;
        }
        
        return childResult;
    }

    public override onEnd(): void {
        if (this.child && this.child.onEnd) {
            this.child.onEnd();
        }
    }

    /**
     * 重置冷却时间
     */
    public resetCooldown(): void {
        this.lastExecutionTime = 0;
    }

    /**
     * 获取剩余冷却时间
     */
    public getRemainingCooldownTime(): number {
        const currentTime = performance.now() / 1000;
        const remaining = this.cooldownTime - (currentTime - this.lastExecutionTime);
        return Math.max(0, remaining);
    }

    /**
     * 检查是否在冷却中
     */
    public isOnCooldown(): boolean {
        return this.getRemainingCooldownTime() > 0;
    }
} 