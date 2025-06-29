import { Entity } from '@esengine/ecs-framework';
import { ECSBehaviorTreeBuilder } from '../builders/ECSBehaviorTreeBuilder';
import { BehaviorTreeComponent } from '../components/BehaviorTreeComponent';
import { BehaviorTreeBuilder, BehaviorTreeJSONConfig } from '../../behaviourTree/BehaviorTreeBuilder';

/**
 * 行为树工厂
 * 提供行为树组件的创建和管理方法
 */
export class BehaviorTreeFactory {

    /**
     * 从JSON配置为实体添加行为树
     * @param entity 目标实体
     * @param config JSON配置对象
     * @param options 配置选项
     */
    public static addBehaviorTreeFromConfig(
        entity: Entity,
        config: BehaviorTreeJSONConfig,
        options: {
            updateInterval?: number;
            autoStart?: boolean;
            debugMode?: boolean;
            treeName?: string;
        } = {}
    ): BehaviorTreeComponent {
        try {
            // 验证配置
            this.validateBehaviorTreeConfig(config);
            
            // 使用BehaviorTreeBuilder构建行为树
            const executionContext: any = entity;
            const result = BehaviorTreeBuilder.fromBehaviorTreeConfig(config, executionContext);

            // 添加组件
            const behaviorTreeComp = entity.addComponent(new BehaviorTreeComponent());
            behaviorTreeComp.setBehaviorTree(result.tree as any);
            behaviorTreeComp.updateInterval = options.updateInterval || config.metadata?.updatePeriod || 0.1;
            behaviorTreeComp.debugMode = options.debugMode || false;
            behaviorTreeComp.treeName = options.treeName || config.metadata?.name || `Tree_${entity.name}`;

            if (options.autoStart !== false) {
                behaviorTreeComp.start();
            }

            return behaviorTreeComp;

        } catch (error) {
            throw new Error(`为实体添加行为树失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 验证行为树配置
     */
    private static validateBehaviorTreeConfig(config: BehaviorTreeJSONConfig): void {
        if (!config) {
            throw new Error('配置为空');
        }

        if (!config.nodes || !Array.isArray(config.nodes)) {
            throw new Error('配置必须包含nodes数组');
        }

        if (config.nodes.length === 0) {
            throw new Error('nodes数组不能为空');
        }

        // 检查是否有根节点
        const rootNodes = config.nodes.filter(node =>
            !config.nodes.some(parent =>
                parent.children && parent.children.includes(node.id)
            )
        );

        if (rootNodes.length === 0) {
            throw new Error('找不到根节点');
        }



        // 验证节点引用
        for (const node of config.nodes) {
            if (node.children) {
                for (const childId of node.children) {
                    if (!config.nodes.find(n => n.id === childId)) {
                        throw new Error(`节点 ${node.id} 引用了不存在的子节点 ${childId}`);
                    }
                }
            }
        }
    }

    /**
     * 批量为多个实体添加行为树
     */
    public static addBehaviorTreeToEntities(
        entities: Entity[],
        config: BehaviorTreeJSONConfig,
        options: {
            updateInterval?: number;
            autoStart?: boolean;
            debugMode?: boolean;
            treeNamePrefix?: string;
        } = {}
    ): BehaviorTreeComponent[] {
        const results: BehaviorTreeComponent[] = [];

        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            try {
                const component = this.addBehaviorTreeFromConfig(entity, config, {
                    ...options,
                    treeName: `${options.treeNamePrefix || 'Tree'}_${entity.name}_${i + 1}`
                });
                results.push(component);
            } catch (error) {
                // 继续处理其他实体，不中断整个批处理
                continue;
            }
        }

        return results;
    }

    /**
     * 为实体添加行为树（代码构建）
     * @param entity 目标实体
     * @param treeBuilder 行为树构建函数
     * @param options 配置选项
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
     * 移除实体的行为树组件
     * @param entity 目标实体
     */
    public static removeBehaviorTree(entity: Entity): void {
        const component = entity.getComponent(BehaviorTreeComponent);
        if (component) {
            component.stop();
            entity.removeComponent(component);
        }
    }

    /**
     * 获取实体的行为树组件
     * @param entity 目标实体
     */
    public static getBehaviorTreeComponent(entity: Entity): BehaviorTreeComponent | null {
        return entity.getComponent(BehaviorTreeComponent);
    }
}
