import { EntitySystem, Matcher, Entity } from '@esengine/ecs-framework';
import { BehaviorTreeComponent } from '../components/BehaviorTreeComponent.js';

/**
 * 行为树系统
 * 负责更新所有具有行为树组件的实体的行为树
 */
export class BehaviorTreeSystem extends EntitySystem {
    private _deltaTimeAccumulator: number = 0;
    private _fixedTimeStep: number = 1/60; // 60 FPS
    private _useFixedTimeStep: boolean = false;
    
    private readonly _performanceStats = {
        totalEntities: 0,
        updatedEntities: 0,
        skippedEntities: 0,
        averageUpdateTime: 0,
        maxUpdateTime: 0,
        totalUpdateTime: 0,
        lastFrameUpdateTime: 0,
        frameCount: 0
    };

    constructor(useFixedTimeStep: boolean = false, fixedTimeStep: number = 1/60) {
        super(Matcher.empty().all(BehaviorTreeComponent));
        this._useFixedTimeStep = useFixedTimeStep;
        this._fixedTimeStep = fixedTimeStep;
    }

    protected override process(entities: Entity[]): void {
        const frameStartTime = performance.now();
        const deltaTime = this.getDeltaTime();
        
        this._performanceStats.totalEntities = entities.length;
        this._performanceStats.updatedEntities = 0;
        this._performanceStats.skippedEntities = 0;
        this._performanceStats.frameCount++;
        
        let maxEntityUpdateTime = 0;

        if (this._useFixedTimeStep) {
            this._deltaTimeAccumulator += deltaTime;
            
            while (this._deltaTimeAccumulator >= this._fixedTimeStep) {
                this.updateBehaviorTrees(entities, this._fixedTimeStep, maxEntityUpdateTime);
                this._deltaTimeAccumulator -= this._fixedTimeStep;
            }
        } else {
            this.updateBehaviorTrees(entities, deltaTime, maxEntityUpdateTime);
        }

        const totalTime = performance.now() - frameStartTime;
        this.updatePerformanceStats(totalTime, maxEntityUpdateTime);
    }

    private updateBehaviorTrees(entities: Entity[], deltaTime: number, maxEntityUpdateTime: number): void {
        for (const entity of entities) {
            if (!entity.activeInHierarchy) {
                this._performanceStats.skippedEntities++;
                continue;
            }

            const behaviorTreeComp = entity.getComponent(BehaviorTreeComponent);
            if (!behaviorTreeComp || !behaviorTreeComp.isRunning) {
                this._performanceStats.skippedEntities++;
                continue;
            }

            const entityStartTime = performance.now();
            
            try {
                behaviorTreeComp.updateBehaviorTree(deltaTime);
                this._performanceStats.updatedEntities++;
            } catch (error) {
                console.error(`行为树系统: 更新实体 ${entity.id} 时发生错误:`, error);
                behaviorTreeComp.stop();
            }
            
            const entityUpdateTime = performance.now() - entityStartTime;
            maxEntityUpdateTime = Math.max(maxEntityUpdateTime, entityUpdateTime);
        }
    }

    private updatePerformanceStats(totalTime: number, maxEntityTime: number): void {
        this._performanceStats.totalUpdateTime = totalTime;
        this._performanceStats.maxUpdateTime = maxEntityTime;
        this._performanceStats.lastFrameUpdateTime = totalTime;
        
        // 计算平均更新时间（滑动平均）
        const alpha = 0.1; // 平滑因子
        this._performanceStats.averageUpdateTime = 
            this._performanceStats.averageUpdateTime * (1 - alpha) + totalTime * alpha;
    }

    /**
     * 获取行为树系统的性能统计信息
     */
    public getBehaviorTreeStats() {
        return Object.assign({}, this._performanceStats);
    }

