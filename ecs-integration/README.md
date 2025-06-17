# ECS框架与行为树深度集成

这个模块为 [@esengine/ecs-framework](https://www.npmjs.com/package/@esengine/ecs-framework) 提供了完整的行为树集成功能。

## 特性

- 🎯 **完全集成**: 专为ECS架构设计的行为树系统
- 🚀 **高性能**: 支持固定时间步长、性能监控和优化
- 🔧 **易于使用**: 提供构建器模式和工厂方法，简化创建过程
- 📊 **调试友好**: 内置调试模式和性能统计
- 🎨 **灵活扩展**: 支持自定义行为节点和组合行为

## 快速开始

### 1. 安装依赖

```bash
npm install @esengine/ecs-framework
```

### 2. 基础设置

```typescript
import { Scene, Entity, Component } from '@esengine/ecs-framework';
import { 
    BehaviorTreeSystem, 
    BehaviorTreeFactory 
} from './ecs-integration';

// 创建场景和系统
const scene = new Scene();
const behaviorTreeSystem = new BehaviorTreeSystem();
scene.addEntityProcessor(behaviorTreeSystem);
```

### 3. 创建AI实体

```typescript
// 创建实体
const entity = new Entity("AI", 1);

// 添加行为树
BehaviorTreeFactory.addBehaviorTreeToEntity(
    entity,
    (builder) => {
        return builder
            .action((entity) => {
                console.log(`${entity.name} 正在思考...`);
                return TaskStatus.Success;
            });
    },
    {
        updateInterval: 0.5,
        debugMode: true,
        autoStart: true
    }
);

scene.addEntity(entity);
```

### 4. 游戏循环中更新

```typescript
function gameLoop() {
    scene.update(); // 这会自动更新所有行为树
    requestAnimationFrame(gameLoop);
}
gameLoop();
```

## 核心组件

### BehaviorTreeComponent

行为树组件，附加到需要AI行为的实体上。

```typescript
const behaviorTreeComp = entity.getComponent(BehaviorTreeComponent);
behaviorTreeComp.start();    // 启动行为树
behaviorTreeComp.pause();    // 暂停
behaviorTreeComp.resume();   // 恢复
behaviorTreeComp.stop();     // 停止
```

### BehaviorTreeSystem

行为树系统，负责更新所有具有行为树组件的实体。

```typescript
const system = new BehaviorTreeSystem();
system.pauseAll();           // 暂停所有行为树
system.resumeAll();          // 恢复所有行为树
system.getBehaviorTreeStats(); // 获取性能统计
```

### ECSBehaviorTreeBuilder

专为ECS设计的行为树构建器。

```typescript
const builder = new ECSBehaviorTreeBuilder(entity);
const tree = builder
    .hasComponent(HealthComponent)           // 检查组件
    .modifyComponent(HealthComponent, (comp) => { // 修改组件
        comp.health += 10;
    })
    .waitTime(2.0)                          // 等待时间
    .isActive(true)                         // 检查实体状态
    .buildECSTree();
```

## 预制行为模板

### 巡逻行为

```typescript
BehaviorTreeFactory.addBehaviorTreeToEntity(
    entity,
    BehaviorTreeFactory.createPatrolBehavior([
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 }
    ], 100, 1.0), // 速度100，每点等待1秒
    { debugMode: true }
);
```

### 追击行为

```typescript
BehaviorTreeFactory.addBehaviorTreeToEntity(
    entity,
    BehaviorTreeFactory.createChaseTargetBehavior(1, 200), // 追击标签1，范围200
    { debugMode: true }
);
```

### 生命值监控

```typescript
BehaviorTreeFactory.addBehaviorTreeToEntity(
    entity,
    BehaviorTreeFactory.createHealthMonitoring(HealthComponent, 30), // 低于30血量时触发
    { debugMode: true }
);
```

## 自定义行为节点

### 创建自定义节点

```typescript
import { Behavior } from '../behaviourTree/Behavior';
import { TaskStatus } from '../behaviourTree/TaskStatus';

class CustomBehavior extends Behavior<Entity> {
    public update(entity: Entity): TaskStatus {
        // 自定义逻辑
        return TaskStatus.Success;
    }
}
```

### 使用自定义节点

```typescript
const builder = new ECSBehaviorTreeBuilder(entity);
const tree = builder
    .action((entity) => {
        const customBehavior = new CustomBehavior();
        return customBehavior.update(entity);
    })
    .buildECSTree();
```

## 性能优化

### 固定时间步长

```typescript
const system = new BehaviorTreeSystem(true, 1/60); // 60 FPS固定步长
scene.addEntityProcessor(system);
```

### 性能监控

```typescript
// 获取系统性能统计
const stats = system.getBehaviorTreeStats();
console.log(`平均更新时间: ${stats.averageUpdateTime}ms`);

// 获取详细报告
const report = system.getDetailedPerformanceReport();
console.log('组件性能报告:', report.componentReports);
```

## 调试和日志

### 启用调试模式

```typescript
BehaviorTreeFactory.addBehaviorTreeToEntity(
    entity,
    (builder) => builder.action(...),
    {
        debugMode: true,        // 启用调试输出
        treeName: "MyAI"       // 自定义树名称
    }
);
```

### 使用日志节点

```typescript
const builder = new ECSBehaviorTreeBuilder(entity);
const tree = builder
    .log("开始执行AI逻辑", 'info')
    .action((entity) => {
        // 执行逻辑
        return TaskStatus.Success;
    })
    .log((entity) => `实体${entity.id}完成任务`, 'info')
    .buildECSTree();
```

## 最佳实践

1. **合理设置更新间隔**: 不是所有AI都需要高频更新
2. **使用组件检查**: 在操作组件前先检查其存在性
3. **启用调试模式**: 在开发阶段帮助理解行为树执行流程
4. **监控性能**: 定期检查性能统计，优化瓶颈
5. **错误处理**: 在自定义行为中添加适当的错误处理

## 完整示例

查看 `examples/ECSExample.ts` 文件了解完整的使用示例。

## 架构设计

这个集成模块遵循以下设计原则：

- **非侵入性**: 不修改原始ECS框架代码
- **组件化**: 行为树作为组件添加到实体
- **系统化**: 通过专门的系统管理所有行为树
- **类型安全**: 完全基于TypeScript，提供类型检查
- **性能优先**: 支持各种性能优化策略

这样的设计既保持了ECS架构的纯净性，又为AI行为提供了强大而灵活的解决方案。 