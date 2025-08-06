import { Behavior } from './Behavior';
import { BehaviorTree } from './BehaviorTree';
import { TaskStatus } from './TaskStatus';
import { Composite } from './composites/Composite';
import { Decorator } from './decorators/Decorator';
import { ExecuteAction } from './actions/ExecuteAction';
import { ExecuteActionConditional } from './conditionals/ExecuteActionConditional';
import { IConditional } from './conditionals/IConditional';
import { ConditionFactory } from './factories/ConditionFactory';
import { LogAction } from './actions/LogAction';
import { WaitAction } from './actions/WaitAction';
import { BehaviorTreeReference } from './actions/BehaviorTreeReference';
import { ConditionalDecorator } from './decorators/ConditionalDecorator';
import { AlwaysFail } from './decorators/AlwaysFail';
import { AlwaysSucceed } from './decorators/AlwaysSucceed';
import { Inverter } from './decorators/Inverter';
import { Repeater } from './decorators/Repeater';
import { UntilFail } from './decorators/UntilFail';
import { UntilSuccess } from './decorators/UntilSuccess';
import { Parallel } from './composites/Parallel';
import { ParallelSelector } from './composites/ParallelSelector';
import { Selector } from './composites/Selector';
import { RandomSelector } from './composites/RandomSelector';
import { Sequence } from './composites/Sequence';
import { RandomSequence } from './composites/RandomSequence';
import { AbortTypes } from './composites/AbortTypes';
import { Blackboard, BlackboardValueType } from './Blackboard';

// 黑板动作节点导入
import {
    SetBlackboardValue,
    AddToBlackboardValue,
    ToggleBlackboardBool,
    ResetBlackboardVariable,
    MathBlackboardOperation,
    MathOperation,
    LogBlackboardValue,
    WaitForBlackboardCondition
} from './actions/BlackboardActions';

// 黑板条件节点导入
import {
    BlackboardValueComparison,
    CompareOperator,
    BlackboardVariableExists,
    BlackboardVariableTypeCheck,
    BlackboardVariableRangeCheck
} from './conditionals/BlackboardConditionals';

// 通用条件节点导入
import { NumericComparison, PropertyExists } from './conditionals/GeneralConditionals';

// 高级装饰器导入
import { CooldownDecorator } from './decorators/CooldownDecorator';
import { TimeoutDecorator } from './decorators/TimeoutDecorator';
import { ChanceDecorator } from './decorators/ChanceDecorator';

/**
 * 支持的黑板变量类型联合类型
 */
export type BlackboardVariableValue = string | number | boolean | object | unknown[];

/**
 * 节点属性值类型
 */
export type NodePropertyValue = string | number | boolean | object;

/**
 * 执行上下文基础接口
 */
export interface ExecutionContext {
    blackboard?: Blackboard;
    [key: string]: unknown;
}

/**
 * 条件配置接口
 */
export interface ConditionConfig {
    type: string;
    properties?: Record<string, NodePropertyConfig>;
}

/**
 * 行为树配置接口
 * @description 定义行为树的完整配置结构
 */
export interface BehaviorTreeConfig {
    /** 配置版本号 */
    version: string;
    /** 配置类型标识 */
    type: string;
    /** 元数据信息 */
    metadata?: BehaviorTreeMetadata;
    /** 根节点配置 */
    tree: NodeConfig;
}

/**
 * 行为树元数据接口
 * @description 包含行为树的描述性信息
 */
export interface BehaviorTreeMetadata {
    /** 行为树名称 */
    name?: string;
    /** 版本信息 */
    version?: string;
    /** 创建时间 */
    created?: string;
    /** 导出类型 */
    exportType?: string;
    /** 更新周期（秒） */
    updatePeriod?: number;
    /** 描述信息 */
    description?: string;
    /** 作者信息 */
    author?: string;
    /** 扩展属性 */
    [key: string]: unknown;
}

/**
 * 节点配置接口
 * @description 定义单个行为树节点的配置结构
 */
export interface NodeConfig {
    /** 节点唯一标识符 */
    id: string;
    /** 节点类型 */
    type: string;
    /** 命名空间（可选） */
    namespace?: string;
    /** 节点属性配置 */
    properties?: Record<string, NodePropertyConfig>;
    /** 子节点配置数组 */
    children?: NodeConfig[];
}

/**
 * 节点属性配置接口
 * @description 定义节点属性的类型和值
 */
export interface NodePropertyConfig {
    /** 属性类型 */
    type: string;
    /** 属性值 */
    value: NodePropertyValue;
}

/**
 * 行为树JSON配置接口
 * @description 用于从JSON文件加载行为树配置的标准格式
 */
export interface BehaviorTreeJSONConfig {
    /** 节点列表 */
    nodes: BehaviorTreeNodeConfig[];
    /** 黑板变量配置 */
    blackboard?: BlackboardVariableConfig[];
    /** 元数据信息 */
    metadata?: BehaviorTreeMetadata;
}

/**
 * 行为树节点配置接口
 * @description JSON格式中的节点配置结构
 */
export interface BehaviorTreeNodeConfig {
    /** 节点唯一标识符 */
    id: string;
    /** 节点类型 */
    type: string;
    /** 节点显示名称 */
    name: string;
    /** 节点属性 */
    properties?: Record<string, NodePropertyValue>;
    /** 子节点ID列表 */
    children?: string[];
    /** 条件配置（用于条件装饰器等） */
    condition?: ConditionConfig;
}

/**
 * 黑板变量配置接口
 * @description 定义黑板变量的完整配置信息
 */
export interface BlackboardVariableConfig {
    /** 变量名称 */
    name: string;
    /** 变量类型 */
    type: string;
    /** 变量初始值 */
    value: BlackboardVariableValue;
    /** 变量描述 */
    description?: string;
    /** 变量分组 */
    group?: string;
    /** 变量约束条件 */
    constraints?: {
        /** 最小值（数值类型） */
        min?: number;
        /** 最大值（数值类型） */
        max?: number;
        /** 只读标志 */
        readonly?: boolean;
        /** 可选值列表（枚举类型） */
        options?: BlackboardVariableValue[];
    };
}

/**
 * 行为树构建结果接口
 * @description fromBehaviorTreeConfig方法的返回结果
 */
export interface BehaviorTreeBuildResult<T> {
    /** 构建好的行为树实例 */
    tree: BehaviorTree<T>;
    /** 初始化的黑板实例 */
    blackboard: Blackboard;
    /** 增强的执行上下文 */
    context: T;
}

/**
 * 行为树构建器类
 * @description 提供构建行为树的流畅API和配置加载功能
 * @template T 执行上下文类型
 * 
 * @example
 * ```typescript
 * // 使用流畅API构建
 * const tree = BehaviorTreeBuilder.begin(context)
 *   .selector()
 *     .sequence()
 *       .logAction("开始执行")
 *       .waitAction(1.0)
 *     .endComposite()
 *     .logAction("备选方案")
 *   .endComposite()
 *   .build();
 * 
 * // 从JSON配置构建
 * const result = BehaviorTreeBuilder.fromBehaviorTreeConfig(jsonConfig, context);
 * ```
 */
