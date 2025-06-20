import { Behavior } from './Behavior';
import { BehaviorTree } from './BehaviorTree';
import { TaskStatus } from './TaskStatus';
import { Composite } from './composites/Composite';
import { Decorator } from './decorators/Decorator';
import { ExecuteAction } from './actions/ExecuteAction';
import { ExecuteActionConditional } from './conditionals/ExecuteActionConditional';
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

/**
 * 行为树配置接口
 */
export interface BehaviorTreeConfig {
    version: string;
    type: string;
    metadata?: any;
    tree: NodeConfig;
}

/**
 * 节点配置接口
 */
export interface NodeConfig {
    id: string;
    type: string;
    namespace?: string;
    properties?: Record<string, PropertyConfig>;
    children?: NodeConfig[];
}

/**
 * 属性配置接口
 */
export interface PropertyConfig {
    type: string;
    value: any;
}

/**
 * 帮助器，用于使用流畅的API构建BehaviorTree。
 * 叶子节点需要首先添加一个父节点。
 * 父节点可以是组合体或装饰体。
 * 当叶子节点被添加时，装饰器会自动关闭。
 * 组合体必须调用endComposite来关闭它们。
 */
export class BehaviorTreeBuilder<T> {
    private _context: T;
    /** 最后创建的节点 */
    private _currentNode: Behavior<T> | undefined;
    /** 堆栈节点，我们是通过fluent API来建立的 */
    private _parentNodeStack: Array<Behavior<T>> = new Array<Behavior<T>>();

    public constructor(context: T) {
        this._context = context;
    }

    public static begin<T>(context: T): BehaviorTreeBuilder<T> {
        return new BehaviorTreeBuilder<T>(context);
    }

    private setChildOnParent(child: Behavior<T>): BehaviorTreeBuilder<T> {
        let parent = this._parentNodeStack[this._parentNodeStack.length - 1];
        if (parent instanceof Composite) {
            (parent as Composite<T>).addChild(child);
        }
        else if (parent instanceof Decorator) {
            // 装饰者只有一个子节点，所以自动结束
            (parent as Decorator<T>).child = child;
            this.endDecorator();
        }

        return this;
    }

    private pushParentNode(composite: Behavior<T>) {
        if (this._parentNodeStack.length > 0)
            this.setChildOnParent(composite);

        this._parentNodeStack.push(composite);
        return this;
    }

    private endDecorator(): BehaviorTreeBuilder<T> {
        this._currentNode = this._parentNodeStack.pop();
        return this;
    }

    public action(func: (t: T) => TaskStatus): BehaviorTreeBuilder<T> {
        if (this._parentNodeStack.length == 0) {
            throw new Error("无法创建无嵌套的动作节点，它必须是一个叶节点");
        }
        return this.setChildOnParent(new ExecuteAction<T>(func));
    }

    public actionR(func: (t: T) => boolean): BehaviorTreeBuilder<T> {
        return this.action(t => func(t) ? TaskStatus.Success : TaskStatus.Failure);
    }

    public conditional(func: (t: T) => TaskStatus): BehaviorTreeBuilder<T> {
        if (this._parentNodeStack.length == 0) {
            throw new Error("无法创建无嵌套的条件节点，它必须是一个叶节点");
        }
        return this.setChildOnParent(new ExecuteActionConditional<T>(func));
    }

    public conditionalR(func: (t: T) => boolean): BehaviorTreeBuilder<T> {
        return this.conditional(t => func(t) ? TaskStatus.Success : TaskStatus.Failure);
    }

    public logAction(text: string): BehaviorTreeBuilder<T> {
        if (this._parentNodeStack.length == 0) {
            throw new Error("无法创建无嵌套的动作节点，它必须是一个叶节点");
        }
        return this.setChildOnParent(new LogAction<T>(text));
    }

    public waitAction(waitTime: number): BehaviorTreeBuilder<T> {
        if (this._parentNodeStack.length == 0) {
            throw new Error("无法创建无嵌套的动作节点，它必须是一个叶节点");
        }
        return this.setChildOnParent(new WaitAction<T>(waitTime));
    }

    public subTree(subTree: BehaviorTree<T>): BehaviorTreeBuilder<T> {
        if (this._parentNodeStack.length == 0) {
            throw new Error("无法创建无嵌套的动作节点，它必须是一个叶节点");
        }
        return this.setChildOnParent(new BehaviorTreeReference<T>(subTree));
    }

