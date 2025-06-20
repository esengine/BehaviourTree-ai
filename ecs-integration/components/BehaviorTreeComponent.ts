import { Component, Entity } from '@esengine/ecs-framework';
import { BehaviorTree } from '../../behaviourTree/BehaviorTree';
import { TaskStatus } from '../../behaviourTree/TaskStatus';

/**
 * 行为树组件
 * 将行为树功能集成到ECS实体中
 */
export class BehaviorTreeComponent extends Component {
    private _behaviorTree: BehaviorTree<Entity> | null = null;
    private _isRunning: boolean = false;
    private _lastStatus: TaskStatus = TaskStatus.Invalid;
    private _pausedTime: number = 0;
    private _totalRunTime: number = 0;
    
    /** 行为树更新间隔（秒），0表示每帧更新 */
    public updateInterval: number = 0.1;
    
    /** 是否启用调试模式 */
    public debugMode: boolean = false;
    
    /** 行为树名称（用于调试） */
    public treeName: string = '';
    
    /** 执行统计信息 */
    public readonly stats = {
        totalTicks: 0,
        successCount: 0,
        failureCount: 0,
        runningCount: 0,
        averageTickTime: 0,
        lastTickTime: 0
    };

    /**
     * 设置行为树
     */
    public setBehaviorTree(tree: BehaviorTree<Entity>): void {
        if (this._behaviorTree) {
            this._behaviorTree.reset();
        }
        this._behaviorTree = tree;
        this._behaviorTree.setContext(this.entity);
        this._lastStatus = TaskStatus.Invalid;
        this.resetStats();
    }

    /**
     * 获取行为树
     */
    public getBehaviorTree(): BehaviorTree<Entity> | null {
        return this._behaviorTree;
    }

    /**
     * 启动行为树
     */
    public start(): void {
        if (this._behaviorTree && !this._isRunning) {
            this._isRunning = true;
            this._behaviorTree.reset();
            
            if (this.debugMode) {
                console.log(`[${this.treeName}] 行为树启动 - 实体ID: ${this.entity.id}`);
            }
        }
    }

    /**
     * 停止行为树
     */
    public stop(): void {
        this._isRunning = false;
        if (this._behaviorTree) {
            this._behaviorTree.reset();
        }
        
        if (this.debugMode) {
            console.log(`[${this.treeName}] 行为树停止 - 实体ID: ${this.entity.id}`);
        }
    }

    /**
     * 暂停行为树
     */
    public pause(): void {
        if (this._isRunning) {
            this._isRunning = false;
            this._pausedTime = performance.now();
            
            if (this.debugMode) {
                console.log(`[${this.treeName}] 行为树暂停 - 实体ID: ${this.entity.id}`);
            }
        }
    }

    /**
     * 恢复行为树
     */
    public resume(): void {
        if (!this._isRunning && this._behaviorTree) {
            this._isRunning = true;
            if (this._pausedTime > 0) {
                this._totalRunTime += performance.now() - this._pausedTime;
                this._pausedTime = 0;
            }
            
            if (this.debugMode) {
                console.log(`[${this.treeName}] 行为树恢复 - 实体ID: ${this.entity.id}`);
            }
        }
    }

    /**
     * 获取运行状态
     */
    public get isRunning(): boolean {
        return this._isRunning && this.enabled && this.entity.activeInHierarchy;
    }

    /**
     * 获取最后执行状态
     */
    public get lastStatus(): TaskStatus {
        return this._lastStatus;
    }

    /**
     * 获取总运行时间（毫秒）
     */
    public get totalRunTime(): number {
        return this._totalRunTime + (this._isRunning ? performance.now() - this._pausedTime : 0);
    }

    /**
     * 更新行为树（由BehaviorTreeSystem调用）
     */
    public updateBehaviorTree(deltaTime: number): void {
        if (!this._behaviorTree || !this.isRunning) {
            return;
        }

        const tickStartTime = performance.now();

        try {
            // 确保上下文是最新的
            this._behaviorTree.setContext(this.entity);
            
            // 执行行为树
            this._behaviorTree.tick(deltaTime);
            this._lastStatus = this._behaviorTree.getRoot().status;

            // 更新统计信息
            this.updateStats(tickStartTime);

            if (this.debugMode) {
                console.log(`[${this.treeName}] 实体 ${this.entity.id}: ${TaskStatus[this._lastStatus]} (${this.stats.lastTickTime.toFixed(2)}ms)`);
            }
        } catch (error) {
            console.error(`行为树执行错误 [${this.treeName}] 实体 ${this.entity.id}:`, error);
            this._lastStatus = TaskStatus.Failure;
            this.stats.failureCount++;
        }
    }

    /**
     * 更新统计信息
     */
    private updateStats(startTime: number): void {
        const tickTime = performance.now() - startTime;
        this.stats.totalTicks++;
        this.stats.lastTickTime = tickTime;
        this.stats.averageTickTime = 
            (this.stats.averageTickTime * (this.stats.totalTicks - 1) + tickTime) / this.stats.totalTicks;

        switch (this._lastStatus) {
            case TaskStatus.Success:
                this.stats.successCount++;
                break;
            case TaskStatus.Failure:
                this.stats.failureCount++;
                break;
            case TaskStatus.Running:
                this.stats.runningCount++;
                break;
        }
    }

    /**
     * 重置统计信息
     */
    public resetStats(): void {
        this.stats.totalTicks = 0;
        this.stats.successCount = 0;
        this.stats.failureCount = 0;
        this.stats.runningCount = 0;
        this.stats.averageTickTime = 0;
        this.stats.lastTickTime = 0;
        this._totalRunTime = 0;
        this._pausedTime = 0;
    }

    /**
     * 获取详细的性能统计信息
     */
    public getPerformanceReport() {
        return {
            treeName: this.treeName,
            entityId: this.entity.id,
            isRunning: this.isRunning,
            lastStatus: TaskStatus[this._lastStatus],
            totalRunTime: this.totalRunTime,
            stats: Object.assign({}, this.stats),
            behaviorTreeStats: this._behaviorTree?.getStats()
        };
    }

    public override onAddedToEntity(): void {
        super.onAddedToEntity();
        this.treeName = this.treeName || `BehaviorTree_${this.entity.name}_${this.entity.id}`;
        
        if (this.debugMode) {
            console.log(`[${this.treeName}] 行为树组件添加到实体 ${this.entity.id}`);
        }
    }

    public override onRemovedFromEntity(): void {
        this.stop();
        if (this.debugMode) {
            console.log(`[${this.treeName}] 行为树组件从实体 ${this.entity.id} 移除`);
        }
        super.onRemovedFromEntity();
    }

    public override onEnabled(): void {
        super.onEnabled();
        if (this._behaviorTree && this.debugMode) {
            console.log(`[${this.treeName}] 行为树组件启用 - 实体 ${this.entity.id}`);
        }
    }

    public override onDisabled(): void {
        if (this.debugMode) {
            console.log(`[${this.treeName}] 行为树组件禁用 - 实体 ${this.entity.id}`);
        }
        super.onDisabled();
    }
} 