export class BehaviorTreeBuilder<T> {
    /** 执行上下文 */
    private _context: T;
    /** 当前创建的节点 */
    private _currentNode: Behavior<T> | undefined;
    /** 父节点堆栈，用于流畅API构建 */
    private _parentNodeStack: Array<Behavior<T>> = new Array<Behavior<T>>();

    /**
     * 构造函数
     * @param context 执行上下文
     */
    public constructor(context: T) {
        this._context = context;
    }

    /**
     * 开始构建行为树
     * @param context 执行上下文
     * @returns 新的构建器实例
     */
    public static begin<T>(context: T): BehaviorTreeBuilder<T> {
        return new BehaviorTreeBuilder<T>(context);
    }

    /**
     * 设置子节点到父节点
     * @param child 子节点
     * @returns 构建器实例
     */
    private setChildOnParent(child: Behavior<T>): BehaviorTreeBuilder<T> {
        const parent = this._parentNodeStack[this._parentNodeStack.length - 1];
        if (parent instanceof Composite) {
            (parent as Composite<T>).addChild(child);
        }
        else if (parent instanceof Decorator) {
            // 装饰器只有一个子节点，所以自动结束
            (parent as Decorator<T>).child = child;
            this.endDecorator();
        }

        return this;
    }

    /**
     * 将节点推入父节点堆栈
     * @param composite 复合节点或装饰器节点
     * @returns 构建器实例
     */
    private pushParentNode(composite: Behavior<T>): BehaviorTreeBuilder<T> {
        if (this._parentNodeStack.length > 0) {
            this.setChildOnParent(composite);
        }

        this._parentNodeStack.push(composite);
        return this;
    }

    /**
     * 结束装饰器节点
     * @returns 构建器实例
     */
    private endDecorator(): BehaviorTreeBuilder<T> {
        this._currentNode = this._parentNodeStack.pop();
        return this;
    }

    /**
     * 添加动作节点
     * @param func 动作执行函数
     * @returns 构建器实例
     */
    public action(func: (t: T) => TaskStatus): BehaviorTreeBuilder<T> {
        if (this._parentNodeStack.length === 0) {
            throw new Error("无法创建无嵌套的动作节点，它必须是一个叶节点");
        }
        return this.setChildOnParent(new ExecuteAction<T>(func));
    }

    /**
     * 添加返回布尔值的动作节点
     * @param func 返回布尔值的函数
     * @returns 构建器实例
     */
    public actionR(func: (t: T) => boolean): BehaviorTreeBuilder<T> {
        return this.action(t => func(t) ? TaskStatus.Success : TaskStatus.Failure);
    }

    /**
     * 添加动作节点 (action的别名方法)
     * @param func 动作执行函数
     * @returns 构建器实例
     */
    public executeAction(func: (t: T) => TaskStatus): BehaviorTreeBuilder<T> {
        return this.action(func);
    }

    /**
     * 添加条件节点
     * @param func 条件检查函数
     * @returns 构建器实例
     */
    public conditional(func: (t: T) => TaskStatus): BehaviorTreeBuilder<T> {
        if (this._parentNodeStack.length === 0) {
            throw new Error("无法创建无嵌套的条件节点，它必须是一个叶节点");
        }
        return this.setChildOnParent(new ExecuteActionConditional<T>(func));
    }

    /**
     * 添加返回布尔值的条件节点
     * @param func 返回布尔值的条件函数
     * @returns 构建器实例
     */
    public conditionalR(func: (t: T) => boolean): BehaviorTreeBuilder<T> {
        return this.conditional(t => func(t) ? TaskStatus.Success : TaskStatus.Failure);
    }

    /**
     * 添加日志动作节点
     * @param text 日志文本
     * @returns 构建器实例
     */
    public logAction(text: string): BehaviorTreeBuilder<T> {
        if (this._parentNodeStack.length === 0) {
            throw new Error("无法创建无嵌套的动作节点，它必须是一个叶节点");
        }
        return this.setChildOnParent(new LogAction<T>(text));
    }

    /**
     * 添加等待动作节点
     * @param waitTime 等待时间（秒）
     * @returns 构建器实例
     */
    public waitAction(waitTime: number): BehaviorTreeBuilder<T> {
        if (this._parentNodeStack.length === 0) {
            throw new Error("无法创建无嵌套的动作节点，它必须是一个叶节点");
        }
        return this.setChildOnParent(new WaitAction<T>(waitTime));
    }

    /**
     * 添加子行为树节点
     * @param subTree 子行为树实例
     * @returns 构建器实例
     */
    public subTree(subTree: BehaviorTree<T>): BehaviorTreeBuilder<T> {
        if (this._parentNodeStack.length === 0) {
            throw new Error("无法创建无嵌套的动作节点，它必须是一个叶节点");
        }
        return this.setChildOnParent(new BehaviorTreeReference<T>(subTree));
    }

    /**
     * 添加设置黑板值的动作节点
     * @param variableName 变量名
     * @param value 要设置的值
     * @param sourceVariable 源变量名(可选)
     * @param force 是否强制设置
     * @returns 构建器实例
     */
    public setBlackboardValue(variableName: string, value: any, sourceVariable?: string, force: boolean = false): BehaviorTreeBuilder<T> {
        if (this._parentNodeStack.length === 0) {
            throw new Error("无法创建无嵌套的动作节点，它必须是一个叶节点");
        }
        return this.setChildOnParent(new SetBlackboardValue<T>(variableName, value, sourceVariable, force));
    }

    /**
     * 添加条件装饰器
     * @param func 条件函数
     * @param shouldReevaluate 是否重新评估
     * @returns 构建器实例
     */
    public conditionalDecorator(func: (t: T) => TaskStatus, shouldReevaluate?: boolean): BehaviorTreeBuilder<T>;
    public conditionalDecorator(func: (t: T) => boolean, shouldReevaluate?: boolean): BehaviorTreeBuilder<T>;
    public conditionalDecorator(func: (t: T) => TaskStatus | boolean, shouldReevaluate: boolean = true): BehaviorTreeBuilder<T> {
        const wrappedFunc = (t: T): TaskStatus => {
            const result = func(t);
            if (typeof result === 'boolean') {
                return result ? TaskStatus.Success : TaskStatus.Failure;
            }
            return result;
        };
        const conditional = new ExecuteActionConditional<T>(wrappedFunc);
        return this.pushParentNode(new ConditionalDecorator<T>(conditional, shouldReevaluate));
    }

