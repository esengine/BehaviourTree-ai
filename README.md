# BehaviourTree-AI

一个高性能的TypeScript AI系统库，包含行为树（Behavior Tree）、实用AI（Utility AI）和有限状态机（FSM）。经过全面的性能优化，适用于游戏开发和复杂AI系统构建。

## ✨ 特性

- 🌳 **行为树系统** - 完整的行为树实现，支持复合节点、条件节点、装饰器和动作节点
- 🧠 **实用AI系统** - 基于评分的AI决策系统，支持动态行为选择
- 🔄 **有限状态机** - 灵活的状态管理系统，支持状态转换和事件处理
- ⚡ **高性能优化** - 内置时间管理、对象池、内存管理等性能优化功能
- 🛡️ **类型安全** - 完整的TypeScript类型支持和运行时类型检查
- 📊 **性能监控** - 内置性能统计和监控工具
- 🔧 **可配置** - 灵活的配置选项，支持开发和生产环境
- 🎯 **ECS集成** - 完整的ECS框架集成支持，提供组件、系统和预制模板

## 🚀 快速开始

### 安装

```bash
npm install @esengine/ai
```

### 基本使用

```typescript
import { BehaviorTreeBuilder, TaskStatus } from '@esengine/ai';

// 创建一个简单的AI角色
class AICharacter {
    public health: number = 100;
    public energy: number = 100;
    
    // 创建行为树
    createBehaviorTree() {
        const builder = BehaviorTreeBuilder.begin(this);
        
        builder.selector()
            // 如果生命值低，寻找治疗
            .conditionalDecorator(ai => ai.health < 30)
            .sequence()
                .logAction("寻找治疗")
                .action(ai => ai.findHealing())
                .endComposite()
            
            // 否则继续巡逻
            .sequence()
                .action(ai => ai.patrol())
                .waitAction(2.0)
                .endComposite()
            .endComposite();
            
        return builder.build();
    }
    
    findHealing(): TaskStatus {
        this.health += 10;
        return this.health >= 100 ? TaskStatus.Success : TaskStatus.Running;
    }
    
    patrol(): TaskStatus {
        console.log("正在巡逻...");
        this.energy -= 1;
        return TaskStatus.Success;
    }
}
```

### ECS框架集成