    /**
     * 获取详细的性能报告
     */
    public getDetailedPerformanceReport() {
        const entities = this.entities;
        const behaviorTreeComponents = entities
            .map(e => e.getComponent(BehaviorTreeComponent))
            .filter(c => c !== null) as BehaviorTreeComponent[];

        const componentReports = behaviorTreeComponents.map(comp => comp.getPerformanceReport());
        
        return {
            systemStats: this.getBehaviorTreeStats(),
            totalBehaviorTrees: behaviorTreeComponents.length,
            runningBehaviorTrees: behaviorTreeComponents.filter(c => c.isRunning).length,
            componentReports: componentReports,
            systemSettings: {
                useFixedTimeStep: this._useFixedTimeStep,
                fixedTimeStep: this._fixedTimeStep,
                updateOrder: this.updateOrder
            }
        };
    }

    /**
     * 重置性能统计
     */
    public resetPerformanceStats(): void {
        this._performanceStats.totalEntities = 0;
        this._performanceStats.updatedEntities = 0;
        this._performanceStats.skippedEntities = 0;
        this._performanceStats.averageUpdateTime = 0;
        this._performanceStats.maxUpdateTime = 0;
        this._performanceStats.totalUpdateTime = 0;
        this._performanceStats.lastFrameUpdateTime = 0;
        this._performanceStats.frameCount = 0;
    }

    /**
     * 暂停所有行为树
     */
    public pauseAll(): void {
        for (const entity of this.entities) {
            const behaviorTreeComp = entity.getComponent(BehaviorTreeComponent);
            behaviorTreeComp?.pause();
        }
        console.log(`行为树系统: 已暂停 ${this.entities.length} 个实体的行为树`);
    }

    /**
     * 恢复所有行为树
     */
    public resumeAll(): void {
        for (const entity of this.entities) {
            const behaviorTreeComp = entity.getComponent(BehaviorTreeComponent);
            behaviorTreeComp?.resume();
        }
        console.log(`行为树系统: 已恢复 ${this.entities.length} 个实体的行为树`);
    }

    /**
     * 停止所有行为树
     */
    public stopAll(): void {
        for (const entity of this.entities) {
            const behaviorTreeComp = entity.getComponent(BehaviorTreeComponent);
            behaviorTreeComp?.stop();
        }
        console.log(`行为树系统: 已停止 ${this.entities.length} 个实体的行为树`);
    }

    /**
     * 启动所有行为树
     */
    public startAll(): void {
        for (const entity of this.entities) {
            const behaviorTreeComp = entity.getComponent(BehaviorTreeComponent);
            if (behaviorTreeComp && behaviorTreeComp.getBehaviorTree()) {
                behaviorTreeComp.start();
            }
        }
        console.log(`行为树系统: 已启动 ${this.entities.length} 个实体的行为树`);
    }

    /**
     * 获取指定实体的行为树组件
     */
    public getBehaviorTreeComponent(entityId: number): BehaviorTreeComponent | null {
        const entity = this.entities.find(e => e.id === entityId);
        return entity?.getComponent(BehaviorTreeComponent) || null;
    }

    /**
     * 根据树名称查找行为树组件
     */
    public findBehaviorTreesByName(treeName: string): BehaviorTreeComponent[] {
        const results: BehaviorTreeComponent[] = [];
        for (const entity of this.entities) {
            const comp = entity.getComponent(BehaviorTreeComponent);
            if (comp && comp.treeName === treeName) {
                results.push(comp);
            }
        }
        return results;
    }

    /**
     * 设置固定时间步长模式
     */
    public setFixedTimeStep(enabled: boolean, timeStep: number = 1/60): void {
        this._useFixedTimeStep = enabled;
        this._fixedTimeStep = timeStep;
        this._deltaTimeAccumulator = 0;
        
        console.log(`行为树系统: 固定时间步长模式 ${enabled ? '启用' : '禁用'}, 时间步长: ${timeStep}`);
    }

    /**
     * 获取系统的DeltaTime（从ECS框架获取）
     */
    private getDeltaTime(): number {
        // 这里可以从ECS框架的Time类获取deltaTime
        // 暂时使用简单的计算方式
        return 1/60; // 假设60FPS
    }

    public override toString(): string {
        return `BehaviorTreeSystem(实体: ${this.entities.length}, 运行中: ${this._performanceStats.updatedEntities}, 固定步长: ${this._useFixedTimeStep})`;
    }
} 