// BehaviourTree (行为树) 模块
// 适用于NPC AI、Boss战、宠物系统、任务系统等

// 核心类
export * from './Behavior';
export * from './BehaviorTree';
export * from './BehaviorTreeBuilder';
export * from './TaskStatus';
export * from './ObjectPool';
export * from './Blackboard';

// 导出接口类型
export type { 
    BehaviorTreeJSONConfig,
    BehaviorTreeNodeConfig,
    BlackboardVariableConfig,
    ExecutionContext,
    BehaviorTreeBuildResult
} from './BehaviorTreeBuilder';

// 导出事件系统类型
export type {
    IBehaviorTreeContext,
    ActionResult,
    IEventHandler,
    IConditionChecker
} from './events/index';

// Actions
export * from './actions/index';

// Composites
export * from './composites/index';

// Conditionals
export * from './conditionals/index';

// Decorators
export * from './decorators/index';

// Events (事件系统)
export * from './events/index'; 