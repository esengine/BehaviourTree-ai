import { Decorator } from './Decorator';
import { TaskStatus } from '../TaskStatus';

/**
 * 超时装饰器
 * 
 * @description 如果子节点执行时间超过指定限制，则强制返回失败状态
 */
export class TimeoutDecorator<T> extends Decorator<T> {
    /** 超时时间（秒） */
    private timeoutDuration: number;
    
    /** 开始执行时间 */
    private startTime: number = 0;
    
    /** 是否已开始执行 */
    private hasStarted: boolean = false;

    constructor(timeoutDuration: number) {
        super();
        this.timeoutDuration = timeoutDuration;
    }

    public override onStart(): void {
        this.startTime = performance.now() / 1000;
        this.hasStarted = true;
        
        if (this.child && this.child.onStart) {
            this.child.onStart();
        }
    }

    public update(context: T): TaskStatus {
        if (!this.hasStarted) {
            return TaskStatus.Failure;
        }
        
        const currentTime = performance.now() / 1000;
        const elapsedTime = currentTime - this.startTime;
        
        // 检查是否超时
        if (elapsedTime >= this.timeoutDuration) {
            console.warn(`TimeoutDecorator: 子节点执行超时 (${elapsedTime.toFixed(2)}s >= ${this.timeoutDuration}s)`);
            return TaskStatus.Failure; // 超时失败
        }
        
        // 执行子节点
        const childResult = this.child ? this.child.update(context) : TaskStatus.Success;
        
        // 如果子节点完成，重置状态
        if (childResult !== TaskStatus.Running) {
            this.hasStarted = false;
        }
        
        return childResult;
    }

    public override onEnd(): void {
        this.hasStarted = false;
        
        if (this.child && this.child.onEnd) {
            this.child.onEnd();
        }
    }

    /**
     * 获取剩余时间
     */
    public getRemainingTime(): number {
        if (!this.hasStarted) {
            return this.timeoutDuration;
        }
        
        const currentTime = performance.now() / 1000;
        const elapsedTime = currentTime - this.startTime;
        return Math.max(0, this.timeoutDuration - elapsedTime);
    }

    /**
     * 获取已执行时间
     */
    public getElapsedTime(): number {
        if (!this.hasStarted) {
            return 0;
        }
        
        const currentTime = performance.now() / 1000;
        return currentTime - this.startTime;
    }

    /**
     * 检查是否已超时
     */
    public isTimedOut(): boolean {
        return this.getRemainingTime() <= 0;
    }
} 