    public conditionalDecorator(func: (t: T) => TaskStatus, shouldReevaluate: boolean = true): BehaviorTreeBuilder<T> {
        let conditional = new ExecuteActionConditional<T>(func);
        return this.pushParentNode(new ConditionalDecorator<T>(conditional, shouldReevaluate));
    }

    public conditionalDecoratorR(func: (t: T) => boolean, shouldReevaluate: boolean = true): BehaviorTreeBuilder<T> {
        return this.conditionalDecorator(t => func(t) ? TaskStatus.Success : TaskStatus.Failure, shouldReevaluate);
    }

    public alwaysFail(): BehaviorTreeBuilder<T> {
        return this.pushParentNode(new AlwaysFail<T>());
    }

    public alwaysSucceed(): BehaviorTreeBuilder<T> {
        return this.pushParentNode(new AlwaysSucceed<T>());
    }

    public inverter(): BehaviorTreeBuilder<T> {
        return this.pushParentNode(new Inverter());
    }

    public repeater(count: number): BehaviorTreeBuilder<T> {
        return this.pushParentNode(new Repeater<T>(count));
    }

    public untilFail(): BehaviorTreeBuilder<T> {
        return this.pushParentNode(new UntilFail<T>());
    }

    public untilSuccess(): BehaviorTreeBuilder<T> {
        return this.pushParentNode(new UntilSuccess<T>());
    }

    public paraller(): BehaviorTreeBuilder<T> {
        return this.pushParentNode(new Parallel<T>());
    }

    public parallelSelector(): BehaviorTreeBuilder<T> {
        return this.pushParentNode(new ParallelSelector<T>());
    }

    public selector(abortType: AbortTypes = AbortTypes.None): BehaviorTreeBuilder<T> {
        return this.pushParentNode(new Selector<T>(abortType));
    }

    public randomSelector(): BehaviorTreeBuilder<T> {
        return this.pushParentNode(new RandomSelector());
    }

    public sequence(abortType: AbortTypes = AbortTypes.None): BehaviorTreeBuilder<T> {
        return this.pushParentNode(new Sequence<T>(abortType));
    }

    public randomSequence(): BehaviorTreeBuilder<T> {
        return this.pushParentNode(new RandomSequence<T>());
    }

    public endComposite(): BehaviorTreeBuilder<T> {
        const topNode = this._parentNodeStack[this._parentNodeStack.length - 1];
        if (!(topNode instanceof Composite)) {
            throw new Error("尝试结束复合器，但顶部节点是装饰器");
        }
        this._currentNode = this._parentNodeStack.pop();
        return this;
    }

    public build(updatePeriod: number = 0.2): BehaviorTree<T> {
        if (!this._currentNode)
            throw new Error('无法创建零节点的行为树');

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
            console.log('🌳 开始从配置创建行为树:', config);
            
            if (!config || !config.tree) {
                throw new Error('配置无效：缺少tree属性');
            }

            const rootNode = BehaviorTreeBuilder.createNodeFromConfig<T>(config.tree);
            const updatePeriod = (config.metadata?.updatePeriod) || 0.2;
            
            console.log('✅ 行为树创建成功, 更新周期:', updatePeriod);
            return new BehaviorTree<T>(context, rootNode, updatePeriod);
        } catch (error: any) {
            console.error('❌ 从配置创建行为树失败:', error);
            throw new Error(`从配置创建行为树失败: ${error?.message || error}`);
        }
    }

    /**
     * 从节点配置创建节点实例
     * @param nodeConfig 节点配置
     * @returns 创建的节点实例
     */
    private static createNodeFromConfig<T>(nodeConfig: NodeConfig): Behavior<T> {
        console.log('🔧 创建节点:', nodeConfig.type, nodeConfig.id);
        
        let node: Behavior<T>;
        
        // 根据节点类型创建对应的节点实例
        switch (nodeConfig.type) {
            // 复合节点
            case 'Sequence':
                const sequenceAbortType = BehaviorTreeBuilder.getAbortType(nodeConfig.properties?.abortType?.value);
                node = new Sequence<T>(sequenceAbortType);
                break;
                
            case 'Selector':
                const selectorAbortType = BehaviorTreeBuilder.getAbortType(nodeConfig.properties?.abortType?.value);
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
                const count = nodeConfig.properties?.count?.value || 1;
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
                const message = nodeConfig.properties?.message?.value || 'Default log message';
                node = new LogAction<T>(message);
                break;
                
            case 'WaitAction':
                const waitTime = nodeConfig.properties?.waitTime?.value || 1.0;
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

        console.log('✅ 节点创建完成:', nodeConfig.type);
        return node;
    }

    /**
     * 解析中止类型
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
}