    /**
     * 添加返回布尔值的条件装饰器
     * @param func 返回布尔值的条件函数
     * @param shouldReevaluate 是否重新评估
     * @returns 构建器实例
     */
    public conditionalDecoratorR(func: (t: T) => boolean, shouldReevaluate: boolean = true): BehaviorTreeBuilder<T> {
        return this.conditionalDecorator(t => func(t) ? TaskStatus.Success : TaskStatus.Failure, shouldReevaluate);
    }

    /**
     * 添加总是失败装饰器
     * @returns 构建器实例
     */
    public alwaysFail(): BehaviorTreeBuilder<T> {
        return this.pushParentNode(new AlwaysFail<T>());
    }

    /**
     * 添加总是成功装饰器
     * @returns 构建器实例
     */
    public alwaysSucceed(): BehaviorTreeBuilder<T> {
        return this.pushParentNode(new AlwaysSucceed<T>());
    }

    /**
     * 添加反转装饰器
     * @returns 构建器实例
     */
    public inverter(): BehaviorTreeBuilder<T> {
        return this.pushParentNode(new Inverter());
    }

    /**
     * 添加重复装饰器
     * @param count 重复次数
     * @returns 构建器实例
     */
    public repeater(count: number): BehaviorTreeBuilder<T> {
        return this.pushParentNode(new Repeater<T>(count));
    }

    /**
     * 添加直到失败装饰器
     * @returns 构建器实例
     */
    public untilFail(): BehaviorTreeBuilder<T> {
        return this.pushParentNode(new UntilFail<T>());
    }

    /**
     * 添加直到成功装饰器
     * @returns 构建器实例
     */
    public untilSuccess(): BehaviorTreeBuilder<T> {
        return this.pushParentNode(new UntilSuccess<T>());
    }

    /**
     * 添加并行节点
     * @returns 构建器实例
     */
    public paraller(): BehaviorTreeBuilder<T> {
        return this.pushParentNode(new Parallel<T>());
    }

    /**
     * 添加并行节点 (paraller的正确拼写别名)
     * @returns 构建器实例
     */
    public parallel(): BehaviorTreeBuilder<T> {
        return this.paraller();
    }

    /**
     * 添加并行选择器节点
     * @returns 构建器实例
     */
    public parallelSelector(): BehaviorTreeBuilder<T> {
        return this.pushParentNode(new ParallelSelector<T>());
    }

    /**
     * 添加选择器节点
     * @param abortType 中止类型
     * @returns 构建器实例
     */
    public selector(abortType: AbortTypes = AbortTypes.None): BehaviorTreeBuilder<T> {
        return this.pushParentNode(new Selector<T>(abortType));
    }

    /**
     * 添加随机选择器节点
     * @returns 构建器实例
     */
    public randomSelector(): BehaviorTreeBuilder<T> {
        return this.pushParentNode(new RandomSelector());
    }

    /**
     * 添加序列节点
     * @param abortType 中止类型
     * @returns 构建器实例
     */
    public sequence(abortType: AbortTypes = AbortTypes.None): BehaviorTreeBuilder<T> {
        return this.pushParentNode(new Sequence<T>(abortType));
    }

    /**
     * 添加随机序列节点
     * @returns 构建器实例
     */
    public randomSequence(): BehaviorTreeBuilder<T> {
        return this.pushParentNode(new RandomSequence<T>());
    }

    /**
     * 结束复合节点
     * @returns 构建器实例
     */
    public endComposite(): BehaviorTreeBuilder<T> {
        const topNode = this._parentNodeStack[this._parentNodeStack.length - 1];
        if (!(topNode instanceof Composite)) {
            throw new Error("尝试结束复合器，但顶部节点是装饰器");
        }
        this._currentNode = this._parentNodeStack.pop();
        return this;
    }

    /**
     * 构建最终的行为树
     * @param updatePeriod 更新周期（秒），默认0.2秒
     * @returns 构建好的行为树实例
     */
    public build(updatePeriod: number = 0.2): BehaviorTree<T> {
        if (!this._currentNode) {
            throw new Error('无法创建零节点的行为树');
        }

        return new BehaviorTree<T>(this._context, this._currentNode, updatePeriod);
    }

