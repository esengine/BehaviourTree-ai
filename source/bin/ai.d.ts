declare module behaviourTree {
    /**
     * 所有节点的根类
     */
    abstract class Behavior<T> {
        status: TaskStatus;
        abstract update(context: T): TaskStatus;
        /**
         * 使该节点的状态无效。
         * 组合体可以覆盖这一点并使其所有的子节点失效
         */
        invalidate(): void;
        /**
         * 在执行前立即调用。
         * 它被用来设置任何需要从上一次运行中重置的变量
         */
        onStart(): void;
        /**
         * 当一个任务的状态改变为运行以外的其他状态时被调用
         */
        onEnd(): void;
        /**
         * tick处理调用，以更新实际工作完成的地方。
         * 它的存在是为了在必要时可以调用onStart/onEnd。
         * @param context
         * @returns
         */
        tick(context: T): TaskStatus;
    }
}
declare module behaviourTree {
    /**
     * 用来控制BehaviorTree的根类
     */
    class BehaviorTree<T> {
        /**
         * 行为树应该多久更新一次。updatePeriod为0.2将使行为树每秒更新5次
         */
        updatePeriod: number;
        /**
         * 上下文应包含运行树所需的所有数据
         */
        private _context;
        /**
         * 树的根节点
         */
        private _root;
        private _elapsedTime;
        constructor(context: T, rootNode: Behavior<T>, updatePeriod?: number);
        tick(): void;
    }
}
declare module behaviourTree {
    /**
     * 帮助器，用于使用流畅的API构建BehaviorTree。
     * 叶子节点需要首先添加一个父节点。
     * 父节点可以是组合体或装饰体。
     * 当叶子节点被添加时，装饰器会自动关闭。
     * 组合体必须调用endComposite来关闭它们。
     */
    class BehaviorTreeBuilder<T> {
        private _context;
        /** 最后创建的节点 */
        private _currentNode;
        /** 堆栈节点，我们是通过fluent API来建立的 */
        private _parentNodeStack;
        constructor(context: T);
        static begin<T>(context: T): BehaviorTreeBuilder<T>;
        private setChildOnParent;
        private pushParentNode;
        private endDecorator;
        action(func: (t: T) => TaskStatus): BehaviorTreeBuilder<T>;
        actionR(func: (t: T) => boolean): BehaviorTreeBuilder<T>;
        conditional(func: (t: T) => TaskStatus): BehaviorTreeBuilder<T>;
        conditionalR(func: (t: T) => boolean): BehaviorTreeBuilder<T>;
        logAction(text: string): BehaviorTreeBuilder<T>;
        waitAction(waitTime: number): BehaviorTreeBuilder<T>;
        subTree(subTree: BehaviorTree<T>): BehaviorTreeBuilder<T>;
        conditionalDecorator(func: (t: T) => TaskStatus, shouldReevaluate?: boolean): BehaviorTreeBuilder<T>;
        conditionalDecoratorR(func: (t: T) => boolean, shouldReevaluate?: boolean): BehaviorTreeBuilder<T>;
        alwaysFail(): BehaviorTreeBuilder<T>;
        alwaysSucceed(): BehaviorTreeBuilder<T>;
        inverter(): BehaviorTreeBuilder<T>;
        repeater(count: number): BehaviorTreeBuilder<T>;
        untilFail(): BehaviorTreeBuilder<T>;
        untilSuccess(): BehaviorTreeBuilder<T>;
        paraller(): BehaviorTreeBuilder<T>;
        parallelSelector(): BehaviorTreeBuilder<T>;
        selector(abortType?: AbortTypes): BehaviorTreeBuilder<T>;
        randomSelector(): BehaviorTreeBuilder<T>;
        sequence(abortType?: AbortTypes): this;
        randomSequence(): BehaviorTreeBuilder<T>;
        endComposite(): BehaviorTreeBuilder<T>;
        build(updatePeriod?: number): BehaviorTree<T>;
    }
}
declare module behaviourTree {
    enum TaskStatus {
        Invalid = 0,
        Success = 1,
        Failure = 2,
        Running = 3
    }
}
declare module behaviourTree {
    /**
     * 作为子项运行整个BehaviorTree并返回成功
     */
    class BehaviorTreeReference<T> extends Behavior<T> {
        private _childTree;
        constructor(tree: BehaviorTree<T>);
        update(context: T): TaskStatus;
    }
}
declare module behaviourTree {
    /**
     * 包装一个Func，以便您可以避免必须子类来创建新操作
     */
    class ExecuteAction<T> extends Behavior<T> {
        /**
         * Func<T, TaskStatus>
         */
        private _action;
        /**
         * Func<T, TaskStatus>
         */
        constructor(action: (t: T) => TaskStatus);
        update(context: T): TaskStatus;
    }
}
declare module behaviourTree {
    /**
     * 简单的任务，它将输出指定的文本并返回成功。 它可以用于调试。
     */
    class LogAction<T> extends Behavior<T> {
        /** 文本 */
        text: string;
        /** 是否输出error还是log */
        isError: boolean;
        constructor(text: string);
        update(context: T): TaskStatus;
    }
}
declare module behaviourTree {
    /**
     * 等待指定的时间。 任务将返回运行，直到任务完成等待。 在等待时间结束后它将返回成功。
     */
    class WaitAciton<T> extends Behavior<T> {
        /** 等待的时间 */
        waitTime: number;
        private _startTime;
        constructor(waitTime: number);
        onStart(): void;
        update(context: T): TaskStatus;
    }
}
declare module behaviourTree {
    enum AbortTypes {
        /**
         * 没有中止类型。 即使其他条件更改了状态，当前操作也将始终运行
         */
        None = 0,
        /**
         * 如果一个更重要的有条件的任务改变了状态，它可以发出一个中止指令，使低优先级的任务停止运行，并将控制权转回高优先级的分支。
         * 这种类型应该被设置在作为讨论中的复合体的子体的复合体上。
         * 父复合体将检查它的子体，看它们是否有LowerPriority中止。
         */
        LowerPriority = 1,
        /**
         * 只有当它们都是复合体的子任务时，条件任务才能中止一个行动任务。
         * 这个AbortType只影响它所设置的实际的Composite，不像LowerPriority会影响其父Composite。
         */
        Self = 2,
        /**
         * 检查LowerPriority和Self aborts
         */
        Both = 3
    }
    class AbortTypesExt {
        static has(self: AbortTypes, check: AbortTypes): boolean;
    }
}
declare module behaviourTree {
    /**
     * 任何复合节点必须子类化这个。为子节点和助手提供存储，以处理AbortTypes。
     */
    abstract class Composite<T> extends Behavior<T> {
        abortType: AbortTypes;
        protected _children: Array<Behavior<T>>;
        protected _hasLowerPriorityConditionalAbort: boolean;
        protected _currentChildIndex: number;
        invalidate(): void;
        onStart(): void;
        onEnd(): void;
        /**
         * 检查复合体的子代，看是否有具有LowerPriority AbortType的复合体
         */
        private hasLowerPriorityConditionalAbortInChildren;
        /**
         * 为这个复合体添加一个子节点
         */
        addChild(child: Behavior<T>): void;
        /**
         * 如果一个复合体的第一个子节点是一个条件体，返回true。用来处理条件性中止
         */
        isFirstChildConditional(): boolean;
        /**
         * 检查任何IConditional的子代，看它们是否已经改变了状态
         */
        protected updateSelfAbortConditional(context: T, statusCheck: TaskStatus): void;
        /**
         * 检查任何具有LowerPriority AbortType和Conditional作为第一个子代的组合体。
         * 如果它找到一个，它将执行条件，如果状态不等于 statusCheck，_currentChildIndex将被更新，即当前运行的Action将被中止。
         */
        protected updateLowerPriorityAbortConditional(context: T, statusCheck: TaskStatus): void;
        /**
         * 帮助器，用于获取一个条件或一个条件装饰器的任务状态
         * @param context
         * @param node
         * @returns
         */
        private updateConditionalNode;
    }
}
declare module behaviourTree {
    /**
     * 并行任务将运行每个子任务，直到一个子任务返回失败。
     * 不同的是，并行任务将同时运行其所有的子任务，而不是一次运行每个任务。
     * 像序列类一样，一旦它的所有子任务都返回成功，并行任务将返回成功。
     * 如果一个任务返回失败，并行任务将结束所有的子任务并返回失败。
     */
    class Parallel<T> extends Composite<T> {
        update(context: T): TaskStatus;
    }
}
declare module behaviourTree {
    /**
     * 与选择器任务类似，ParallelSelector任务一旦有子任务返回成功，就会返回成功。
     * 不同的是，并行任务将同时运行其所有的子任务，而不是一次运行每个任务。
     * 如果一个任务返回成功，并行选择器任务将结束所有的子任务并返回成功。
     * 如果每个子任务都返回失败，那么ParallelSelector任务将返回失败。
     */
    class ParallelSelector<T> extends Composite<T> {
        update(context: T): TaskStatus;
    }
}
declare module behaviourTree {
    /**
     * 选择器任务类似于一个 "或 "操作。只要它的一个子任务返回成功，它就会返回成功。
     * 如果一个子任务返回失败，那么它将依次运行下一个任务。
     * 如果没有子任务返回成功，那么它将返回失败
     */
    class Selector<T> extends Composite<T> {
        constructor(abortType?: AbortTypes);
        update(context: T): TaskStatus;
        private handleConditionalAborts;
    }
}
declare module behaviourTree {
    /**
     * 与选择器相同，但它会在启动时无序处理子项
     */
    class RandomSelector<T> extends Selector<T> {
        onStart(): void;
    }
}
declare module behaviourTree {
    /**
     * 序列任务类似于一个 "和 "的操作。只要它的一个子任务返回失败，它就会返回失败。
     * 如果一个子任务返回成功，那么它将依次运行下一个任务。
     * 如果所有子任务都返回成功，那么它将返回成功。
     */
    class Sequence<T> extends Composite<T> {
        constructor(abortType?: AbortTypes);
        update(context: T): TaskStatus;
        private handleConditionalAborts;
    }
}
declare module behaviourTree {
    /**
     * 与sequence相同，只是它在开始时对子级进行无序处理
     */
    class RandomSequence<T> extends Sequence<T> {
        onStart(): void;
    }
}
declare module behaviourTree {
    /**
     * 包装一个ExecuteAction，这样它就可以作为一个ConditionalAction使用
     */
    class ExecuteActionConditional<T> extends ExecuteAction<T> implements IConditional<T> {
        constructor(action: (t: T) => TaskStatus);
    }
}
declare module behaviourTree {
    interface IConditional<T> {
        update(context: T): TaskStatus;
    }
    var isIConditional: (props: any) => props is IConditional<any>;
}
declare module behaviourTree {
    /**
     * 当随机概率高于successProbability概率时返回成功。
     * 否则它将返回失败。
     * successProbability应该在0和1之间
     */
    class RandomProbability<T> extends Behavior<T> implements IConditional<T> {
        /** 任务返回成功的机会 */
        private _successProbability;
        constructor(successProbability: number);
        update(context: T): TaskStatus;
    }
}
declare module behaviourTree {
    abstract class Decorator<T> extends Behavior<T> {
        child: Behavior<T>;
        invalidate(): void;
    }
}
declare module behaviourTree {
    /**
     * 将总是返回失败，除了当子任务正在运行时
     */
    class AlwaysFail<T> extends Decorator<T> {
        update(context: T): TaskStatus;
    }
}
declare module behaviourTree {
    /**
     *  将总是返回成功，除了当子任务正在运行时
     */
    class AlwaysSucceed<T> extends Decorator<T> {
        update(context: T): TaskStatus;
    }
}
declare module behaviourTree {
    /**
     * 装饰器，只有在满足条件的情况下才会运行其子程序。
     * 默认情况下，该条件将在每一次执行中被重新评估
     */
    class ConditionalDecorator<T> extends Decorator<T> implements IConditional<T> {
        private _conditional;
        private _shouldReevaluate;
        private _conditionalStatus;
        constructor(conditional: IConditional<T>, shouldReevalute?: boolean);
        invalidate(): void;
        onStart(): void;
        update(context: T): TaskStatus;
        /**
         * 在shouldReevaluate标志之后执行条件，或者用一个选项来强制更新。
         * 终止将强制更新，以确保他们在条件变化时得到适当的数据。
         */
        executeConditional(context: T, forceUpdate?: boolean): TaskStatus;
    }
}
declare module behaviourTree {
    /**
     * 反转结果的子节点
     */
    class Inverter<T> extends Decorator<T> {
        update(context: T): TaskStatus;
    }
}
declare module behaviourTree {
    /**
     * 将重复执行其子任务，直到子任务被运行了指定的次数。
     * 即使子任务返回失败，它也可以选择继续执行子任务
     */
    class Repeater<T> extends Decorator<T> {
        /** 重复执行其子任务的次数 */
        count: number;
        /** 是否永远重复 */
        repeatForever: boolean;
        /** 如果子任务返回失败，该任务是否应该返回 */
        endOnFailure: boolean;
        private _iterationCount;
        constructor(count: number, endOnFailure?: boolean);
        onStart(): void;
        update(context: T): TaskStatus;
    }
}
declare module behaviourTree {
    /**
     * 将继续执行其子任务，直到子任务返回失败
     */
    class UntilFail<T> extends Decorator<T> {
        update(context: T): TaskStatus;
    }
}
declare module behaviourTree {
    /**
     * 将继续执行其子任务，直到子任务返回成功
     */
    class UntilSuccess<T> extends Decorator<T> {
        update(context: T): TaskStatus;
    }
}
declare module behaviourTree {
    /**
     * 数组扩展器
     * 模拟 Stack<T>.
     */
    class ArrayExt {
        /**
         * 将数组打乱顺序
         */
        static shuffle<T>(list: Array<T>): void;
        /**
         * 取出数组第一个项
         */
        static peek<T>(list: Array<T>): T;
        /**
         * 向数组头部添加一个项
         */
        static push<T>(list: Array<T>, item: T): void;
        /**
         * 移除数组第一个项并返回它
         */
        static pop<T>(list: Array<T>): T | undefined;
    }
}
declare module behaviourTree {
    class Assert {
        static fail(message?: string, ...args: object[]): void;
        static isTrue(condition: boolean, message?: string, ...args: object[]): void;
        static isNotNull(obj: object | undefined, message: string, ...args: object[]): void;
        static isFalse(condition: boolean, message?: string, ...args: object[]): void;
    }
}
declare module behaviourTree {
    class Random {
        static range(min: number, max: number): number;
    }
}
declare module fsm {
    abstract class State<T> {
        protected _machine: StateMachine<T>;
        protected _context: T;
        setMachineAndContext(machine: StateMachine<T>, context: T): void;
        /**
         * 在设置machine和context之后直接调用，允许状态执行任何所需的设置
         *
         * @memberof State
         */
        onInitialized(): void;
        /**
         * 当状态变为活动状态时调用
         *
         * @memberof State
         */
        begin(): void;
        /**
         * 在更新之前调用，允许状态最后一次机会改变状态
         *
         * @memberof State
         */
        reason(): void;
        /**
         * 每个帧调用此状态为活动状态
         *
         * @abstract
         * @param {number} deltaTime
         * @memberof State
         */
        abstract update(deltaTime: number): void;
        /**
         * 此状态不再是活动状态时调用
         *
         * @memberof State
         */
        end(): void;
    }
}
declare module fsm {
    class StateMachine<T> {
        onStateChanged: () => void;
        readonly currentState: State<T>;
        previousState: State<T>;
        elapsedTimeInState: number;
        protected _currentState: State<T>;
        protected _context: T;
        private _states;
        constructor(context: T, initialState: State<T>);
        /**
         * 将状态添加到状态机
         * @param stateType
         * @param state
         */
        addState(state: State<T>): void;
        /**
         * 使用提供的增量时间为状态机计时
         * @param deltaTime
         */
        update(deltaTime: number): void;
        /**
         * 从机器获取特定状态，而不必对其进行更改。
         * @param type
         */
        getState<R extends State<T>>(type: new () => R): R | null;
        /**
         * 更改当前状态
         * @param newType
         */
        changeState<R extends State<T>>(newType: new () => R): R | null;
    }
}
declare module utilityAI {
    class UtilityAI<T> {
        /**
         * 行为树应该多久更新一次。 updatePeriod为0.2将使树每秒更新5次
         */
        updatePeriod: number;
        private _context;
        private _rootReasoner;
        private _elapsedTime;
        constructor(context: T, rootSelector: Reasoner<T>, updatePeriod?: number);
        tick(): void;
    }
}
declare module utilityAI {
    /**
     * 包装Action以用作IAction而无需创建新类
     */
    class ActionExecutor<T> implements IAction<T> {
        private _action;
        constructor(action: Function);
        execute(context: T): void;
    }
}
declare module utilityAI {
    /**
     * 包含选项列表的操作。
     * 这些选项将传递给Appraisals，从而对最佳选项进行评分并找到最佳选择。
     */
    abstract class ActionWithOptions<T, U> implements IAction<T> {
        protected _appraisals: Array<IActionOptionAppraisal<T, U>>;
        getBestOption(context: T, options: Array<U>): U | null;
        abstract execute(context: T): void;
        addScorer(scorer: IActionOptionAppraisal<T, U>): ActionWithOptions<T, U>;
    }
}
declare module utilityAI {
    /**
     * 包含将按顺序执行的动作列表的动作
     */
    class CompositeAction<T> implements IAction<T> {
        private _actions;
        execute(context: T): void;
        addAction(action: IAction<T>): CompositeAction<T>;
    }
}
declare module utilityAI {
    interface IAction<T> {
        execute(context: T): void;
    }
}
declare module utilityAI {
    interface IActionOptionAppraisal<T, U> {
        getScore(context: T, option: U): number;
    }
}
declare module utilityAI {
    class LogAction<T> implements IAction<T> {
        private _text;
        constructor(text: string);
        execute(context: T): void;
    }
}
declare module utilityAI {
    /**
     * 调用另一个Reasoner的操作
     */
    class ReasonerAction<T> implements IAction<T> {
        private _reasoner;
        constructor(reasoner: Reasoner<T>);
        execute(context: T): void;
    }
}
declare module utilityAI {
    /**
     * 只有当所有的子项得分高于阈值的分数
     */
    class AllOrNothingConsideration<T> implements IConsideration<T> {
        threshold: number;
        action: IAction<T>;
        private _appraisals;
        constructor(threshold?: number);
        addAppraisal(appraisal: IAppraisal<T>): this;
        getScore(context: T): number;
    }
}
declare module utilityAI {
    /**
     * 总是返回一个固定的分数。 作为默认考虑，提供双重任务。
     */
    class FixedScoreConsideration<T> implements IConsideration<T> {
        score: number;
        action: IAction<T>;
        constructor(score?: number);
        getScore(context: T): number;
    }
}
declare module utilityAI {
    /**
     * 封装一个Action并生成一个分数，Reasoner可以使用该分数来决定使用哪个代价
     */
    interface IConsideration<T> {
        action: IAction<T>;
        getScore(context: T): number;
    }
}
declare module utilityAI {
    /**
     * 通过总结所有子项评估的分数得分
     */
    class SumOfChildrenConsideration<T> implements IConsideration<T> {
        action: IAction<T>;
        private _appraisals;
        getScore(context: T): number;
    }
}
declare module utilityAI {
    /**
     * 通过总结子项评估得分，直到子项得分低于阈值
     */
    class ThresholdConsideration<T> implements IConsideration<T> {
        threshold: number;
        action: IAction<T>;
        private _appraisals;
        constructor(threshold: number);
        getScore(context: T): number;
    }
}
declare module utilityAI {
    /**
     * 包装Func以用作评估而无需创建子类
     */
    class ActionAppraisal<T> implements IAppraisal<T> {
        private _appraisalAction;
        constructor(appraisalAction: Function);
        getScore(context: T): number;
    }
}
declare module utilityAI {
    interface IAppraisal<T> {
        getScore(context: T): number;
    }
}
declare module utilityAI {
    /**
     * UtilityAI的根节点
     */
    abstract class Reasoner<T> {
        defaultConsideration: IConsideration<T>;
        protected _condiderations: Array<IConsideration<T>>;
        select(context: T): IAction<T> | null;
        protected abstract selectBestConsideration(context: T): IConsideration<T>;
        addConsideration(consideration: IConsideration<T>): Reasoner<T>;
        setDefaultConsideration(defaultConsideration: IConsideration<T>): Reasoner<T>;
    }
}
declare module utilityAI {
    /**
     * 选择高于默认考虑分数的第一个考虑因素
     */
    class FirstScoreReasoner<T> extends Reasoner<T> {
        protected selectBestConsideration(context: T): IConsideration<T>;
    }
}
declare module utilityAI {
    /**
     * 选择评分最高的考虑因素
     */
    class HighestScoreReasoner<T> extends Reasoner<T> {
        protected selectBestConsideration(context: T): IConsideration<T>;
    }
}
