import { EntitySystem, Matcher, Entity, Time } from '@esengine/ecs-framework';
import { BehaviorTreeComponent } from '../components/BehaviorTreeComponent';

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
                const entityMaxTime = this.updateBehaviorTrees(entities, this._fixedTimeStep);
                maxEntityUpdateTime = Math.max(maxEntityUpdateTime, entityMaxTime);
                this._deltaTimeAccumulator -= this._fixedTimeStep;
            }
        } else {
            maxEntityUpdateTime = this.updateBehaviorTrees(entities, deltaTime);
        }

        const totalTime = performance.now() - frameStartTime;
        this.updatePerformanceStats(totalTime, maxEntityUpdateTime);
    }

    private updateBehaviorTrees(entities: Entity[], deltaTime: number): number {
        let maxEntityUpdateTime = 0;
        
        for (const entity of entities) {
            // 检查实体是否激活
            if (!entity.activeInHierarchy) {
                this._performanceStats.skippedEntities++;
                continue;
            }

            const behaviorTreeComp = entity.getComponent(BehaviorTreeComponent);
            
            // 检查组件是否存在并且正在运行
            if (!behaviorTreeComp || !behaviorTreeComp.enabled || !behaviorTreeComp.isRunning) {
                this._performanceStats.skippedEntities++;
                continue;
            }

            // 检查行为树是否存在
            if (!behaviorTreeComp.getBehaviorTree()) {
                this._performanceStats.skippedEntities++;
                continue;
            }

            const entityStartTime = performance.now();
            
            try {
                // 更新行为树
                behaviorTreeComp.updateBehaviorTree(deltaTime);
                this._performanceStats.updatedEntities++;
            } catch (error) {
                console.error(`行为树系统: 更新实体 ${entity.id} (${entity.name || 'Unknown'}) 时发生错误:`, error);
                
                // 停止出错的行为树
                behaviorTreeComp.stop();
                
                // 如果是调试模式，提供更多信息
                if (behaviorTreeComp.debugMode) {
                    console.error(`行为树详细信息:`, {
                        treeName: behaviorTreeComp.treeName,
                        entityId: entity.id,
                        entityName: entity.name,
                        lastStatus: behaviorTreeComp.lastStatus,
                        stats: behaviorTreeComp.stats
                    });
                }
                
                this._performanceStats.skippedEntities++;
            }
            
            const entityUpdateTime = performance.now() - entityStartTime;
            maxEntityUpdateTime = Math.max(maxEntityUpdateTime, entityUpdateTime);
        }
        
        return maxEntityUpdateTime;
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
        return {
            ...this._performanceStats,
            systemSettings: {
                useFixedTimeStep: this._useFixedTimeStep,
                fixedTimeStep: this._fixedTimeStep,
                updateOrder: this.updateOrder,
                enabled: this.enabled
            },
            currentStatus: {
                totalEntities: this.entities.length,
                activeEntities: this.entities.filter(e => e.activeInHierarchy).length,
                runningBehaviorTrees: this.entities.filter(e => {
                    const comp = e.getComponent(BehaviorTreeComponent);
                    return comp && comp.isRunning;
                }).length
            }
        };
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
        // 从ECS框架的Time类获取真实的deltaTime
        return Time.deltaTime || (1/60); // 如果Time.deltaTime为0，使用60FPS作为默认值
    }

    /**
     * 获取所有正在运行的行为树组件
     */
    public getRunningBehaviorTrees(): BehaviorTreeComponent[] {
        return this.entities
            .map(e => e.getComponent(BehaviorTreeComponent))
            .filter(comp => comp && comp.isRunning) as BehaviorTreeComponent[];
    }

    /**
     * 获取指定状态的行为树组件数量
     */
    public getBehaviorTreeCountByStatus(): { running: number; paused: number; stopped: number; error: number } {
        let running = 0, paused = 0, stopped = 0, error = 0;
        
        for (const entity of this.entities) {
            const comp = entity.getComponent(BehaviorTreeComponent);
            if (!comp) continue;
            
            if (comp.isRunning) {
                running++;
            } else if (comp.getBehaviorTree()) {
                paused++;
            } else {
                stopped++;
            }
        }
        
        return { running, paused, stopped, error };
    }

    /**
     * 获取性能问题的行为树（执行时间过长）
     */
    public getSlowBehaviorTrees(thresholdMs: number = 5): Array<{
        component: BehaviorTreeComponent;
        entityId: number;
        lastTickTime: number;
        averageTickTime: number;
    }> {
        return this.entities
            .map(e => e.getComponent(BehaviorTreeComponent))
            .filter(comp => comp && comp.stats.lastTickTime > thresholdMs)
            .map(comp => ({
                component: comp!,
                entityId: comp!.entity.id,
                lastTickTime: comp!.stats.lastTickTime,
                averageTickTime: comp!.stats.averageTickTime
            }));
    }

    /**
     * 批量设置调试模式
     */
    public setDebugMode(enabled: boolean, treeName?: string): number {
        let count = 0;
        for (const entity of this.entities) {
            const comp = entity.getComponent(BehaviorTreeComponent);
            if (comp && (!treeName || comp.treeName === treeName)) {
                comp.debugMode = enabled;
                count++;
            }
        }
        console.log(`行为树系统: ${enabled ? '启用' : '禁用'}调试模式，影响 ${count} 个行为树${treeName ? ` (${treeName})` : ''}`);
        return count;
    }

    /**
     * 获取系统健康状态报告
     */
    public getHealthReport(): {
        overallHealth: 'good' | 'warning' | 'critical';
        issues: string[];
        recommendations: string[];
                 stats: any;
    } {
        const stats = this.getBehaviorTreeStats();
        const issues: string[] = [];
        const recommendations: string[] = [];
        
        // 检查性能问题
        if (stats.maxUpdateTime > 16.67) { // 超过60FPS的帧时间
            issues.push(`最大实体更新时间过长: ${stats.maxUpdateTime.toFixed(2)}ms`);
            recommendations.push('考虑减少行为树复杂度或启用固定时间步长');
        }
        
        if (stats.averageUpdateTime > 10) {
            issues.push(`平均更新时间较高: ${stats.averageUpdateTime.toFixed(2)}ms`);
            recommendations.push('优化行为树节点执行效率');
        }
        
        // 检查跳过率
        const skipRate = stats.totalEntities > 0 ? stats.skippedEntities / stats.totalEntities : 0;
        if (skipRate > 0.5) {
            issues.push(`实体跳过率过高: ${(skipRate * 100).toFixed(1)}%`);
            recommendations.push('检查实体激活状态和行为树配置');
        }
        
        // 检查慢速行为树
        const slowTrees = this.getSlowBehaviorTrees();
        if (slowTrees.length > 0) {
            issues.push(`发现 ${slowTrees.length} 个执行缓慢的行为树`);
            recommendations.push('优化慢速行为树的节点逻辑');
        }
        
        const overallHealth = issues.length === 0 ? 'good' : 
                            issues.length <= 2 ? 'warning' : 'critical';
        
        return {
            overallHealth,
            issues,
            recommendations,
            stats
        };
    }

    public override toString(): string {
        const statusCount = this.getBehaviorTreeCountByStatus();
        return `BehaviorTreeSystem(实体: ${this.entities.length}, 运行中: ${statusCount.running}, 暂停: ${statusCount.paused}, 固定步长: ${this._useFixedTimeStep})`;
    }
} 