    /**
     * 从配置对象创建行为树
     * @param config 行为树配置
     * @param context 执行上下文
     * @returns 构建好的行为树
     */
    public static fromConfig<T>(config: BehaviorTreeConfig, context: T): BehaviorTree<T> {
        try {

            if (!config || !config.tree) {
                throw new Error('配置无效：缺少tree属性');
            }

            const rootNode = BehaviorTreeBuilder.createNodeFromConfig<T>(config.tree);
            const updatePeriod = config.metadata?.updatePeriod ?? 0.2;

            return new BehaviorTree<T>(context, rootNode, updatePeriod);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`从配置创建行为树失败: ${errorMessage}`);
        }
    }

    /**
     * 从JSON配置创建行为树
     * @description 自动初始化黑板变量和构建节点树，提供一键式行为树创建
     * @param config JSON格式的行为树配置
     * @param context 执行上下文（可选，如果不提供将创建默认上下文）
     * @returns 包含行为树、黑板和增强上下文的结果对象
     * 
     * @example
     * ```typescript
     * const config = {
     *   nodes: [...],
     *   blackboard: [...],
     *   metadata: { name: "MyBehaviorTree" }
     * };
     * const result = BehaviorTreeBuilder.fromBehaviorTreeConfig(config, context);
     * const { tree, blackboard, context: enhancedContext } = result;
     * ```
     */
    public static fromBehaviorTreeConfig<T extends ExecutionContext = ExecutionContext>(
        config: BehaviorTreeJSONConfig,
        context?: T
    ): BehaviorTreeBuildResult<T> {
        try {

            // 验证配置
            if (!config || !config.nodes || config.nodes.length === 0) {
                throw new Error('配置无效：缺少nodes属性或nodes为空');
            }

            // 创建黑板并初始化变量
            const blackboard = new Blackboard();
            if (config.blackboard && config.blackboard.length > 0) {
                for (const variable of config.blackboard) {
                    // 映射类型字符串到枚举
                    const blackboardType = BehaviorTreeBuilder.mapToBlackboardType(variable.type);

                    // 转换值类型以匹配黑板期望的类型
                    const convertedValue = BehaviorTreeBuilder.convertBlackboardValue(variable.value, blackboardType);

                    blackboard.defineVariable(
                        variable.name,
                        blackboardType,
                        convertedValue,
                        {
                            description: variable.description,
                            group: variable.group || 'Default',
                            readonly: variable.constraints?.readonly ?? false
                        }
                    );
                }
            }

            // 创建或增强执行上下文
            const enhancedContext = (context || {}) as T;
            enhancedContext.blackboard = blackboard;

            // 构建节点树
            const nodeMap = new Map<string, BehaviorTreeNodeConfig>();

            // 建立节点映射
            for (const node of config.nodes) {
                nodeMap.set(node.id, node);
            }

            // 找到根节点（通常是第一个节点或type为'root'的节点）
            const rootNodeConfig = config.nodes.find(n => n.type === 'root') || config.nodes[0];
            if (!rootNodeConfig) {
                throw new Error('未找到根节点');
            }

            // 递归构建节点树
            const rootNode = BehaviorTreeBuilder.createNodeFromJSONConfig<T>(rootNodeConfig, nodeMap, enhancedContext);

            // 创建行为树
            const updatePeriod = config.metadata?.updatePeriod ?? 0.2;
            const tree = new BehaviorTree<T>(enhancedContext, rootNode, updatePeriod, false, blackboard);

            return { tree, blackboard, context: enhancedContext };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`从配置创建行为树失败: ${errorMessage}`);
        }
    }

    /**
     * 映射字符串类型到BlackboardValueType枚举
     * @param typeString 类型字符串
     * @returns 对应的黑板值类型枚举
     */
    private static mapToBlackboardType(typeString: string): BlackboardValueType {
        switch (typeString.toLowerCase()) {
            case 'string':
                return BlackboardValueType.String;
            case 'number':
                return BlackboardValueType.Number;
            case 'boolean':
                return BlackboardValueType.Boolean;
            case 'vector2':
                return BlackboardValueType.Vector2;
            case 'vector3':
                return BlackboardValueType.Vector3;
            case 'object':
                return BlackboardValueType.Object;
            case 'array':
                return BlackboardValueType.Array;
            default:
                console.warn(`未知的变量类型: ${typeString}, 默认使用Object类型`);
                return BlackboardValueType.Object;
        }
    }

    /**
     * 转换黑板变量值到正确的类型
     * @param value 原始值（通常来自JSON，都是字符串）
     * @param targetType 目标类型
     * @returns 转换后的值
     */
    private static convertBlackboardValue(value: any, targetType: BlackboardValueType): any {
        // 为不同类型提供合理的默认值
        if (value === null || value === undefined || value === '') {
            switch (targetType) {
                case BlackboardValueType.String:
                    return '';
                case BlackboardValueType.Number:
                    return 0;
                case BlackboardValueType.Boolean:
                    return false; // 布尔类型默认为false
                case BlackboardValueType.Vector2:
                    return { x: 0, y: 0 };
                case BlackboardValueType.Vector3:
                    return { x: 0, y: 0, z: 0 };
                case BlackboardValueType.Object:
                    return {};
                case BlackboardValueType.Array:
                    return [];
                default:
                    return null;
            }
        }

        switch (targetType) {
            case BlackboardValueType.String:
                return String(value);

            case BlackboardValueType.Number:
                if (typeof value === 'string') {
                    const num = parseFloat(value);
                    if (isNaN(num)) {
                        console.warn(`无法将 "${value}" 转换为数字，使用默认值 0`);
                        return 0;
                    }
                    return num;
                }
                return typeof value === 'number' ? value : 0;

            case BlackboardValueType.Boolean:
                if (typeof value === 'string') {
                    // 处理空字符串的情况
                    if (value === '') return false;
                    return value.toLowerCase() === 'true';
                }
                return Boolean(value);

            case BlackboardValueType.Vector2:
                if (typeof value === 'string') {
                    try {
                        const parsed = JSON.parse(value);
                        return parsed && typeof parsed === 'object' && 'x' in parsed && 'y' in parsed
                            ? parsed
                            : { x: 0, y: 0 };
                    } catch {
                        console.warn(`无法解析Vector2值 "${value}"，使用默认值 {x:0, y:0}`);
                        return { x: 0, y: 0 };
                    }
                }
                return value && typeof value === 'object' && 'x' in value && 'y' in value
                    ? value
                    : { x: 0, y: 0 };

            case BlackboardValueType.Vector3:
                if (typeof value === 'string') {
                    try {
                        const parsed = JSON.parse(value);
                        return parsed && typeof parsed === 'object' && 'x' in parsed && 'y' in parsed && 'z' in parsed
                            ? parsed
                            : { x: 0, y: 0, z: 0 };
                    } catch {
                        console.warn(`无法解析Vector3值 "${value}"，使用默认值 {x:0, y:0, z:0}`);
                        return { x: 0, y: 0, z: 0 };
                    }
                }
                return value && typeof value === 'object' && 'x' in value && 'y' in value && 'z' in value
                    ? value
                    : { x: 0, y: 0, z: 0 };

            case BlackboardValueType.Object:
                if (typeof value === 'string') {
                    try {
                        return JSON.parse(value);
                    } catch {
                        console.warn(`无法解析Object值 "${value}"，使用默认值 {}`);
                        return {};
                    }
                }
                return typeof value === 'object' ? value : {};

            case BlackboardValueType.Array:
                if (typeof value === 'string') {
                    try {
                        const parsed = JSON.parse(value);
                        return Array.isArray(parsed) ? parsed : [];
                    } catch {
                        console.warn(`无法解析Array值 "${value}"，使用默认值 []`);
                        return [];
                    }
                }
                return Array.isArray(value) ? value : [];

            default:
                return value;
        }
    }

    /**
     * 从节点配置创建节点实例
     * @param nodeConfig 节点配置
     * @returns 创建的节点实例
     */
    private static createNodeFromConfig<T>(nodeConfig: NodeConfig): Behavior<T> {

        let node: Behavior<T>;

        // 根据节点类型创建对应的节点实例
        switch (nodeConfig.type) {
            // 复合节点
            case 'Sequence':
                const sequenceAbortValue = nodeConfig.properties?.abortType?.value;
                const sequenceAbortType = BehaviorTreeBuilder.getAbortType(
                    typeof sequenceAbortValue === 'string' ? sequenceAbortValue : 'None'
                );
                node = new Sequence<T>(sequenceAbortType);
                break;

            case 'Selector':
                const selectorAbortValue = nodeConfig.properties?.abortType?.value;
                const selectorAbortType = BehaviorTreeBuilder.getAbortType(
                    typeof selectorAbortValue === 'string' ? selectorAbortValue : 'None'
                );
                node = new Selector<T>(selectorAbortType);
                break;

            case 'Parallel':
                node = new Parallel<T>();
                break;

            case 'ParallelSelector':
                node = new ParallelSelector<T>();
                break;

            case 'RandomSelector':
                node = new RandomSelector<T>();
                break;

            case 'RandomSequence':
                node = new RandomSequence<T>();
                break;

            // 装饰器节点
            case 'AlwaysSucceed':
                node = new AlwaysSucceed<T>();
                break;

            case 'AlwaysFail':
                node = new AlwaysFail<T>();
                break;

            case 'Inverter':
                node = new Inverter<T>();
                break;

            case 'Repeater':
                const countValue = nodeConfig.properties?.count?.value;
                const count = typeof countValue === 'number' ? countValue : 1;
                node = new Repeater<T>(count);
                break;

            case 'UntilSuccess':
                node = new UntilSuccess<T>();
                break;

            case 'UntilFail':
                node = new UntilFail<T>();
                break;

            // 动作节点
            case 'LogAction':
                const messageValue = nodeConfig.properties?.message?.value;
                const message = typeof messageValue === 'string' ? messageValue : 'Default log message';
                node = new LogAction<T>(message);
                break;

            case 'WaitAction':
                const waitTimeValue = nodeConfig.properties?.waitTime?.value;
                const waitTime = typeof waitTimeValue === 'number' ? waitTimeValue : 1.0;
                node = new WaitAction<T>(waitTime);
                break;

            case 'ExecuteAction':
                // 对于自定义动作，我们创建一个默认的执行函数
                const actionCode = nodeConfig.properties?.actionCode?.value;
                if (actionCode && typeof actionCode === 'string') {
                    try {
                        // 简单的代码执行（在实际项目中应该更安全地处理）
                        const actionFunc = new Function('context', 'TaskStatus', `
                            const { Success, Failure, Running } = TaskStatus;
                            ${actionCode}
                        `);
                        node = new ExecuteAction<T>((context: T) => {
                            try {
                                return actionFunc(context, TaskStatus);
                            } catch (error) {
                                console.error('执行动作失败:', error);
                                return TaskStatus.Failure;
                            }
                        });
                    } catch (error) {
                        console.warn('解析动作代码失败，使用默认动作:', error);
                        node = new ExecuteAction<T>(() => TaskStatus.Success);
                    }
                } else {
                    node = new ExecuteAction<T>(() => TaskStatus.Success);
                }
                break;

            default:
                console.warn('⚠️ 未知的节点类型:', nodeConfig.type, '，使用默认动作节点');
                node = new ExecuteAction<T>(() => TaskStatus.Success);
                break;
        }

        // 为复合节点和装饰器添加子节点
        if (nodeConfig.children && nodeConfig.children.length > 0) {
            if (node instanceof Composite) {
                // 复合节点可以有多个子节点
                for (const childConfig of nodeConfig.children) {
                    const childNode = BehaviorTreeBuilder.createNodeFromConfig<T>(childConfig);
                    (node as Composite<T>).addChild(childNode);
                }
            } else if (node instanceof Decorator) {
                // 装饰器只能有一个子节点
                if (nodeConfig.children.length > 1) {
                    console.warn('⚠️ 装饰器节点只能有一个子节点，将使用第一个');
                }
                const childNode = BehaviorTreeBuilder.createNodeFromConfig<T>(nodeConfig.children[0]);
                (node as Decorator<T>).child = childNode;
            }
        }

        return node;
    }

    /**
     * 解析中止类型字符串为枚举值
     * @param value 中止类型字符串
     * @returns 对应的中止类型枚举值
     */
    private static getAbortType(value: string): AbortTypes {
        switch (value) {
            case 'LowerPriority':
                return AbortTypes.LowerPriority;
            case 'Self':
                return AbortTypes.Self;
            case 'Both':
                return AbortTypes.Both;
            default:
                return AbortTypes.None;
        }
    }

    /**
     * 从JSON节点配置创建节点实例
     * @description 递归创建节点树，支持所有标准行为树节点类型
     * @param nodeConfig 当前节点配置
     * @param nodeMap 节点ID到配置的映射表
     * @param context 执行上下文
     * @returns 创建的节点实例
     */
    private static createNodeFromJSONConfig<T extends { blackboard?: Blackboard }>(
        nodeConfig: BehaviorTreeNodeConfig,
        nodeMap: Map<string, BehaviorTreeNodeConfig>,
        context: T
    ): Behavior<T> {
        let node: Behavior<T>;
        const props = nodeConfig.properties || {};

        // 根据节点类型创建对应的节点实例
        switch (nodeConfig.type) {
            // 根节点 - 通常是一个简单的传递节点
            case 'root':
                // 根节点本身不执行逻辑，直接处理第一个子节点
                if (nodeConfig.children && nodeConfig.children.length > 0) {
                    const firstChildId = nodeConfig.children[0];
                    const firstChildConfig = nodeMap.get(firstChildId);
                    if (firstChildConfig) {
                        return BehaviorTreeBuilder.createNodeFromJSONConfig<T>(firstChildConfig, nodeMap, context);
                    }
                }
                // 如果没有子节点，创建一个默认成功节点
                node = new ExecuteAction<T>(() => TaskStatus.Success);
                break;

            // 复合节点
            case 'selector':
                const selectorAbortType = BehaviorTreeBuilder.getAbortType(String(props.abortType || 'None'));
                node = new Selector<T>(selectorAbortType);
                break;

            case 'sequence':
                const sequenceAbortType = BehaviorTreeBuilder.getAbortType(String(props.abortType || 'None'));
                node = new Sequence<T>(sequenceAbortType);
                break;

            case 'parallel':
                node = new Parallel<T>();
                break;

            case 'parallel-selector':
                node = new ParallelSelector<T>();
                break;

            case 'random-selector':
                node = new RandomSelector<T>();
                break;

            case 'random-sequence':
                node = new RandomSequence<T>();
                break;

            // 装饰器节点
            case 'repeater':
                const countProp = props.count;
                const count = typeof countProp === 'number' ? countProp : -1; // -1 表示无限重复
                node = new Repeater<T>(count);
                break;

            case 'inverter':
                node = new Inverter<T>();
                break;

            case 'always-succeed':
                node = new AlwaysSucceed<T>();
                break;

            case 'always-fail':
                node = new AlwaysFail<T>();
                break;

            case 'until-success':
                node = new UntilSuccess<T>();
                break;

            case 'until-fail':
                node = new UntilFail<T>();
                break;

            case 'conditional-decorator':
                // 创建条件装饰器 - 使用新的条件工厂
                let conditionConfig: ConditionConfig | undefined = nodeConfig.condition;
                
                // 根据conditionType属性确定条件类型
                if (props.conditionType === 'blackboardCompare') {
                    conditionConfig = { type: 'blackboard-value-comparison' };
                } else if (props.conditionType === 'eventCondition') {
                    conditionConfig = { type: 'event-condition' };
                } else if (props.conditionType === 'custom') {
                    conditionConfig = { type: 'condition-custom' };
                }

                // 使用条件工厂创建条件
                const conditionalNode = ConditionFactory.createCondition(
                    conditionConfig,
                    props,
                    context
                );

                const shouldReevaluateValue = BehaviorTreeBuilder.extractNestedValue(props.shouldReevaluate);
                const shouldReevaluate = shouldReevaluateValue !== false && shouldReevaluateValue !== "false";
                const abortType = BehaviorTreeBuilder.getAbortType(BehaviorTreeBuilder.extractNestedValue(props.abortType) || 'None');
                node = new ConditionalDecorator<T>(conditionalNode, shouldReevaluate, abortType);
                break;

            // 动作节点
            case 'log-action':
                const message = props.message || 'Default log message';
                // 支持变量替换
                node = new ExecuteAction<T>((ctx: T) => {
                    const blackboard = (ctx as any).blackboard;
                    let finalMessage = message;

                    // 简单的变量替换 {{variableName}}
                    if (blackboard && typeof message === 'string') {
                        finalMessage = message.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
                            const value = blackboard.getValue(varName);
                            return value !== undefined ? String(value) : match;
                        });
                    }

                    console.log(`[BehaviorTree] ${finalMessage}`);
                    if ((ctx as any).log) {
                        (ctx as any).log(finalMessage, props.logLevel || 'info');
                    }
                    return TaskStatus.Success;
                });
                break;

            case 'wait-action':
                const waitTimeProp = props.waitTime;
                const waitTime = typeof waitTimeProp === 'number' ? waitTimeProp : 1.0;
                node = new WaitAction<T>(waitTime);
                break;

            case 'behavior-tree-reference':
                const subTreePath = props.subTreePath || props.treePath;
                if (subTreePath && typeof subTreePath === 'string') {
                    try {
                        // 这里需要从路径加载子行为树
                        // 在实际应用中，应该有一个行为树管理器来处理这个
                        console.warn(`behavior-tree-reference节点需要实现子行为树加载机制: ${subTreePath}`);
                        node = new ExecuteAction<T>((ctx: T) => {
                            console.log(`执行子行为树引用: ${subTreePath}`);
                            return TaskStatus.Success;
                        });
                    } catch (error) {
                        console.error('加载子行为树失败:', error);
                        node = new ExecuteAction<T>(() => TaskStatus.Failure);
                    }
                } else {
                    console.warn('behavior-tree-reference节点缺少subTreePath属性');
                    node = new ExecuteAction<T>(() => TaskStatus.Failure);
                }
                break;

            case 'execute-action':
                const actionCode = props.actionCode;
                if (actionCode && typeof actionCode === 'string') {
                    try {
                        // 创建安全的执行函数
                        const actionFunc = new Function('context', 'TaskStatus', `
                            const { Success, Failure, Running, Invalid } = TaskStatus;
                            try {
                                ${actionCode}
                            } catch (error) {
                                console.error('动作执行错误:', error);
                                return TaskStatus.Failure;
                            }
                        `);
                        node = new ExecuteAction<T>((ctx: T) => {
                            try {
                                const result = actionFunc(ctx, TaskStatus);
                                return result || TaskStatus.Success;
                            } catch (error) {
                                console.error('执行动作失败:', error);
                                return TaskStatus.Failure;
                            }
                        });
                    } catch (error) {
                        console.warn('解析动作代码失败，使用默认动作:', error);
                        node = new ExecuteAction<T>(() => TaskStatus.Success);
                    }
                } else {
                    node = new ExecuteAction<T>(() => TaskStatus.Success);
                }
                break;

            // 条件节点
            case 'condition-random':
                const probabilityProp = props.successProbability;
                const probability = typeof probabilityProp === 'number' ? probabilityProp : 0.5;
                node = new ExecuteActionConditional<T>(() => {
                    return Math.random() < probability ? TaskStatus.Success : TaskStatus.Failure;
                });
                break;

            case 'condition-custom':
                const conditionCodeProp = props.conditionCode;
                const conditionCode = typeof conditionCodeProp === 'string' ? conditionCodeProp :
                    (typeof conditionCodeProp === 'object' && conditionCodeProp && 'value' in conditionCodeProp ?
                        String((conditionCodeProp as { value: unknown }).value) : undefined);
                if (conditionCode && typeof conditionCode === 'string') {
                    try {
                        const condFunc = new Function('context', `
                            try {
                                ${conditionCode}
                            } catch (error) {
                                console.error('条件检查错误:', error);
                                return false;
                            }
                        `);
                        node = new ExecuteActionConditional<T>((ctx: T) => {
                            try {
                                const result = condFunc(ctx);
                                return result ? TaskStatus.Success : TaskStatus.Failure;
                            } catch (error) {
                                console.error('条件检查失败:', error);
                                return TaskStatus.Failure;
                            }
                        });
                    } catch (error) {
                        console.warn('解析条件代码失败:', error);
                        node = new ExecuteActionConditional<T>(() => TaskStatus.Failure);
                    }
                } else {
                    node = new ExecuteActionConditional<T>(() => TaskStatus.Success);
                }
                break;



            case 'condition-numeric':
                node = new ExecuteActionConditional<T>((ctx: T) => {
                    const conditional = new NumericComparison<T>(
                        String(props.propertyPath || 'value'),
                        String(props.compareOperator || 'equal') as 'greater' | 'less' | 'equal' | 'greaterEqual' | 'lessEqual' | 'notEqual',
                        Number(props.compareValue) || 0
                    );
                    return conditional.update(ctx);
                });
                break;

            case 'condition-property':
                node = new ExecuteActionConditional<T>((ctx: T) => {
                    const conditional = new PropertyExists<T>(String(props.propertyPath || 'property'));
                    return conditional.update(ctx);
                });
                break;

            // 事件驱动节点
            case 'event-action':
                const eventActionName = props.eventName;
                if (eventActionName && typeof eventActionName === 'string') {
                    node = new ExecuteAction<T>((ctx: T) => {
                        try {
                            // 从上下文中获取事件注册表
                            const eventRegistry = (ctx as any).eventRegistry;
                            if (!eventRegistry) {
                                console.warn(`[event-action] 未找到事件注册表，请在执行上下文中提供 eventRegistry`);
                                return TaskStatus.Failure;
                            }

                            // 获取事件处理器
                            const handler = eventRegistry.getActionHandler ?
                                eventRegistry.getActionHandler(eventActionName) :
                                eventRegistry.handlers?.get(eventActionName);

                            if (!handler) {
                                console.warn(`[event-action] 未找到事件处理器: ${eventActionName}`);
                                return TaskStatus.Failure;
                            }

                            // 解析参数
                            let parameters = {};
                            if (props.parameters) {
                                if (typeof props.parameters === 'string') {
                                    try {
                                        parameters = JSON.parse(props.parameters);
                                    } catch (e) {
                                        console.warn(`[event-action] 参数解析失败: ${props.parameters}`);
                                    }
                                } else {
                                    parameters = props.parameters;
                                }

                                // 支持黑板变量替换
                                const blackboard = (ctx as any).blackboard;
                                if (blackboard) {
                                    parameters = BehaviorTreeBuilder.replaceBlackboardVariables(parameters, blackboard);
                                }
                            }

                            // 执行事件处理器
                            const result = handler(ctx, parameters);

                            // 处理异步结果
                            if (result instanceof Promise) {
                                if (props.async !== false) {
                                    result.then((asyncResult) => {
                                        console.log(`[event-action] 异步事件 ${eventActionName} 完成: ${asyncResult}`);
                                    }).catch((error) => {
                                        console.error(`[event-action] 异步事件 ${eventActionName} 失败:`, error);
                                    });
                                    return TaskStatus.Running;
                                } else {
                                    console.warn(`[event-action] 事件 ${eventActionName} 返回Promise但未标记为异步，将阻塞执行`);
                                    return TaskStatus.Running;
                                }
                            }

                            // 处理同步结果
                            if (typeof result === 'string') {
                                switch (result.toLowerCase()) {
                                    case 'success': return TaskStatus.Success;
                                    case 'failure': return TaskStatus.Failure;
                                    case 'running': return TaskStatus.Running;
                                    default: return TaskStatus.Success;
                                }
                            }

                            return result === true ? TaskStatus.Success :
                                result === false ? TaskStatus.Failure : TaskStatus.Success;

                        } catch (error) {
                            console.error(`[event-action] 事件 ${eventActionName} 执行失败:`, error);
                            return TaskStatus.Failure;
                        }
                    });
                } else {
                    console.warn('[event-action] 缺少 eventName 属性');
                    node = new ExecuteAction<T>(() => TaskStatus.Failure);
                }
                break;

            case 'event-condition':
                const eventConditionName = props.eventName;
                if (eventConditionName && typeof eventConditionName === 'string') {
                    node = new ExecuteActionConditional<T>((ctx: T) => {
                        try {
                            // 从上下文中获取事件注册表
                            const eventRegistry = (ctx as any).eventRegistry;
                            if (!eventRegistry) {
                                console.warn(`[event-condition] 未找到事件注册表，请在执行上下文中提供 eventRegistry`);
                                return TaskStatus.Failure;
                            }

                            // 获取条件处理器
                            const checker = eventRegistry.getConditionHandler ?
                                eventRegistry.getConditionHandler(eventConditionName) :
                                eventRegistry.handlers?.get(eventConditionName);

                            if (!checker) {
                                console.warn(`[event-condition] 未找到条件处理器: ${eventConditionName}`);
                                return TaskStatus.Failure;
                            }

                            // 解析参数
                            let parameters = {};
                            if (props.parameters) {
                                if (typeof props.parameters === 'string') {
                                    try {
                                        parameters = JSON.parse(props.parameters);
                                    } catch (e) {
                                        console.warn(`[event-condition] 参数解析失败: ${props.parameters}`);
                                    }
                                } else {
                                    parameters = props.parameters;
                                }

                                // 支持黑板变量替换
                                const blackboard = (ctx as any).blackboard;
                                if (blackboard) {
                                    parameters = BehaviorTreeBuilder.replaceBlackboardVariables(parameters, blackboard);
                                }
                            }

                            // 执行条件检查
                            const result = checker(ctx, parameters);

                            // 处理异步结果
                            if (result instanceof Promise) {
                                console.warn(`[event-condition] 条件 ${eventConditionName} 返回Promise，条件节点不支持异步操作`);
                                return TaskStatus.Failure;
                            }

                            return result ? TaskStatus.Success : TaskStatus.Failure;

                        } catch (error) {
                            console.error(`[event-condition] 条件 ${eventConditionName} 检查失败:`, error);
                            return TaskStatus.Failure;
                        }
                    });
                } else {
                    console.warn('[event-condition] 缺少 eventName 属性');
                    node = new ExecuteActionConditional<T>(() => TaskStatus.Failure);
                }
                break;

            // ========== 黑板动作节点 ==========
            case 'set-blackboard-value':
                const rawVariableName = String(props.variableName || 'variable');
                // 清理变量名，移除黑板变量引用语法 {{variableName}}
                const setVariableName = rawVariableName.replace(/^\{\{|\}\}$/g, '');
                const setValue = props.value;
                const setSourceVariable = props.sourceVariable ? String(props.sourceVariable).replace(/^\{\{|\}\}$/g, '') : undefined;
                const setForce = props.force === true;
                node = new SetBlackboardValue<T>(setVariableName, setValue, setSourceVariable, setForce);
                break;

            case 'add-to-blackboard':
            case 'add-blackboard-value':
                node = new AddToBlackboardValue<T>(
                    String(props.variableName || 'variable'),
                    Number(props.increment) || 1,
                    props.incrementVariable ? String(props.incrementVariable) : undefined
                );
                break;

            case 'toggle-blackboard-bool':
                node = new ToggleBlackboardBool<T>(String(props.variableName || 'variable'));
                break;

            case 'reset-blackboard-variable':
                node = new ResetBlackboardVariable<T>(String(props.variableName || 'variable'));
                break;

            case 'math-blackboard-operation':
                const mathOperation = String(props.operation || 'add');
                const mathOperand2Value = typeof props.operand2 === 'string' ? props.operand2 : Number(props.operand2 || 0);
                node = new MathBlackboardOperation<T>(
                    String(props.targetVariable || 'result'),
                    String(props.operand1Variable || 'operand1'),
                    mathOperand2Value,
                    MathOperation[mathOperation as keyof typeof MathOperation] || MathOperation.Add
                );
                break;

            case 'log-blackboard-value':
                node = new LogBlackboardValue<T>(
                    String(props.variableName || 'variable'),
                    String(props.prefix || '[Blackboard]')
                );
                break;

            case 'wait-blackboard-condition':
                const waitVarName = String(props.variableName || 'variable');
                const expectedValue = props.expectedValue;
                node = new WaitForBlackboardCondition<T>(waitVarName, expectedValue);
                break;

            // ========== 黑板条件节点 ==========
            case 'blackboard-value-comparison':
                const operatorStr = String(props.operator || props.compareOperator || 'equal');
                // 映射操作符字符串到枚举
                let operator: CompareOperator;
                switch (operatorStr.toLowerCase()) {
                    case 'equal': operator = CompareOperator.Equal; break;
                    case 'notequal': case 'not_equal': operator = CompareOperator.NotEqual; break;
                    case 'greater': operator = CompareOperator.Greater; break;
                    case 'greaterorequal': case 'greater_or_equal': operator = CompareOperator.GreaterOrEqual; break;
                    case 'less': operator = CompareOperator.Less; break;
                    case 'lessorequal': case 'less_or_equal': operator = CompareOperator.LessOrEqual; break;
                    case 'contains': operator = CompareOperator.Contains; break;
                    case 'notcontains': case 'not_contains': operator = CompareOperator.NotContains; break;
                    default: operator = CompareOperator.Equal; break;
                }

                node = new ExecuteActionConditional<T>((ctx: T) => {
                    const conditional = new BlackboardValueComparison<T>(
                        String(props.variableName || 'variable'),
                        operator,
                        props.compareValue,
                        props.compareVariable ? String(props.compareVariable) : undefined
                    );
                    return conditional.update(ctx);
                });
                break;

            case 'blackboard-variable-exists':
                node = new ExecuteActionConditional<T>((ctx: T) => {
                    const conditional = new BlackboardVariableExists<T>(
                        String(props.variableName || 'variable'),
                        props.invert === true
                    );
                    return conditional.update(ctx);
                });
                break;

            case 'blackboard-variable-type-check':
                const expectedTypeStr = String(props.expectedType || 'string');
                // 映射类型字符串到枚举
                const expectedType = BehaviorTreeBuilder.mapToBlackboardType(expectedTypeStr);

                node = new ExecuteActionConditional<T>((ctx: T) => {
                    const conditional = new BlackboardVariableTypeCheck<T>(
                        String(props.variableName || 'variable'),
                        expectedType
                    );
                    return conditional.update(ctx);
                });
                break;

            case 'blackboard-variable-range-check':
                node = new ExecuteActionConditional<T>((ctx: T) => {
                    const conditional = new BlackboardVariableRangeCheck<T>(
                        String(props.variableName || 'variable'),
                        Number(props.minValue) || 0,
                        Number(props.maxValue) || 100
                    );
                    return conditional.update(ctx);
                });
                break;

            // ========== 通用条件节点 ==========
            case 'numeric-comparison':
                node = new ExecuteActionConditional<T>((ctx: T) => {
                    const conditional = new NumericComparison<T>(
                        String(props.propertyPath || 'value'),
                        String(props.compareOperator || 'equal') as 'greater' | 'less' | 'equal' | 'greaterEqual' | 'lessEqual' | 'notEqual',
                        Number(props.compareValue) || 0
                    );
                    return conditional.update(ctx);
                });
                break;

            case 'property-exists':
                node = new ExecuteActionConditional<T>((ctx: T) => {
                    const conditional = new PropertyExists<T>(String(props.propertyPath || 'property'));
                    return conditional.update(ctx);
                });
                break;



            // ========== 高级装饰器节点 ==========
            case 'cooldown':
                const cooldownTime = Number(props.cooldownTime) || 1.0;
                node = new CooldownDecorator<T>(cooldownTime);
                break;

            case 'timeout':
                const timeoutDuration = Number(props.timeoutDuration) || 5.0;
                node = new TimeoutDecorator<T>(timeoutDuration);
                break;

            case 'chance':
                const successChance = Number(props.successChance) || 0.5;
                node = new ChanceDecorator<T>(successChance);
                break;

            default:
                console.warn('⚠️ 未知的节点类型:', nodeConfig.type, '，使用默认成功节点');
                node = new ExecuteAction<T>(() => TaskStatus.Success);
                break;
        }

        // 为复合节点和装饰器添加子节点
        if (nodeConfig.children && nodeConfig.children.length > 0) {
            if (node instanceof Composite) {
                // 复合节点可以有多个子节点
                for (const childId of nodeConfig.children) {
                    const childConfig = nodeMap.get(childId);
                    if (childConfig) {
                        const childNode = BehaviorTreeBuilder.createNodeFromJSONConfig<T>(childConfig, nodeMap, context);
                        (node as Composite<T>).addChild(childNode);
                    } else {
                        console.warn(`⚠️ 未找到子节点配置: ${childId}`);
                    }
                }
            } else if (node instanceof Decorator) {
                // 装饰器只能有一个子节点
                if (nodeConfig.children.length > 1) {
                    console.warn('⚠️ 装饰器节点只能有一个子节点，将使用第一个');
                }
                const childId = nodeConfig.children[0];
                const childConfig = nodeMap.get(childId);
                if (childConfig) {
                    const childNode = BehaviorTreeBuilder.createNodeFromJSONConfig<T>(childConfig, nodeMap, context);
                    (node as Decorator<T>).child = childNode;
                } else {
                    console.warn(`⚠️ 未找到子节点配置: ${childId}`);
                }
            }
        }

        return node;
    }

    /**
     * 创建条件函数
     * @param condition 条件配置
     * @param context 执行上下文
     * @returns 条件检查函数
     */
    private static createConditionFunction<T>(condition: ConditionConfig | undefined, context: T): (ctx: T) => TaskStatus {
        if (!condition) {
            return () => TaskStatus.Success;
        }

        if (condition.type === 'condition-custom') {
            const conditionCodeConfig = condition.properties?.conditionCode;
            const conditionCode = typeof conditionCodeConfig === 'string' ? conditionCodeConfig :
                (typeof conditionCodeConfig === 'object' && conditionCodeConfig && 'value' in conditionCodeConfig ?
                    String((conditionCodeConfig as { value: unknown }).value) : undefined);

            if (conditionCode && typeof conditionCode === 'string') {
                try {
                    const condFunc = new Function('context', `
                        try {
                            return (${conditionCode})(context);
                        } catch (error) {
                            console.error('条件函数执行错误:', error);
                            return false;
                        }
                    `);
                    return (ctx: T) => {
                        try {
                            const result = condFunc(ctx);
                            return result ? TaskStatus.Success : TaskStatus.Failure;
                        } catch (error) {
                            console.error('条件函数执行失败:', error);
                            return TaskStatus.Failure;
                        }
                    };
                } catch (error) {
                    console.warn('解析条件函数失败:', error);
                }
            }
        }

        return () => TaskStatus.Success;
    }

    /**
     * 替换对象中的黑板变量引用
     * @param obj 要处理的对象
     * @param blackboard 黑板实例
     * @returns 替换后的对象
     */
    private static replaceBlackboardVariables(obj: any, blackboard: any): any {
        if (obj === null || obj === undefined) {
            return obj;
        }

        if (typeof obj === 'string') {
            // 检查是否是纯黑板变量引用（如 "{{variableName}}"）
            const pureVariableMatch = obj.match(/^{{\s*(\w+)\s*}}$/);
            if (pureVariableMatch) {
                // 纯变量引用，返回原始类型的值
                const varName = pureVariableMatch[1];
                const value = blackboard.getValue(varName);
                if (value !== undefined) {
                    return value; // 保持原始类型
                }
                return obj; // 变量不存在，返回原字符串
            }

            // 包含变量的字符串模板，进行字符串替换
            return obj.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
                const value = blackboard.getValue(varName);
                return value !== undefined ? String(value) : match;
            });
        }

        if (Array.isArray(obj)) {
            // 处理数组
            return obj.map(item => BehaviorTreeBuilder.replaceBlackboardVariables(item, blackboard));
        }

        if (typeof obj === 'object') {
            // 处理对象
            const result: any = {};
            for (const [key, value] of Object.entries(obj)) {
                result[key] = BehaviorTreeBuilder.replaceBlackboardVariables(value, blackboard);
            }
            return result;
        }

        return obj;
    }

    /**
     * 提取嵌套属性值
     * @param prop 属性配置对象或直接值
     * @returns 提取的值
     */
    private static extractNestedValue(prop: any): any {
        if (prop === null || prop === undefined) {
            return prop;
        }

        // 如果是简单值，直接返回
        if (typeof prop !== 'object') {
            return prop;
        }

        // 如果有value属性，递归提取
        if ('value' in prop) {
            return BehaviorTreeBuilder.extractNestedValue(prop.value);
        }

        return prop;
    }
}
