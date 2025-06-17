import { Behavior } from './Behavior.js';
import { BehaviorTree } from './BehaviorTree.js';
import { TaskStatus } from './TaskStatus.js';
import { Composite } from './composites/Composite.js';
import { Decorator } from './decorators/Decorator.js';
import { ExecuteAction } from './actions/ExecuteAction.js';
import { ExecuteActionConditional } from './conditionals/ExecuteActionConditional.js';
import { LogAction } from './actions/LogAction.js';
import { WaitAction } from './actions/WaitAction.js';
import { BehaviorTreeReference } from './actions/BehaviorTreeReference.js';
import { ConditionalDecorator } from './decorators/ConditionalDecorator.js';
import { AlwaysFail } from './decorators/AlwaysFail.js';
import { AlwaysSucceed } from './decorators/AlwaysSucceed.js';
import { Inverter } from './decorators/Inverter.js';
import { Repeater } from './decorators/Repeater.js';
import { UntilFail } from './decorators/UntilFail.js';
import { UntilSuccess } from './decorators/UntilSuccess.js';
import { Parallel } from './composites/Parallel.js';
import { ParallelSelector } from './composites/ParallelSelector.js';
import { Selector } from './composites/Selector.js';
import { RandomSelector } from './composites/RandomSelector.js';
import { Sequence } from './composites/Sequence.js';
import { RandomSequence } from './composites/RandomSequence.js';
import { AbortTypes } from './composites/AbortTypes.js';

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
}
