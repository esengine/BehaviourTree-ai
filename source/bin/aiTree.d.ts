declare abstract class Behavior<T> {
    status: TaskStatus;
    abstract update(context: T): TaskStatus;
    invalidate(): void;
    onStart(): void;
    onEnd(): void;
    tick(context: T): TaskStatus;
}
declare class BehaviorTree<T> {
    updatePeriod: number;
    lastUpdate: number;
    stepUpdateCounter: number;
    private _context;
    private _root;
    private _elapsedTime;
    constructor(context: T, rootNode: Behavior<T>, updatePeriod?: number);
    tick(): void;
}
declare class BehaviorTreeBuilder<T> {
    private _context;
    private _currentNode;
    private _parentNodeStack;
    constructor(context: T);
    static begin<T>(context: T): BehaviorTreeBuilder<T>;
    private setChildOnParent;
    private pushParentNode;
    private endDecorator;
    action(func: Function): BehaviorTreeBuilder<T>;
    actionR(func: Function): BehaviorTreeBuilder<T>;
    conditional(func: Function): BehaviorTreeBuilder<T>;
    conditionalR(func: Function): BehaviorTreeBuilder<T>;
    logAction(text: string): BehaviorTreeBuilder<T>;
    waitAction(waitTime: number): BehaviorTreeBuilder<T>;
    subTree(subTree: BehaviorTree<T>): BehaviorTreeBuilder<T>;
    conditionalDecorator(func: Function, shouldReevaluate?: boolean): BehaviorTreeBuilder<T>;
    conditionalDecoratorR(func: Function, shouldReevaluate?: boolean): BehaviorTreeBuilder<T>;
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
declare enum TaskStatus {
    Invalid = 0,
    Success = 1,
    Failure = 2,
    Running = 3
}
declare class BehaviorTreeReference<T> extends Behavior<T> {
    private _childTree;
    constructor(tree: BehaviorTree<T>);
    update(context: T): TaskStatus;
}
declare class ExecuteAction<T> extends Behavior<T> {
    private _action;
    constructor(action: Function);
    update(context: T): TaskStatus;
}
declare class LogAction<T> extends Behavior<T> {
    text: string;
    isError: boolean;
    constructor(text: string);
    update(context: T): TaskStatus;
}
declare class WaitAciton<T> extends Behavior<T> {
    waitTime: number;
    private _startTime;
    constructor(waitTime: number);
    onStart(): void;
    update(context: T): TaskStatus;
}
declare enum AbortTypes {
    None = 0,
    LowerPriority = 1,
    Self = 2,
    Both = 3
}
declare class AbortTypesExt {
    static has(self: AbortTypes, check: AbortTypes): boolean;
}
declare abstract class Composite<T> extends Behavior<T> {
    abortType: AbortTypes;
    protected _children: Array<Behavior<T>>;
    protected _hasLowerPriorityConditionalAbort: boolean;
    protected _currentChildIndex: number;
    invalidate(): void;
    onStart(): void;
    onEnd(): void;
    private hasLowerPriorityConditionalAbortInChildren;
    addChild(child: Behavior<T>): void;
    isFirstChildConditional(): boolean;
    protected updateSelfAbortConditional(context: T, statusCheck: TaskStatus): void;
    protected updateLowerPriorityAbortConditional(context: T, statusCheck: TaskStatus): void;
    private updateConditionalNode;
}
declare class Parallel<T> extends Composite<T> {
    update(context: T): TaskStatus;
}
declare class ParallelSelector<T> extends Composite<T> {
    update(context: T): TaskStatus;
}
declare class Selector<T> extends Composite<T> {
    constructor(abortType?: AbortTypes);
    update(context: T): TaskStatus;
    private handleConditionalAborts;
}
declare class RandomSelector<T> extends Selector<T> {
    onStart(): void;
}
declare class Sequence<T> extends Composite<T> {
    constructor(abortType?: AbortTypes);
    update(context: T): TaskStatus;
    private handleConditionalAborts;
}
declare class RandomSequence<T> extends Sequence<T> {
    onStart(): void;
}
declare class ExecuteActionConditional<T> extends ExecuteAction<T> implements IConditional<T> {
    constructor(action: Function);
}
interface IConditional<T> {
    update(context: T): TaskStatus;
}
declare class RandomProbability<T> extends Behavior<T> implements IConditional<T> {
    private _successProbability;
    constructor(successProbability: number);
    update(context: T): TaskStatus;
}
declare abstract class Decorator<T> extends Behavior<T> {
    child: Behavior<T>;
    invalidate(): void;
}
declare class AlwaysFail<T> extends Decorator<T> {
    update(context: T): TaskStatus;
}
declare class AlwaysSucceed<T> extends Decorator<T> {
    update(context: T): TaskStatus;
}
declare class ConditionalDecorator<T> extends Decorator<T> implements IConditional<T> {
    private _conditional;
    private _shouldReevaluate;
    private _conditionalStatus;
    constructor(conditional: IConditional<T>, shouldReevalute?: boolean);
    invalidate(): void;
    onStart(): void;
    update(context: T): TaskStatus;
    executeConditional(context: T, forceUpdate?: boolean): TaskStatus;
}
declare class Inverter<T> extends Decorator<T> {
    update(context: T): TaskStatus;
}
declare class Repeater<T> extends Decorator<T> {
    count: number;
    repeatForever: boolean;
    endOnFailure: boolean;
    private _iterationCount;
    constructor(count: number, endOnFailure?: boolean);
    onStart(): void;
    update(context: T): TaskStatus;
}
declare class UntilFail<T> extends Decorator<T> {
    update(context: T): TaskStatus;
}
declare class UntilSuccess<T> extends Decorator<T> {
    update(context: T): TaskStatus;
}
declare class ArrayExt {
    static shuffle<T>(list: Array<T>): void;
    static peek<T>(list: Array<T>): T;
    static push<T>(list: Array<T>, item: T): void;
    static pop<T>(list: Array<T>): T;
}
declare class Assert {
    static fail(message?: string, ...args: object[]): void;
    static isTrue(condition: boolean, message?: string, ...args: object[]): void;
    static isNotNull(obj: object, message: string, ...args: object[]): void;
    static isFalse(condition: boolean, message?: string, ...args: object[]): void;
}
declare class Mathf {
    static map01(value: number, min: number, max: number): number;
}
declare class Random {
    static range(min: number, max: number): number;
}
declare class Timer {
    private _items;
    private _itemPool;
    private _enumI;
    private _enumCount;
    private _lastTimer;
    static deltaTime: number;
    static time: number;
    static inst: Timer;
    private static FPS24;
    constructor();
    private getItem;
    private findItem;
    add(delayInMiniseconds: number, repeat: number, callback: Function, thisObj: any, callbackParam?: any): void;
    callLater(callback: Function, thisObj: any, callbackParam?: any): void;
    callDelay(delay: number, callback: Function, thisObj: any, callbackParam?: any): void;
    callBy24Fps(callback: Function, thisObj: any, callbackParam?: any): void;
    exists(callback: Function, thisObj: any): boolean;
    remove(callback: Function, thisObj: any): void;
    private __timer;
}
declare class TimerItem {
    delay: number;
    repeat: number;
    counter: number;
    thisObj: any;
    callback: Function;
    param: any;
    hasParam: boolean;
    end: boolean;
    constructor();
    advance(elapsed?: number): boolean;
    reset(): void;
}
declare module fsm {
    abstract class SimpleStateMachine {
        protected elapsedTimeInState: number;
        protected previousState: string;
        private _stateCache;
        private _stateMethods;
        private _currentState;
        currentState: string;
        protected initialState: string;
        constructor();
        update(): void;
        setEnterMethod(stateName: string, enterState: Function, tickState: Function, exitState: Function): void;
    }
    class StateMethodCache {
        enterState: Function;
        tick: Function;
        exitState: Function;
    }
}
declare module fsm {
    abstract class State<T> {
        protected _machine: StateMachine<T>;
        protected _context: T;
        setMachineAndContext(machine: StateMachine<T>, context: T): void;
        onInitialized(): void;
        begin(): void;
        reason(): void;
        abstract update(deltaTime: number): any;
        end(): void;
    }
}
declare module fsm {
    class StateMachine<T> {
        onStateChanged: Function;
        readonly currentState: State<T>;
        previousState: State<T>;
        elapsedTimeInState: number;
        protected _currentState: State<T>;
        protected _context: T;
        private _states;
        constructor(context: T, initialState: State<T>);
        addState(state: State<T>): void;
    }
}
declare class UtilityAI<T> {
    updatePeriod: number;
    private _context;
    private _rootReasoner;
    private _elapsedTime;
    constructor(context: T, rootSelector: Reasoner<T>, updatePeriod?: number);
    tick(): void;
}
declare class ActionExecutor<T> implements IAction<T> {
    private _action;
    constructor(action: Function);
    execute(context: T): void;
}
declare abstract class ActionWithOptions<T, U> implements IAction<T> {
    protected _appraisals: Array<IActionOptionAppraisal<T, U>>;
    getBestOption(context: T, options: Array<U>): U;
    abstract execute(context: T): any;
    addScorer(scorer: IActionOptionAppraisal<T, U>): ActionWithOptions<T, U>;
}
declare class CompositeAction<T> implements IAction<T> {
    private _actions;
    execute(context: T): void;
    addAction(action: IAction<T>): CompositeAction<T>;
}
interface IAction<T> {
    execute(context: T): any;
}
interface IActionOptionAppraisal<T, U> {
    getScore(context: T, option: U): number;
}
declare module utility {
}
declare class ReasonerAction<T> implements IAction<T> {
    private _reasoner;
    constructor(reasoner: Reasoner<T>);
    execute(context: T): void;
}
declare class AllOrNothingConsideration<T> implements IConsideration<T> {
    threshold: number;
    action: IAction<T>;
    private _appraisals;
    constructor(threshold?: number);
    addAppraisal(appraisal: IAppraisal<T>): this;
    getScore(context: T): number;
}
declare class FixedScoreConsideration<T> implements IConsideration<T> {
    score: number;
    action: IAction<T>;
    constructor(score?: number);
    getScore(context: T): number;
}
interface IConsideration<T> {
    action: IAction<T>;
    getScore(context: T): number;
}
declare class SumOfChildrenConsideration<T> implements IConsideration<T> {
    action: IAction<T>;
    private _appraisals;
    getScore(context: T): number;
}
declare class ThresholdConsideration<T> implements IConsideration<T> {
    threshold: number;
    action: IAction<T>;
    private _appraisals;
    constructor(threshold: number);
    getScore(context: T): number;
}
declare class ActionAppraisal<T> implements IAppraisal<T> {
    private _appraisalAction;
    constructor(appraisalAction: Function);
    getScore(context: T): number;
}
interface IAppraisal<T> {
    getScore(context: T): number;
}
declare abstract class Reasoner<T> {
    defaultConsideration: IConsideration<T>;
    protected _condiderations: Array<IConsideration<T>>;
    select(context: T): IAction<T>;
    protected abstract selectBestConsideration(context: T): IConsideration<T>;
    addConsideration(consideration: IConsideration<T>): Reasoner<T>;
    setDefaultConsideration(defaultConsideration: IConsideration<T>): Reasoner<T>;
}
declare class FirstScoreReasoner<T> extends Reasoner<T> {
    protected selectBestConsideration(context: T): IConsideration<T>;
}
declare class HighestScoreReasoner<T> extends Reasoner<T> {
    protected selectBestConsideration(context: T): IConsideration<T>;
}
