// ECS集成模块总导出

// 重新导出原始行为树模块
export * from '../behaviourTree/index';

// 导出ECS集成组件
export { BehaviorTreeComponent } from './components/BehaviorTreeComponent';

// 导出ECS集成系统
export { BehaviorTreeSystem } from './systems/BehaviorTreeSystem';

// 导出ECS特化的行为树节点
export * from './behaviors/ECSBehaviors';

// 导出ECS行为树构建器
export { ECSBehaviorTreeBuilder } from './builders/ECSBehaviorTreeBuilder';

// 导出行为树工厂
export { BehaviorTreeFactory } from './factories/BehaviorTreeFactory';

/**
 * ECS集成模块使用说明：
 * 
 * 1. 添加行为树系统到场景：
 *    const behaviorTreeSystem = new BehaviorTreeSystem();
 *    scene.addEntityProcessor(behaviorTreeSystem);
 * 
 * 2. 为实体添加行为树：
 *    const entity = new Entity("AI", 1);
 *    BehaviorTreeFactory.addBehaviorTreeToEntity(entity, (builder) => {
 *        return builder
 *            .selector()
 *                .action((entity) => {
 *                    console.log("AI正在思考...");
 *                    return TaskStatus.Success;
 *                })
 *            .endComposite();
 *    });
 * 
 * 3. 使用预制行为树模板：
 *    BehaviorTreeFactory.addBehaviorTreeToEntity(
 *        entity, 
 *        BehaviorTreeFactory.createPatrolBehavior([
 *            { x: 0, y: 0 },
 *            { x: 100, y: 0 },
 *            { x: 100, y: 100 }
 *        ])
 *    );
 * 
 * 4. 自定义行为树节点：
 *    const builder = new ECSBehaviorTreeBuilder(entity);
 *    const tree = builder
 *        .hasComponent(SomeComponent)
 *        .modifyComponent(SomeComponent, (comp) => comp.value += 1)
 *        .buildECSTree();
 */ 