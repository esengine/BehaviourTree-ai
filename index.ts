// 主入口文件 - 导出所有模块
// 用户可以选择导入全部或按需导入特定模块

// 核心工具
export * from './core/index';

// 行为树模块
export * as BehaviourTree from './behaviourTree/index';

// 状态机模块  
export * as FSM from './fsm/index';

// 效用AI模块
export * as UtilityAI from './utilityAI/index';

// 默认导出（向后兼容）
export { 
    BehaviorTree, 
    BehaviorTreeBuilder, 
    TaskStatus, 
    Blackboard, 
    BlackboardValueType,
    BehaviorTreeJSONConfig,
    BehaviorTreeNodeConfig,
    BlackboardVariableConfig,
    ExecutionContext,
    BehaviorTreeBuildResult
} from './behaviourTree/index';

// 事件系统导出
export { 
    EventRegistry, 
    GlobalEventRegistry,
    IEventHandler,
    IConditionChecker,
    IBehaviorTreeContext,
    ActionResult,
    ActionHandler,
    ConditionChecker
} from './behaviourTree/events';
export { StateMachine, State } from './fsm/index';
export { UtilityAI as UtilityAICore } from './utilityAI/index'; 