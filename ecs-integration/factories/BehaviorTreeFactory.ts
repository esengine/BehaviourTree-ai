import { Entity, Component } from '@esengine/ecs-framework';
import { ECSBehaviorTreeBuilder } from '../builders/ECSBehaviorTreeBuilder';
import { BehaviorTreeComponent } from '../components/BehaviorTreeComponent';
import { TaskStatus } from '../../behaviourTree/TaskStatus';

/**
 * 组件类型定义
 */
type ComponentType<T extends Component = Component> = new (...args: any[]) => T;

/**
 * 行为树工厂
 * 提供常用的行为树模板和快速创建方法
 */
export class BehaviorTreeFactory {
    
    /**
     * 为实体快速添加行为树
     */
    public static addBehaviorTreeToEntity(
        entity: Entity,
        treeBuilder: (builder: ECSBehaviorTreeBuilder) => ECSBehaviorTreeBuilder,
        options: {
            updateInterval?: number;
            autoStart?: boolean;
            debugMode?: boolean;
            treeName?: string;
        } = {}
    ): BehaviorTreeComponent {
        const builder = new ECSBehaviorTreeBuilder(entity);
        const configuredBuilder = treeBuilder(builder);
        const tree = configuredBuilder.buildECSTree(options.updateInterval || 0.1);
        
        const behaviorTreeComp = entity.addComponent(new BehaviorTreeComponent());
        behaviorTreeComp.setBehaviorTree(tree);
        behaviorTreeComp.updateInterval = options.updateInterval || 0.1;
        behaviorTreeComp.debugMode = options.debugMode || false;
        behaviorTreeComp.treeName = options.treeName || `Tree_${entity.name}`;
        
        if (options.autoStart !== false) {
            behaviorTreeComp.start();
        }
        
        return behaviorTreeComp;
    }

    /**
     * 创建简单的巡逻行为树
     */
    public static createPatrolBehavior(
        waypoints: { x: number, y: number }[],
        speed: number = 100,
        waitTime: number = 1.0
    ): (builder: ECSBehaviorTreeBuilder) => ECSBehaviorTreeBuilder {
        let currentWaypointIndex = 0;
        
        return (builder) => {
            return builder
                .selector()
                    .sequence()
                        .action((entity: Entity) => {
                            const waypoint = waypoints[currentWaypointIndex];
                            console.log(`实体 ${entity.id} 移动到巡逻点 ${currentWaypointIndex}: (${waypoint.x}, ${waypoint.y})`);
                            
                            // 这里可以实现实际的移动逻辑
                            // 例如：获取PositionComponent并移动
                            
                            return TaskStatus.Success;
                        })
                        .waitAction(waitTime)
                        .action((entity: Entity) => {
                            // 切换到下一个巡逻点
                            currentWaypointIndex = (currentWaypointIndex + 1) % waypoints.length;
                            return TaskStatus.Success;
                        })
                    .endComposite()
                .endComposite() as ECSBehaviorTreeBuilder;
        };
    }

    /**
     * 创建简单的追击行为树
     */
    public static createChaseTargetBehavior(
        targetTag: number,
        chaseRange: number = 200
    ): (builder: ECSBehaviorTreeBuilder) => ECSBehaviorTreeBuilder {
        return (builder) => {
            return builder
                .action((entity: Entity) => {
                    console.log(`实体 ${entity.id} 正在执行追击行为，目标标签: ${targetTag}`);
                    return TaskStatus.Success;
                }) as ECSBehaviorTreeBuilder;
        };
    }

    /**
     * 创建生命值监控行为树
     */
    public static createHealthMonitoring<T extends Component>(
        healthComponentType: ComponentType<T>,
        lowHealthThreshold: number = 30
    ): (builder: ECSBehaviorTreeBuilder) => ECSBehaviorTreeBuilder {
        return (builder) => {
            return builder
                .action((entity: Entity) => {
                    console.log(`实体 ${entity.id} 正在监控生命值`);
                    return TaskStatus.Success;
                }) as ECSBehaviorTreeBuilder;
        };
    }
}