与[@esengine/ecs-framework](https://www.npmjs.com/package/@esengine/ecs-framework)完美集成：

```typescript
import { Scene, Entity, Component } from '@esengine/ecs-framework';
import { BehaviorTreeSystem, BehaviorTreeFactory } from '@esengine/ai/ecs-integration';

// 创建场景和系统
const scene = new Scene();
const behaviorTreeSystem = new BehaviorTreeSystem();
scene.addEntityProcessor(behaviorTreeSystem);

// 创建AI实体
const entity = new Entity("AI", 1);
BehaviorTreeFactory.addBehaviorTreeToEntity(
    entity,
    (builder) => builder.action((entity) => {
        console.log("AI正在思考...");
        return TaskStatus.Success;
    }),
    { debugMode: true }
);

scene.addEntity(entity);
scene.update(); // 在游戏循环中调用
```

详细ECS集成文档请查看：[ecs-integration/README.md](./ecs-integration/README.md)

## 📚 详细教程

### 1. 行为树系统

行为树是一种用于AI决策的树形结构，由不同类型的节点组成。

#### 复合节点（Composites）

复合节点控制子节点的执行流程：

```typescript
import { BehaviorTreeBuilder, AbortTypes } from '@esengine/ai';

// Sequence - 顺序执行，任一失败则整体失败
builder.sequence()
    .action(ai => ai.moveToTarget())
    .action(ai => ai.attack())
    .endComposite();

// Selector - 选择执行，任一成功则整体成功
builder.selector()
    .action(ai => ai.tryMeleeAttack())
    .action(ai => ai.tryRangedAttack())
    .action(ai => ai.retreat())
    .endComposite();

// Parallel - 并行执行所有子节点
builder.parallel()
    .action(ai => ai.move())
    .action(ai => ai.lookAround())
    .endComposite();
```

#### 条件节点（Conditionals）

条件节点用于检查游戏状态：

```typescript
// 自定义条件
class HealthCheckConditional extends Conditional<AICharacter> {
    private minHealth: number;
    
    constructor(minHealth: number) {
        super();
        this.minHealth = minHealth;
    }
    
    update(context: AICharacter): TaskStatus {
        return context.health >= this.minHealth ? 
            TaskStatus.Success : TaskStatus.Failure;
    }
}

// 使用条件装饰器
builder.conditionalDecorator(ai => ai.health > 50)
    .action(ai => ai.aggressiveAttack())
    .endComposite();
```

#### 装饰器节点（Decorators）

装饰器修改子节点的行为：

```typescript
// 重复执行直到失败
builder.untilFail()
    .action(ai => ai.patrol())
    .endComposite();

// 反转结果
builder.inverter()
    .conditional(ai => ai.isEnemyNear())
    .endComposite();

// 重复指定次数
builder.repeater(3)
    .action(ai => ai.shoot())
    .endComposite();
```

#### 中止类型（Abort Types）

支持动态行为中止：

```typescript
builder.selector(AbortTypes.Self)
    // 高优先级：逃跑
    .conditionalDecorator(ai => ai.health < 20)
    .sequence(AbortTypes.LowerPriority)
        .action(ai => ai.flee())
        .endComposite()
    
    // 中优先级：攻击
    .conditionalDecorator(ai => ai.canSeeEnemy())
    .sequence(AbortTypes.LowerPriority)
        .action(ai => ai.attack())
        .endComposite()
    
    // 低优先级：巡逻
    .action(ai => ai.patrol())
    .endComposite();
```

### 2. 实用AI系统

实用AI基于评分系统进行决策：

```typescript
import { UtilityAI, Consideration, Action } from '@esengine/ai';

class AttackAction extends Action<AICharacter> {
    execute(context: AICharacter): void {
        context.attack();
    }
}

class HealthConsideration extends Consideration<AICharacter> {
    getScore(context: AICharacter): number {
        // 生命值越低，攻击欲望越低
        return context.health / 100;
    }
}

class EnemyDistanceConsideration extends Consideration<AICharacter> {
    getScore(context: AICharacter): number {
        const distance = context.getDistanceToEnemy();
        // 距离越近，攻击欲望越高
        return Math.max(0, 1 - distance / 10);
    }
}

// 创建实用AI
const utilityAI = new UtilityAI<AICharacter>();

const attackAction = new AttackAction();
attackAction.addConsideration(new HealthConsideration());
attackAction.addConsideration(new EnemyDistanceConsideration());

utilityAI.addAction(attackAction);
```

### 3. 有限状态机

状态机用于管理AI的不同状态：

```typescript
import { StateMachine, State } from '@esengine/ai';

class PatrolState extends State<AICharacter> {
    update(context: AICharacter): void {
        context.patrol();
        
        if (context.canSeeEnemy()) {
            context.stateMachine.changeState(CombatState);
        }
    }
}

class CombatState extends State<AICharacter> {
    update(context: AICharacter): void {
        context.attack();
        
        if (!context.canSeeEnemy()) {
            context.stateMachine.changeState(PatrolState);
        }
    }
}

// 创建状态机
const stateMachine = new StateMachine<AICharacter>(character, new PatrolState());
stateMachine.addState(new CombatState());
```

## ⚡ 性能优化功能

### 时间管理器

高效的时间管理系统：

```typescript
import { TimeManager } from '@esengine/ai';

// 启用时间池化
TimeManager.enablePooling(true);

// 设置时间缩放
TimeManager.setTimeScale(1.5);

// 获取优化的时间
const currentTime = TimeManager.getCurrentTime();
const deltaTime = TimeManager.getDeltaTime();
```

### 高级对象池

减少垃圾回收压力：

```typescript
import { AdvancedObjectPool } from '@esengine/ai';

// 创建对象池
const bulletPool = new AdvancedObjectPool(
    () => new Bullet(),  // 创建函数
    bullet => bullet.reset(),  // 重置函数
    { 
        initialSize: 50,
        maxSize: 200,
        priority: 'high'
    }
);

// 获取对象
const bullet = bulletPool.get();

// 归还对象
bulletPool.release(bullet);
```

### 错误处理系统

可配置的错误处理：

```typescript
import { ErrorHandler, ErrorLevel } from '@esengine/ai';

// 设置错误级别
ErrorHandler.setLevel(ErrorLevel.Production);

// 启用性能监控
ErrorHandler.enablePerformanceMonitoring(true);

// 使用装饰器进行自动错误处理
class MyAI {
    @ErrorHandler.handleErrors()
    public complexOperation(): void {
        // 复杂的AI逻辑
    }
}
```

### 事件管理器

防止内存泄漏的事件系统：

```typescript
import { EventManager } from '@esengine/ai';

const eventManager = new EventManager();

// 添加监听器
const listenerId = eventManager.on('enemy-spotted', (data) => {
    console.log('发现敌人:', data);
});

// 自动清理监听器
eventManager.on('player-died', callback, {
    once: true,  // 只执行一次
    ttl: 5000   // 5秒后自动移除
});

// 手动移除监听器
eventManager.off('enemy-spotted', listenerId);
```

## 🔧 配置选项

### 性能配置

```typescript
import { PerformanceConfig } from '@esengine/ai';

PerformanceConfig.set({
    enableObjectPooling: true,
    enableTimePooling: true,
    maxPoolSize: 1000,
    enablePerformanceMonitoring: true,
    logLevel: 'warn'
});
```

### 开发模式配置

```typescript
import { DevConfig } from '@esengine/ai';

// 开发模式
DevConfig.enableDebugMode(true);
DevConfig.enableVerboseLogging(true);
DevConfig.enableTypeChecking(true);

// 生产模式
DevConfig.enableProductionMode();
```

## 📊 性能监控

### 获取性能统计

```typescript
import { PerformanceMonitor } from '@esengine/ai';

// 获取行为树性能统计
const btStats = PerformanceMonitor.getBehaviorTreeStats();
console.log(`平均执行时间: ${btStats.averageExecutionTime}ms`);

// 获取对象池统计
const poolStats = PerformanceMonitor.getObjectPoolStats();
console.log(`池命中率: ${poolStats.hitRate}%`);

// 获取内存使用情况
const memoryStats = PerformanceMonitor.getMemoryStats();
console.log(`内存使用: ${memoryStats.usedMemory}MB`);
```

## 🎯 最佳实践

### 1. 从配置创建行为树 🆕

```typescript
import { BehaviorTreeBuilder } from '@esengine/ai';

// 从JSON配置文件创建行为树（由可视化编辑器导出）
const config = loadConfigFromFile('my_behavior_tree.json');

// 创建上下文对象
const gameContext = {
    health: 100,
    position: { x: 0, y: 0 },
    // ... 其他游戏数据
};

// 从配置创建行为树
const behaviorTree = BehaviorTreeBuilder.fromConfig(config, gameContext);

// 在游戏循环中更新
behaviorTree.tick();
```

**支持的节点类型：** Sequence, Selector, Parallel, AlwaysSucceed, AlwaysFail, Inverter, Repeater, UntilSuccess, UntilFail, LogAction, WaitAction, ExecuteAction 等

### 2. 行为树设计

- 保持树的深度合理（建议不超过6层）
- 使用条件装饰器进行早期退出
- 合理使用中止类型避免不必要的计算
- 将复杂逻辑拆分为多个简单节点

### 3. 性能优化

- 在生产环境中禁用调试日志
- 使用对象池管理频繁创建的对象
- 避免在update方法中进行复杂计算
- 使用时间管理器减少时间计算开销

### 4. 内存管理

- 及时清理事件监听器
- 使用弱引用避免循环引用
- 定期清理不再使用的对象池
- 监控内存使用情况

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件
