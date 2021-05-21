"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var behaviourTree;
(function (behaviourTree) {
    /**
     * 所有节点的根类
     */
    var Behavior = /** @class */ (function () {
        function Behavior() {
            this.status = behaviourTree.TaskStatus.Invalid;
        }
        /**
         * 使该节点的状态无效。
         * 组合体可以覆盖这一点并使其所有的子节点失效
         */
        Behavior.prototype.invalidate = function () {
            this.status = behaviourTree.TaskStatus.Invalid;
        };
        /**
         * 在执行前立即调用。
         * 它被用来设置任何需要从上一次运行中重置的变量
         */
        Behavior.prototype.onStart = function () { };
        /**
         * 当一个任务的状态改变为运行以外的其他状态时被调用
         */
        Behavior.prototype.onEnd = function () { };
        /**
         * tick处理调用，以更新实际工作完成的地方。
         * 它的存在是为了在必要时可以调用onStart/onEnd。
         * @param context
         * @returns
         */
        Behavior.prototype.tick = function (context) {
            if (this.status == behaviourTree.TaskStatus.Invalid)
                this.onStart();
            this.status = this.update(context);
            if (this.status != behaviourTree.TaskStatus.Running)
                this.onEnd();
            return this.status;
        };
        return Behavior;
    }());
    behaviourTree.Behavior = Behavior;
})(behaviourTree || (behaviourTree = {}));
var behaviourTree;
(function (behaviourTree) {
    /**
     * 用来控制BehaviorTree的根类
     */
    var BehaviorTree = /** @class */ (function () {
        function BehaviorTree(context, rootNode, updatePeriod) {
            if (updatePeriod === void 0) { updatePeriod = 0.2; }
            this._context = context;
            this._root = rootNode;
            this.updatePeriod = this._elapsedTime = updatePeriod;
        }
        BehaviorTree.prototype.tick = function () {
            // updatePeriod小于或等于0，将每一帧都执行
            if (this.updatePeriod > 0) {
                this._elapsedTime -= es.Time.deltaTime;
                if (this._elapsedTime <= 0) {
                    while (this._elapsedTime <= 0)
                        this._elapsedTime += this.updatePeriod;
                    this._root.tick(this._context);
                }
            }
            else {
                this._root.tick(this._context);
            }
        };
        return BehaviorTree;
    }());
    behaviourTree.BehaviorTree = BehaviorTree;
})(behaviourTree || (behaviourTree = {}));
var behaviourTree;
(function (behaviourTree) {
    /**
     * 帮助器，用于使用流畅的API构建BehaviorTree。
     * 叶子节点需要首先添加一个父节点。
     * 父节点可以是组合体或装饰体。
     * 当叶子节点被添加时，装饰器会自动关闭。
     * 组合体必须调用endComposite来关闭它们。
     */
    var BehaviorTreeBuilder = /** @class */ (function () {
        function BehaviorTreeBuilder(context) {
            /** 堆栈节点，我们是通过fluent API来建立的 */
            this._parentNodeStack = new Array();
            this._context = context;
        }
        BehaviorTreeBuilder.begin = function (context) {
            return new BehaviorTreeBuilder(context);
        };
        BehaviorTreeBuilder.prototype.setChildOnParent = function (child) {
            var parent = behaviourTree.ArrayExt.peek(this._parentNodeStack);
            if (parent instanceof behaviourTree.Composite) {
                parent.addChild(child);
            }
            else if (parent instanceof behaviourTree.Decorator) {
                // 装饰者只有一个子节点，所以自动结束
                parent.child = child;
                this.endDecorator();
            }
            return this;
        };
        BehaviorTreeBuilder.prototype.pushParentNode = function (composite) {
            if (this._parentNodeStack.length > 0)
                this.setChildOnParent(composite);
            behaviourTree.ArrayExt.push(this._parentNodeStack, composite);
            return this;
        };
        BehaviorTreeBuilder.prototype.endDecorator = function () {
            this._currentNode = behaviourTree.ArrayExt.pop(this._parentNodeStack);
            return this;
        };
        BehaviorTreeBuilder.prototype.action = function (func) {
            behaviourTree.Assert.isFalse(this._parentNodeStack.length == 0, "无法创建无嵌套的动作节点, 它必须是一个叶节点");
            return this.setChildOnParent(new behaviourTree.ExecuteAction(func));
        };
        BehaviorTreeBuilder.prototype.actionR = function (func) {
            return this.action(function (t) { return func(t) ? behaviourTree.TaskStatus.Success : behaviourTree.TaskStatus.Failure; });
        };
        BehaviorTreeBuilder.prototype.conditional = function (func) {
            behaviourTree.Assert.isFalse(this._parentNodeStack.length == 0, "无法创建无嵌套的条件节点, 它必须是一个叶节点");
            return this.setChildOnParent(new behaviourTree.ExecuteActionConditional(func));
        };
        BehaviorTreeBuilder.prototype.conditionalR = function (func) {
            return this.conditional(function (t) { return func(t) ? behaviourTree.TaskStatus.Success : behaviourTree.TaskStatus.Failure; });
        };
        BehaviorTreeBuilder.prototype.logAction = function (text) {
            behaviourTree.Assert.isFalse(this._parentNodeStack.length == 0, "无法创建无嵌套的动作节点, 它必须是一个叶节点");
            return this.setChildOnParent(new behaviourTree.LogAction(text));
        };
        BehaviorTreeBuilder.prototype.waitAction = function (waitTime) {
            behaviourTree.Assert.isFalse(this._parentNodeStack.length == 0, "无法创建无嵌套的动作节点, 它必须是一个叶节点");
            return this.setChildOnParent(new behaviourTree.WaitAciton(waitTime));
        };
        BehaviorTreeBuilder.prototype.subTree = function (subTree) {
            behaviourTree.Assert.isFalse(this._parentNodeStack.length == 0, "无法创建无嵌套的动作节点, 它必须是一个叶节点");
            return this.setChildOnParent(new behaviourTree.BehaviorTreeReference(subTree));
        };
        BehaviorTreeBuilder.prototype.conditionalDecorator = function (func, shouldReevaluate) {
            if (shouldReevaluate === void 0) { shouldReevaluate = true; }
            var conditional = new behaviourTree.ExecuteActionConditional(func);
            return this.pushParentNode(new behaviourTree.ConditionalDecorator(conditional, shouldReevaluate));
        };
        BehaviorTreeBuilder.prototype.conditionalDecoratorR = function (func, shouldReevaluate) {
            if (shouldReevaluate === void 0) { shouldReevaluate = true; }
            return this.conditionalDecorator(function (t) { return func(t) ? behaviourTree.TaskStatus.Success : behaviourTree.TaskStatus.Failure; }, shouldReevaluate);
        };
        BehaviorTreeBuilder.prototype.alwaysFail = function () {
            return this.pushParentNode(new behaviourTree.AlwaysFail());
        };
        BehaviorTreeBuilder.prototype.alwaysSucceed = function () {
            return this.pushParentNode(new behaviourTree.AlwaysSucceed());
        };
        BehaviorTreeBuilder.prototype.inverter = function () {
            return this.pushParentNode(new behaviourTree.Inverter());
        };
        BehaviorTreeBuilder.prototype.repeater = function (count) {
            return this.pushParentNode(new behaviourTree.Repeater(count));
        };
        BehaviorTreeBuilder.prototype.untilFail = function () {
            return this.pushParentNode(new behaviourTree.UntilFail());
        };
        BehaviorTreeBuilder.prototype.untilSuccess = function () {
            return this.pushParentNode(new behaviourTree.UntilSuccess());
        };
        BehaviorTreeBuilder.prototype.paraller = function () {
            return this.pushParentNode(new behaviourTree.Parallel());
        };
        BehaviorTreeBuilder.prototype.parallelSelector = function () {
            return this.pushParentNode(new behaviourTree.ParallelSelector());
        };
        BehaviorTreeBuilder.prototype.selector = function (abortType) {
            if (abortType === void 0) { abortType = behaviourTree.AbortTypes.None; }
            return this.pushParentNode(new behaviourTree.Selector(abortType));
        };
        BehaviorTreeBuilder.prototype.randomSelector = function () {
            return this.pushParentNode(new behaviourTree.RandomSelector());
        };
        BehaviorTreeBuilder.prototype.sequence = function (abortType) {
            if (abortType === void 0) { abortType = behaviourTree.AbortTypes.None; }
            return this.pushParentNode(new behaviourTree.Sequence(abortType));
        };
        BehaviorTreeBuilder.prototype.randomSequence = function () {
            return this.pushParentNode(new behaviourTree.RandomSequence());
        };
        BehaviorTreeBuilder.prototype.endComposite = function () {
            behaviourTree.Assert.isTrue(behaviourTree.ArrayExt.peek(this._parentNodeStack) instanceof behaviourTree.Composite, "尝试结束复合器，但顶部节点是装饰器");
            this._currentNode = behaviourTree.ArrayExt.pop(this._parentNodeStack);
            return this;
        };
        BehaviorTreeBuilder.prototype.build = function (updatePeriod) {
            if (updatePeriod === void 0) { updatePeriod = 0.2; }
            // Assert.isNotNull(this._currentNode, "无法创建零节点的行为树");
            if (!this._currentNode)
                throw new Error('无法创建零节点的行为树');
            return new behaviourTree.BehaviorTree(this._context, this._currentNode, updatePeriod);
        };
        return BehaviorTreeBuilder;
    }());
    behaviourTree.BehaviorTreeBuilder = BehaviorTreeBuilder;
})(behaviourTree || (behaviourTree = {}));
var behaviourTree;
(function (behaviourTree) {
    var TaskStatus;
    (function (TaskStatus) {
        TaskStatus[TaskStatus["Invalid"] = 0] = "Invalid";
        TaskStatus[TaskStatus["Success"] = 1] = "Success";
        TaskStatus[TaskStatus["Failure"] = 2] = "Failure";
        TaskStatus[TaskStatus["Running"] = 3] = "Running";
    })(TaskStatus = behaviourTree.TaskStatus || (behaviourTree.TaskStatus = {}));
})(behaviourTree || (behaviourTree = {}));
var behaviourTree;
(function (behaviourTree) {
    /**
     * 作为子项运行整个BehaviorTree并返回成功
     */
    var BehaviorTreeReference = /** @class */ (function (_super) {
        __extends(BehaviorTreeReference, _super);
        function BehaviorTreeReference(tree) {
            var _this = _super.call(this) || this;
            _this._childTree = tree;
            return _this;
        }
        BehaviorTreeReference.prototype.update = function (context) {
            this._childTree.tick();
            return behaviourTree.TaskStatus.Success;
        };
        return BehaviorTreeReference;
    }(behaviourTree.Behavior));
    behaviourTree.BehaviorTreeReference = BehaviorTreeReference;
})(behaviourTree || (behaviourTree = {}));
var behaviourTree;
(function (behaviourTree) {
    /**
     * 包装一个Func，以便您可以避免必须子类来创建新操作
     */
    var ExecuteAction = /** @class */ (function (_super) {
        __extends(ExecuteAction, _super);
        /**
         * Func<T, TaskStatus>
         */
        function ExecuteAction(action) {
            var _this = _super.call(this) || this;
            _this._action = action;
            return _this;
        }
        ExecuteAction.prototype.update = function (context) {
            behaviourTree.Assert.isNotNull(this._action, "action 必须不为空");
            return this._action(context);
        };
        return ExecuteAction;
    }(behaviourTree.Behavior));
    behaviourTree.ExecuteAction = ExecuteAction;
})(behaviourTree || (behaviourTree = {}));
var behaviourTree;
(function (behaviourTree) {
    /**
     * 简单的任务，它将输出指定的文本并返回成功。 它可以用于调试。
     */
    var LogAction = /** @class */ (function (_super) {
        __extends(LogAction, _super);
        function LogAction(text) {
            var _this = _super.call(this) || this;
            /** 是否输出error还是log */
            _this.isError = false;
            _this.text = text;
            return _this;
        }
        LogAction.prototype.update = function (context) {
            if (this.isError)
                console.error(this.text);
            else
                console.log(this.text);
            return behaviourTree.TaskStatus.Success;
        };
        return LogAction;
    }(behaviourTree.Behavior));
    behaviourTree.LogAction = LogAction;
})(behaviourTree || (behaviourTree = {}));
var behaviourTree;
(function (behaviourTree) {
    /**
     * 等待指定的时间。 任务将返回运行，直到任务完成等待。 在等待时间结束后它将返回成功。
     */
    var WaitAciton = /** @class */ (function (_super) {
        __extends(WaitAciton, _super);
        function WaitAciton(waitTime) {
            var _this = _super.call(this) || this;
            _this._startTime = 0;
            _this.waitTime = waitTime;
            return _this;
        }
        WaitAciton.prototype.onStart = function () {
            this._startTime = 0;
        };
        WaitAciton.prototype.update = function (context) {
            // 我们不能使用Time.deltaTime，因为行为树会按照自己的速率tick，所以我们只存储起始时间
            if (this._startTime == 0)
                this._startTime = es.Time.totalTime;
            if (es.Time.totalTime - this._startTime >= this.waitTime)
                return behaviourTree.TaskStatus.Success;
            return behaviourTree.TaskStatus.Running;
        };
        return WaitAciton;
    }(behaviourTree.Behavior));
    behaviourTree.WaitAciton = WaitAciton;
})(behaviourTree || (behaviourTree = {}));
var behaviourTree;
(function (behaviourTree) {
    var AbortTypes;
    (function (AbortTypes) {
        /**
         * 没有中止类型。 即使其他条件更改了状态，当前操作也将始终运行
         */
        AbortTypes[AbortTypes["None"] = 0] = "None";
        /**
         * 如果一个更重要的有条件的任务改变了状态，它可以发出一个中止指令，使低优先级的任务停止运行，并将控制权转回高优先级的分支。
         * 这种类型应该被设置在作为讨论中的复合体的子体的复合体上。
         * 父复合体将检查它的子体，看它们是否有LowerPriority中止。
         */
        AbortTypes[AbortTypes["LowerPriority"] = 1] = "LowerPriority";
        /**
         * 只有当它们都是复合体的子任务时，条件任务才能中止一个行动任务。
         * 这个AbortType只影响它所设置的实际的Composite，不像LowerPriority会影响其父Composite。
         */
        AbortTypes[AbortTypes["Self"] = 2] = "Self";
        /**
         * 检查LowerPriority和Self aborts
         */
        AbortTypes[AbortTypes["Both"] = 3] = "Both";
    })(AbortTypes = behaviourTree.AbortTypes || (behaviourTree.AbortTypes = {}));
    var AbortTypesExt = /** @class */ (function () {
        function AbortTypesExt() {
        }
        AbortTypesExt.has = function (self, check) {
            return (self & check) == check;
        };
        return AbortTypesExt;
    }());
    behaviourTree.AbortTypesExt = AbortTypesExt;
})(behaviourTree || (behaviourTree = {}));
var behaviourTree;
(function (behaviourTree) {
    /**
     * 任何复合节点必须子类化这个。为子节点和助手提供存储，以处理AbortTypes。
     */
    var Composite = /** @class */ (function (_super) {
        __extends(Composite, _super);
        function Composite() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.abortType = behaviourTree.AbortTypes.None;
            _this._children = new Array();
            _this._hasLowerPriorityConditionalAbort = false;
            _this._currentChildIndex = 0;
            return _this;
        }
        Composite.prototype.invalidate = function () {
            _super.prototype.invalidate.call(this);
            for (var i = 0; i < this._children.length; i++) {
                this._children[i].invalidate();
            }
        };
        Composite.prototype.onStart = function () {
            // 较低优先级的中止发生在下一级，所以我们在这里检查是否有
            this._hasLowerPriorityConditionalAbort = this.hasLowerPriorityConditionalAbortInChildren();
            this._currentChildIndex = 0;
        };
        Composite.prototype.onEnd = function () {
            // 我们已经做好了使我们的子节点无效的准备，使他们再下一帧做好准备 
            for (var i = 0; i < this._children.length; i++) {
                this._children[i].invalidate();
            }
        };
        /**
         * 检查复合体的子代，看是否有具有LowerPriority AbortType的复合体
         */
        Composite.prototype.hasLowerPriorityConditionalAbortInChildren = function () {
            for (var i = 0; i < this._children.length; i++) {
                // 检查是否有一个设置了中止类型的复合体
                var composite = this._children[i];
                if (composite != null && behaviourTree.AbortTypesExt.has(composite.abortType, behaviourTree.AbortTypes.LowerPriority)) {
                    // 现在确保第一个子节点是一个条件性的
                    if (composite.isFirstChildConditional())
                        return true;
                }
            }
            return false;
        };
        /**
         * 为这个复合体添加一个子节点
         */
        Composite.prototype.addChild = function (child) {
            this._children.push(child);
        };
        /**
         * 如果一个复合体的第一个子节点是一个条件体，返回true。用来处理条件性中止
         */
        Composite.prototype.isFirstChildConditional = function () {
            return behaviourTree.isIConditional(this._children[0]);
        };
        /**
         * 检查任何IConditional的子代，看它们是否已经改变了状态
         */
        Composite.prototype.updateSelfAbortConditional = function (context, statusCheck) {
            // 检查任何IConditional的子任务，看它们是否改变了状态
            for (var i = 0; i < this._currentChildIndex; i++) {
                var child = this._children[i];
                if (!behaviourTree.isIConditional(child))
                    continue;
                var status_1 = this.updateConditionalNode(context, child);
                if (status_1 != statusCheck) {
                    this._currentChildIndex = i;
                    // 我们有一个中止，所以我们使子节点无效，所以他们被重新评估
                    for (var j = i; j < this._children.length; j++)
                        this._children[j].invalidate();
                    break;
                }
            }
        };
        /**
         * 检查任何具有LowerPriority AbortType和Conditional作为第一个子代的组合体。
         * 如果它找到一个，它将执行条件，如果状态不等于 statusCheck，_currentChildIndex将被更新，即当前运行的Action将被中止。
         */
        Composite.prototype.updateLowerPriorityAbortConditional = function (context, statusCheck) {
            // 检查任何较低优先级的任务，看它们是否改变了状态
            for (var i = 0; i < this._currentChildIndex; i++) {
                var composite = this._children[i];
                if (composite != null && behaviourTree.AbortTypesExt.has(composite.abortType, behaviourTree.AbortTypes.LowerPriority)) {
                    // 现在我们只得到条件的状态（更新而不是执行），看看它是否发生了变化，并对条件装饰器加以注意
                    var child = composite._children[0];
                    var status_2 = this.updateConditionalNode(context, child);
                    if (status_2 != statusCheck) {
                        this._currentChildIndex = i;
                        // 我们有一个中止，所以我们使子节点无效，所以他们被重新评估
                        for (var j = i; j < this._children.length; j++)
                            this._children[j].invalidate();
                        break;
                    }
                }
            }
        };
        /**
         * 帮助器，用于获取一个条件或一个条件装饰器的任务状态
         * @param context
         * @param node
         * @returns
         */
        Composite.prototype.updateConditionalNode = function (context, node) {
            if (node instanceof behaviourTree.ConditionalDecorator)
                return node.executeConditional(context, true);
            else
                return node.update(context);
        };
        return Composite;
    }(behaviourTree.Behavior));
    behaviourTree.Composite = Composite;
})(behaviourTree || (behaviourTree = {}));
var behaviourTree;
(function (behaviourTree) {
    /**
     * 并行任务将运行每个子任务，直到一个子任务返回失败。
     * 不同的是，并行任务将同时运行其所有的子任务，而不是一次运行每个任务。
     * 像序列类一样，一旦它的所有子任务都返回成功，并行任务将返回成功。
     * 如果一个任务返回失败，并行任务将结束所有的子任务并返回失败。
     */
    var Parallel = /** @class */ (function (_super) {
        __extends(Parallel, _super);
        function Parallel() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Parallel.prototype.update = function (context) {
            var didAllSucceed = true;
            for (var i = 0; i < this._children.length; i++) {
                var child = this._children[i];
                child.tick(context);
                // 如果任何一个子节点失败了，整个分支都会失败
                if (child.status == behaviourTree.TaskStatus.Failure)
                    return behaviourTree.TaskStatus.Failure;
                // 如果所有的子节点没有成功，我们还没有完成
                else if (child.status != behaviourTree.TaskStatus.Success)
                    didAllSucceed = false;
            }
            if (didAllSucceed)
                return behaviourTree.TaskStatus.Success;
            return behaviourTree.TaskStatus.Running;
        };
        return Parallel;
    }(behaviourTree.Composite));
    behaviourTree.Parallel = Parallel;
})(behaviourTree || (behaviourTree = {}));
var behaviourTree;
(function (behaviourTree) {
    /**
     * 与选择器任务类似，ParallelSelector任务一旦有子任务返回成功，就会返回成功。
     * 不同的是，并行任务将同时运行其所有的子任务，而不是一次运行每个任务。
     * 如果一个任务返回成功，并行选择器任务将结束所有的子任务并返回成功。
     * 如果每个子任务都返回失败，那么ParallelSelector任务将返回失败。
     */
    var ParallelSelector = /** @class */ (function (_super) {
        __extends(ParallelSelector, _super);
        function ParallelSelector() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ParallelSelector.prototype.update = function (context) {
            var didAllFail = true;
            for (var i = 0; i < this._children.length; i++) {
                var child = this._children[i];
                child.tick(context);
                // 如果有子节点成功了，我们就返回成功
                if (child.status == behaviourTree.TaskStatus.Success)
                    return behaviourTree.TaskStatus.Success;
                // 如果所有的子节点没有失败，我们还没有完成
                if (child.status != behaviourTree.TaskStatus.Failure)
                    didAllFail = false;
            }
            if (didAllFail)
                return behaviourTree.TaskStatus.Failure;
            return behaviourTree.TaskStatus.Running;
        };
        return ParallelSelector;
    }(behaviourTree.Composite));
    behaviourTree.ParallelSelector = ParallelSelector;
})(behaviourTree || (behaviourTree = {}));
var behaviourTree;
(function (behaviourTree) {
    /**
     * 选择器任务类似于一个 "或 "操作。只要它的一个子任务返回成功，它就会返回成功。
     * 如果一个子任务返回失败，那么它将依次运行下一个任务。
     * 如果没有子任务返回成功，那么它将返回失败
     */
    var Selector = /** @class */ (function (_super) {
        __extends(Selector, _super);
        function Selector(abortType) {
            if (abortType === void 0) { abortType = behaviourTree.AbortTypes.None; }
            var _this = _super.call(this) || this;
            _this.abortType = abortType;
            return _this;
        }
        Selector.prototype.update = function (context) {
            // 首先，如果我们不在第一个子节点身上，我们就处理条件性中止
            if (this._currentChildIndex != 0)
                this.handleConditionalAborts(context);
            var current = this._children[this._currentChildIndex];
            var status = current.tick(context);
            // 如果子节点成功了或者还在跑，就提前返回
            if (status != behaviourTree.TaskStatus.Failure)
                return status;
            this._currentChildIndex++;
            // 如果子节点再最后一个，这意味着整个事情失败了
            if (this._currentChildIndex == this._children.length) {
                // 重置索引，否则下次运行时会崩溃
                this._currentChildIndex = 0;
                return behaviourTree.TaskStatus.Failure;
            }
            return behaviourTree.TaskStatus.Running;
        };
        Selector.prototype.handleConditionalAborts = function (context) {
            // 检查任何较低优先级的任务，看它们是否改变为成功
            if (this._hasLowerPriorityConditionalAbort)
                this.updateLowerPriorityAbortConditional(context, behaviourTree.TaskStatus.Failure);
            if (behaviourTree.AbortTypesExt.has(this.abortType, behaviourTree.AbortTypes.Self))
                this.updateSelfAbortConditional(context, behaviourTree.TaskStatus.Failure);
        };
        return Selector;
    }(behaviourTree.Composite));
    behaviourTree.Selector = Selector;
})(behaviourTree || (behaviourTree = {}));
///<reference path="./Selector.ts"/>
var behaviourTree;
///<reference path="./Selector.ts"/>
(function (behaviourTree) {
    /**
     * 与选择器相同，但它会在启动时无序处理子项
     */
    var RandomSelector = /** @class */ (function (_super) {
        __extends(RandomSelector, _super);
        function RandomSelector() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        RandomSelector.prototype.onStart = function () {
            behaviourTree.ArrayExt.shuffle(this._children);
        };
        return RandomSelector;
    }(behaviourTree.Selector));
    behaviourTree.RandomSelector = RandomSelector;
})(behaviourTree || (behaviourTree = {}));
var behaviourTree;
(function (behaviourTree) {
    /**
     * 序列任务类似于一个 "和 "的操作。只要它的一个子任务返回失败，它就会返回失败。
     * 如果一个子任务返回成功，那么它将依次运行下一个任务。
     * 如果所有子任务都返回成功，那么它将返回成功。
     */
    var Sequence = /** @class */ (function (_super) {
        __extends(Sequence, _super);
        function Sequence(abortType) {
            if (abortType === void 0) { abortType = behaviourTree.AbortTypes.None; }
            var _this = _super.call(this) || this;
            _this.abortType = abortType;
            return _this;
        }
        Sequence.prototype.update = function (context) {
            // 首先，如果我们还没有在第一个子节点身上，我们将处理有条件的中止
            if (this._currentChildIndex != 0) {
                this.handleConditionalAborts(context);
            }
            var current = this._children[this._currentChildIndex];
            var status = current.tick(context);
            // 如果子节点失败或仍在运行，提前返回
            if (status != behaviourTree.TaskStatus.Success)
                return status;
            this._currentChildIndex++;
            // 如果到子节点最后一个，整个序列就成功了
            if (this._currentChildIndex == this._children.length) {
                // 为下一次运行重置索引
                this._currentChildIndex = 0;
                return behaviourTree.TaskStatus.Success;
            }
            return behaviourTree.TaskStatus.Running;
        };
        Sequence.prototype.handleConditionalAborts = function (context) {
            if (this._hasLowerPriorityConditionalAbort)
                this.updateLowerPriorityAbortConditional(context, behaviourTree.TaskStatus.Success);
            if (behaviourTree.AbortTypesExt.has(this.abortType, behaviourTree.AbortTypes.Self))
                this.updateSelfAbortConditional(context, behaviourTree.TaskStatus.Success);
        };
        return Sequence;
    }(behaviourTree.Composite));
    behaviourTree.Sequence = Sequence;
})(behaviourTree || (behaviourTree = {}));
///<reference path="./Sequence.ts"/>
var behaviourTree;
///<reference path="./Sequence.ts"/>
(function (behaviourTree) {
    /**
     * 与sequence相同，只是它在开始时对子级进行无序处理
     */
    var RandomSequence = /** @class */ (function (_super) {
        __extends(RandomSequence, _super);
        function RandomSequence() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        RandomSequence.prototype.onStart = function () {
            behaviourTree.ArrayExt.shuffle(this._children);
        };
        return RandomSequence;
    }(behaviourTree.Sequence));
    behaviourTree.RandomSequence = RandomSequence;
})(behaviourTree || (behaviourTree = {}));
var behaviourTree;
(function (behaviourTree) {
    /**
     * 包装一个ExecuteAction，这样它就可以作为一个ConditionalAction使用
     */
    var ExecuteActionConditional = /** @class */ (function (_super) {
        __extends(ExecuteActionConditional, _super);
        function ExecuteActionConditional(action) {
            return _super.call(this, action) || this;
        }
        return ExecuteActionConditional;
    }(behaviourTree.ExecuteAction));
    behaviourTree.ExecuteActionConditional = ExecuteActionConditional;
})(behaviourTree || (behaviourTree = {}));
var behaviourTree;
(function (behaviourTree) {
    behaviourTree.isIConditional = function (props) { return typeof props['update'] !== 'undefined'; };
})(behaviourTree || (behaviourTree = {}));
var behaviourTree;
(function (behaviourTree) {
    /**
     * 当随机概率高于successProbability概率时返回成功。
     * 否则它将返回失败。
     * successProbability应该在0和1之间
     */
    var RandomProbability = /** @class */ (function (_super) {
        __extends(RandomProbability, _super);
        function RandomProbability(successProbability) {
            var _this = _super.call(this) || this;
            _this._successProbability = successProbability;
            return _this;
        }
        RandomProbability.prototype.update = function (context) {
            if (Math.random() > this._successProbability)
                return behaviourTree.TaskStatus.Success;
            return behaviourTree.TaskStatus.Failure;
        };
        return RandomProbability;
    }(behaviourTree.Behavior));
    behaviourTree.RandomProbability = RandomProbability;
})(behaviourTree || (behaviourTree = {}));
var behaviourTree;
(function (behaviourTree) {
    var Decorator = /** @class */ (function (_super) {
        __extends(Decorator, _super);
        function Decorator() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Decorator.prototype.invalidate = function () {
            _super.prototype.invalidate.call(this);
            this.child.invalidate();
        };
        return Decorator;
    }(behaviourTree.Behavior));
    behaviourTree.Decorator = Decorator;
})(behaviourTree || (behaviourTree = {}));
///<reference path="./Decorator.ts"/>
var behaviourTree;
///<reference path="./Decorator.ts"/>
(function (behaviourTree) {
    /**
     * 将总是返回失败，除了当子任务正在运行时
     */
    var AlwaysFail = /** @class */ (function (_super) {
        __extends(AlwaysFail, _super);
        function AlwaysFail() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        AlwaysFail.prototype.update = function (context) {
            behaviourTree.Assert.isNotNull(this.child, "child必须不能为空");
            var status = this.child.update(context);
            if (status == behaviourTree.TaskStatus.Running)
                return behaviourTree.TaskStatus.Running;
            return behaviourTree.TaskStatus.Failure;
        };
        return AlwaysFail;
    }(behaviourTree.Decorator));
    behaviourTree.AlwaysFail = AlwaysFail;
})(behaviourTree || (behaviourTree = {}));
///<reference path="./Decorator.ts"/>
var behaviourTree;
///<reference path="./Decorator.ts"/>
(function (behaviourTree) {
    /**
     *  将总是返回成功，除了当子任务正在运行时
     */
    var AlwaysSucceed = /** @class */ (function (_super) {
        __extends(AlwaysSucceed, _super);
        function AlwaysSucceed() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        AlwaysSucceed.prototype.update = function (context) {
            behaviourTree.Assert.isNotNull(this.child, "child必须不能为空");
            var status = this.child.update(context);
            if (status == behaviourTree.TaskStatus.Running)
                return behaviourTree.TaskStatus.Running;
            return behaviourTree.TaskStatus.Success;
        };
        return AlwaysSucceed;
    }(behaviourTree.Decorator));
    behaviourTree.AlwaysSucceed = AlwaysSucceed;
})(behaviourTree || (behaviourTree = {}));
///<reference path="./Decorator.ts"/>
var behaviourTree;
///<reference path="./Decorator.ts"/>
(function (behaviourTree) {
    /**
     * 装饰器，只有在满足条件的情况下才会运行其子程序。
     * 默认情况下，该条件将在每一次执行中被重新评估
     */
    var ConditionalDecorator = /** @class */ (function (_super) {
        __extends(ConditionalDecorator, _super);
        function ConditionalDecorator(conditional, shouldReevalute) {
            if (shouldReevalute === void 0) { shouldReevalute = true; }
            var _this = _super.call(this) || this;
            _this._conditionalStatus = behaviourTree.TaskStatus.Invalid;
            behaviourTree.Assert.isTrue(behaviourTree.isIConditional(conditional), "conditional 必须继承 IConditional");
            _this._conditional = conditional;
            _this._shouldReevaluate = shouldReevalute;
            return _this;
        }
        ConditionalDecorator.prototype.invalidate = function () {
            _super.prototype.invalidate.call(this);
            this._conditionalStatus = behaviourTree.TaskStatus.Invalid;
        };
        ConditionalDecorator.prototype.onStart = function () {
            this._conditionalStatus = behaviourTree.TaskStatus.Invalid;
        };
        ConditionalDecorator.prototype.update = function (context) {
            behaviourTree.Assert.isNotNull(this.child, "child不能为空");
            this._conditionalStatus = this.executeConditional(context);
            if (this._conditionalStatus == behaviourTree.TaskStatus.Success)
                return this.child.tick(context);
            return behaviourTree.TaskStatus.Failure;
        };
        /**
         * 在shouldReevaluate标志之后执行条件，或者用一个选项来强制更新。
         * 终止将强制更新，以确保他们在条件变化时得到适当的数据。
         */
        ConditionalDecorator.prototype.executeConditional = function (context, forceUpdate) {
            if (forceUpdate === void 0) { forceUpdate = false; }
            if (forceUpdate || this._shouldReevaluate || this._conditionalStatus == behaviourTree.TaskStatus.Invalid)
                this._conditionalStatus = this._conditional.update(context);
            return this._conditionalStatus;
        };
        return ConditionalDecorator;
    }(behaviourTree.Decorator));
    behaviourTree.ConditionalDecorator = ConditionalDecorator;
})(behaviourTree || (behaviourTree = {}));
var behaviourTree;
(function (behaviourTree) {
    /**
     * 反转结果的子节点
     */
    var Inverter = /** @class */ (function (_super) {
        __extends(Inverter, _super);
        function Inverter() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Inverter.prototype.update = function (context) {
            behaviourTree.Assert.isNotNull(this.child, "child必须不能为空");
            var status = this.child.tick(context);
            if (status == behaviourTree.TaskStatus.Success)
                return behaviourTree.TaskStatus.Failure;
            if (status == behaviourTree.TaskStatus.Failure)
                return behaviourTree.TaskStatus.Success;
            return behaviourTree.TaskStatus.Running;
        };
        return Inverter;
    }(behaviourTree.Decorator));
    behaviourTree.Inverter = Inverter;
})(behaviourTree || (behaviourTree = {}));
var behaviourTree;
(function (behaviourTree) {
    /**
     * 将重复执行其子任务，直到子任务被运行了指定的次数。
     * 即使子任务返回失败，它也可以选择继续执行子任务
     */
    var Repeater = /** @class */ (function (_super) {
        __extends(Repeater, _super);
        function Repeater(count, endOnFailure) {
            if (endOnFailure === void 0) { endOnFailure = false; }
            var _this = _super.call(this) || this;
            /** 是否永远重复 */
            _this.repeatForever = false;
            _this._iterationCount = 0;
            _this.count = count;
            _this.endOnFailure = endOnFailure;
            return _this;
        }
        Repeater.prototype.onStart = function () {
            this._iterationCount = 0;
        };
        Repeater.prototype.update = function (context) {
            behaviourTree.Assert.isNotNull(this.child, "child必须不能为空");
            // 我们在这里和运行后检查，以防计数为0
            if (!this.repeatForever && this._iterationCount == this.count)
                return behaviourTree.TaskStatus.Success;
            var status = this.child.tick(context);
            this._iterationCount++;
            if (this.endOnFailure && status == behaviourTree.TaskStatus.Failure)
                return behaviourTree.TaskStatus.Success;
            if (!this.repeatForever && this._iterationCount == this.count)
                return behaviourTree.TaskStatus.Success;
            return behaviourTree.TaskStatus.Running;
        };
        return Repeater;
    }(behaviourTree.Decorator));
    behaviourTree.Repeater = Repeater;
})(behaviourTree || (behaviourTree = {}));
var behaviourTree;
(function (behaviourTree) {
    /**
     * 将继续执行其子任务，直到子任务返回失败
     */
    var UntilFail = /** @class */ (function (_super) {
        __extends(UntilFail, _super);
        function UntilFail() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        UntilFail.prototype.update = function (context) {
            behaviourTree.Assert.isNotNull(this.child, "child必须不为空");
            var status = this.child.update(context);
            if (status != behaviourTree.TaskStatus.Failure)
                return behaviourTree.TaskStatus.Running;
            return behaviourTree.TaskStatus.Success;
        };
        return UntilFail;
    }(behaviourTree.Decorator));
    behaviourTree.UntilFail = UntilFail;
})(behaviourTree || (behaviourTree = {}));
var behaviourTree;
(function (behaviourTree) {
    /**
     * 将继续执行其子任务，直到子任务返回成功
     */
    var UntilSuccess = /** @class */ (function (_super) {
        __extends(UntilSuccess, _super);
        function UntilSuccess() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        UntilSuccess.prototype.update = function (context) {
            behaviourTree.Assert.isNotNull(this.child, "child必须不为空");
            var status = this.child.update(context);
            if (status != behaviourTree.TaskStatus.Success)
                return behaviourTree.TaskStatus.Running;
            return behaviourTree.TaskStatus.Success;
        };
        return UntilSuccess;
    }(behaviourTree.Decorator));
    behaviourTree.UntilSuccess = UntilSuccess;
})(behaviourTree || (behaviourTree = {}));
var behaviourTree;
(function (behaviourTree) {
    /**
     * 数组扩展器
     * 模拟 Stack<T>.
     */
    var ArrayExt = /** @class */ (function () {
        function ArrayExt() {
        }
        /**
         * 将数组打乱顺序
         */
        ArrayExt.shuffle = function (list) {
            var n = list.length - 1;
            while (n > 1) {
                n--;
                var k = behaviourTree.Random.range(0, n + 1);
                var value = list[k];
                list[k] = list[n];
                list[n] = value;
            }
        };
        /**
         * 取出数组第一个项
         */
        ArrayExt.peek = function (list) {
            return list[0];
        };
        /**
         * 向数组头部添加一个项
         */
        ArrayExt.push = function (list, item) {
            list.splice(0, 0, item);
        };
        /**
         * 移除数组第一个项并返回它
         */
        ArrayExt.pop = function (list) {
            return list.shift();
        };
        return ArrayExt;
    }());
    behaviourTree.ArrayExt = ArrayExt;
})(behaviourTree || (behaviourTree = {}));
var behaviourTree;
(function (behaviourTree) {
    var Assert = /** @class */ (function () {
        function Assert() {
        }
        Assert.fail = function (message) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            if (message)
                console.assert(false, message, args);
            else
                console.assert(false);
        };
        Assert.isTrue = function (condition, message) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            if (!condition) {
                if (message)
                    Assert.fail(message, args);
                else
                    Assert.fail();
            }
        };
        Assert.isNotNull = function (obj, message) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            Assert.isTrue(obj != null, message, args);
        };
        Assert.isFalse = function (condition, message) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            if (message)
                this.isTrue(!condition, message, args);
            else
                this.isTrue(!condition);
        };
        return Assert;
    }());
    behaviourTree.Assert = Assert;
})(behaviourTree || (behaviourTree = {}));
var behaviourTree;
(function (behaviourTree) {
    var Random = /** @class */ (function () {
        function Random() {
        }
        Random.range = function (min, max) {
            var seed = new Date().getTime();
            max = max || 1;
            min = min || 0;
            seed = (seed * 9301 + 49297) % 233280;
            var rnd = seed / 233280.0;
            return min + rnd * (max - min);
        };
        return Random;
    }());
    behaviourTree.Random = Random;
})(behaviourTree || (behaviourTree = {}));
var fsm;
(function (fsm) {
    var State = /** @class */ (function () {
        function State() {
        }
        State.prototype.setMachineAndContext = function (machine, context) {
            this._machine = machine;
            this._context = context;
            this.onInitialized();
        };
        /**
         * 在设置machine和context之后直接调用，允许状态执行任何所需的设置
         *
         * @memberof State
         */
        State.prototype.onInitialized = function () { };
        /**
         * 当状态变为活动状态时调用
         *
         * @memberof State
         */
        State.prototype.begin = function () { };
        /**
         * 在更新之前调用，允许状态最后一次机会改变状态
         *
         * @memberof State
         */
        State.prototype.reason = function () { };
        /**
         * 此状态不再是活动状态时调用
         *
         * @memberof State
         */
        State.prototype.end = function () { };
        return State;
    }());
    fsm.State = State;
})(fsm || (fsm = {}));
var fsm;
(function (fsm) {
    var StateMachine = /** @class */ (function () {
        function StateMachine(context, initialState) {
            this.elapsedTimeInState = 0;
            this._states = new Map();
            this._context = context;
            this.addState(initialState);
            this._currentState = initialState;
            this._currentState.begin();
        }
        Object.defineProperty(StateMachine.prototype, "currentState", {
            get: function () {
                return this._currentState;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 将状态添加到状态机
         * @param stateType
         * @param state
         */
        StateMachine.prototype.addState = function (state) {
            state.setMachineAndContext(this, this._context);
            this._states.set(es.TypeUtils.getType(state), state);
        };
        /**
         * 使用提供的增量时间为状态机计时
         * @param deltaTime
         */
        StateMachine.prototype.update = function (deltaTime) {
            this.elapsedTimeInState += deltaTime;
            this._currentState.reason();
            this._currentState.update(deltaTime);
        };
        /**
         * 从机器获取特定状态，而不必对其进行更改。
         * @param type
         */
        StateMachine.prototype.getState = function (type) {
            if (!this._states.has(type)) {
                console.error("\u72B6\u6001" + type + "\u4E0D\u5B58\u5728\u3002\u4F60\u662F\u4E0D\u662F\u5728\u8C03\u7528addState\u7684\u65F6\u5019\u5FD8\u8BB0\u6DFB\u52A0\u4E86?");
                return null;
            }
            return this._states.get(type);
        };
        /**
         * 更改当前状态
         * @param newType
         */
        StateMachine.prototype.changeState = function (newType) {
            if (this._currentState instanceof newType) {
                return this._currentState;
            }
            if (this.currentState) {
                this._currentState.end();
            }
            if (!this._states.has(newType)) {
                console.error("\u72B6\u6001" + newType + "\u4E0D\u5B58\u5728\u3002\u4F60\u662F\u4E0D\u662F\u5728\u8C03\u7528addState\u7684\u65F6\u5019\u5FD8\u8BB0\u6DFB\u52A0\u4E86?");
                return null;
            }
            this.elapsedTimeInState = 0;
            this.previousState = this._currentState;
            var newState = this._states.get(newType);
            if (newState)
                this._currentState = newState;
            this._currentState.begin();
            if (this.onStateChanged != null)
                this.onStateChanged();
            return this._currentState;
        };
        return StateMachine;
    }());
    fsm.StateMachine = StateMachine;
})(fsm || (fsm = {}));
var utilityAI;
(function (utilityAI) {
    var UtilityAI = /** @class */ (function () {
        function UtilityAI(context, rootSelector, updatePeriod) {
            if (updatePeriod === void 0) { updatePeriod = 0.2; }
            this._rootReasoner = rootSelector;
            this._context = context;
            this.updatePeriod = this._elapsedTime = updatePeriod;
        }
        UtilityAI.prototype.tick = function () {
            this._elapsedTime -= es.Time.deltaTime;
            while (this._elapsedTime <= 0) {
                this._elapsedTime += this.updatePeriod;
                var action = this._rootReasoner.select(this._context);
                if (action != null)
                    action.execute(this._context);
            }
        };
        return UtilityAI;
    }());
    utilityAI.UtilityAI = UtilityAI;
})(utilityAI || (utilityAI = {}));
var utilityAI;
(function (utilityAI) {
    /**
     * 包装Action以用作IAction而无需创建新类
     */
    var ActionExecutor = /** @class */ (function () {
        function ActionExecutor(action) {
            this._action = action;
        }
        ActionExecutor.prototype.execute = function (context) {
            this._action(context);
        };
        return ActionExecutor;
    }());
    utilityAI.ActionExecutor = ActionExecutor;
})(utilityAI || (utilityAI = {}));
var utilityAI;
(function (utilityAI) {
    /**
     * 包含选项列表的操作。
     * 这些选项将传递给Appraisals，从而对最佳选项进行评分并找到最佳选择。
     */
    var ActionWithOptions = /** @class */ (function () {
        function ActionWithOptions() {
            this._appraisals = new Array();
        }
        ActionWithOptions.prototype.getBestOption = function (context, options) {
            var result = null;
            // 表示单精度最小可能值
            var bestScore = -3.402823E+38;
            for (var i = 0; i < options.length; i++) {
                var option = options[i];
                var current = 0;
                for (var j = 0; j < this._appraisals.length; j++) {
                    current += this._appraisals[j].getScore(context, option);
                }
                if (current > bestScore) {
                    bestScore = current;
                    result = option;
                }
            }
            return result;
        };
        ActionWithOptions.prototype.addScorer = function (scorer) {
            this._appraisals.push(scorer);
            return this;
        };
        return ActionWithOptions;
    }());
    utilityAI.ActionWithOptions = ActionWithOptions;
})(utilityAI || (utilityAI = {}));
var utilityAI;
(function (utilityAI) {
    /**
     * 包含将按顺序执行的动作列表的动作
     */
    var CompositeAction = /** @class */ (function () {
        function CompositeAction() {
            this._actions = new Array();
        }
        CompositeAction.prototype.execute = function (context) {
            for (var i = 0; i < this._actions.length; i++) {
                this._actions[i].execute(context);
            }
        };
        CompositeAction.prototype.addAction = function (action) {
            this._actions.push(action);
            return this;
        };
        return CompositeAction;
    }());
    utilityAI.CompositeAction = CompositeAction;
})(utilityAI || (utilityAI = {}));
var utilityAI;
(function (utilityAI) {
    var LogAction = /** @class */ (function () {
        function LogAction(text) {
            this._text = text;
        }
        LogAction.prototype.execute = function (context) {
            console.log(this._text);
        };
        return LogAction;
    }());
    utilityAI.LogAction = LogAction;
})(utilityAI || (utilityAI = {}));
var utilityAI;
(function (utilityAI) {
    /**
     * 调用另一个Reasoner的操作
     */
    var ReasonerAction = /** @class */ (function () {
        function ReasonerAction(reasoner) {
            this._reasoner = reasoner;
        }
        ReasonerAction.prototype.execute = function (context) {
            var action = this._reasoner.select(context);
            if (action != null)
                action.execute(context);
        };
        return ReasonerAction;
    }());
    utilityAI.ReasonerAction = ReasonerAction;
})(utilityAI || (utilityAI = {}));
var utilityAI;
(function (utilityAI) {
    /**
     * 只有当所有的子项得分高于阈值的分数
     */
    var AllOrNothingConsideration = /** @class */ (function () {
        function AllOrNothingConsideration(threshold) {
            if (threshold === void 0) { threshold = 0; }
            this._appraisals = new Array();
            this.threshold = threshold;
        }
        AllOrNothingConsideration.prototype.addAppraisal = function (appraisal) {
            this._appraisals.push(appraisal);
            return this;
        };
        AllOrNothingConsideration.prototype.getScore = function (context) {
            var sum = 0;
            for (var i = 0; i < this._appraisals.length; i++) {
                var score = this._appraisals[i].getScore(context);
                if (score < this.threshold)
                    return 0;
                sum += score;
            }
            return sum;
        };
        return AllOrNothingConsideration;
    }());
    utilityAI.AllOrNothingConsideration = AllOrNothingConsideration;
})(utilityAI || (utilityAI = {}));
var utilityAI;
(function (utilityAI) {
    /**
     * 总是返回一个固定的分数。 作为默认考虑，提供双重任务。
     */
    var FixedScoreConsideration = /** @class */ (function () {
        function FixedScoreConsideration(score) {
            if (score === void 0) { score = 1; }
            this.score = score;
        }
        FixedScoreConsideration.prototype.getScore = function (context) {
            return this.score;
        };
        return FixedScoreConsideration;
    }());
    utilityAI.FixedScoreConsideration = FixedScoreConsideration;
})(utilityAI || (utilityAI = {}));
var utilityAI;
(function (utilityAI) {
    /**
     * 通过总结所有子项评估的分数得分
     */
    var SumOfChildrenConsideration = /** @class */ (function () {
        function SumOfChildrenConsideration() {
            this._appraisals = new Array();
        }
        SumOfChildrenConsideration.prototype.getScore = function (context) {
            var score = 0;
            for (var i = 0; i < this._appraisals.length; i++) {
                score += this._appraisals[i].getScore(context);
            }
            return score;
        };
        return SumOfChildrenConsideration;
    }());
    utilityAI.SumOfChildrenConsideration = SumOfChildrenConsideration;
})(utilityAI || (utilityAI = {}));
var utilityAI;
(function (utilityAI) {
    /**
     * 通过总结子项评估得分，直到子项得分低于阈值
     */
    var ThresholdConsideration = /** @class */ (function () {
        function ThresholdConsideration(threshold) {
            this._appraisals = new Array();
            this.threshold = threshold;
        }
        ThresholdConsideration.prototype.getScore = function (context) {
            var sum = 0;
            for (var i = 0; i < this._appraisals.length; i++) {
                var score = this._appraisals[i].getScore(context);
                if (score < this.threshold)
                    return sum;
                sum += score;
            }
            return sum;
        };
        return ThresholdConsideration;
    }());
    utilityAI.ThresholdConsideration = ThresholdConsideration;
})(utilityAI || (utilityAI = {}));
var utilityAI;
(function (utilityAI) {
    /**
     * 包装Func以用作评估而无需创建子类
     */
    var ActionAppraisal = /** @class */ (function () {
        function ActionAppraisal(appraisalAction) {
            this._appraisalAction = appraisalAction;
        }
        ActionAppraisal.prototype.getScore = function (context) {
            return this._appraisalAction(context);
        };
        return ActionAppraisal;
    }());
    utilityAI.ActionAppraisal = ActionAppraisal;
})(utilityAI || (utilityAI = {}));
var utilityAI;
(function (utilityAI) {
    /**
     * UtilityAI的根节点
     */
    var Reasoner = /** @class */ (function () {
        function Reasoner() {
            this.defaultConsideration = new utilityAI.FixedScoreConsideration();
            this._condiderations = new Array();
        }
        Reasoner.prototype.select = function (context) {
            var consideration = this.selectBestConsideration(context);
            if (consideration != null)
                return consideration.action;
            return null;
        };
        Reasoner.prototype.addConsideration = function (consideration) {
            this._condiderations.push(consideration);
            return this;
        };
        Reasoner.prototype.setDefaultConsideration = function (defaultConsideration) {
            this.defaultConsideration = defaultConsideration;
            return this;
        };
        return Reasoner;
    }());
    utilityAI.Reasoner = Reasoner;
})(utilityAI || (utilityAI = {}));
///<reference path="./Reasoner.ts"/>
var utilityAI;
///<reference path="./Reasoner.ts"/>
(function (utilityAI) {
    /**
     * 选择高于默认考虑分数的第一个考虑因素
     */
    var FirstScoreReasoner = /** @class */ (function (_super) {
        __extends(FirstScoreReasoner, _super);
        function FirstScoreReasoner() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        FirstScoreReasoner.prototype.selectBestConsideration = function (context) {
            var defaultScore = this.defaultConsideration.getScore(context);
            for (var i = 0; i < this._condiderations.length; i++) {
                if (this._condiderations[i].getScore(context) >= defaultScore)
                    return this._condiderations[i];
            }
            return this.defaultConsideration;
        };
        return FirstScoreReasoner;
    }(utilityAI.Reasoner));
    utilityAI.FirstScoreReasoner = FirstScoreReasoner;
})(utilityAI || (utilityAI = {}));
///<reference path="./Reasoner.ts"/>
var utilityAI;
///<reference path="./Reasoner.ts"/>
(function (utilityAI) {
    /**
     * 选择评分最高的考虑因素
     */
    var HighestScoreReasoner = /** @class */ (function (_super) {
        __extends(HighestScoreReasoner, _super);
        function HighestScoreReasoner() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        HighestScoreReasoner.prototype.selectBestConsideration = function (context) {
            var highsetScore = this.defaultConsideration.getScore(context);
            var consideration = null;
            for (var i = 0; i < this._condiderations.length; i++) {
                var score = this._condiderations[i].getScore(context);
                if (score > highsetScore) {
                    highsetScore = score;
                    consideration = this._condiderations[i];
                }
            }
            if (consideration == null)
                return this.defaultConsideration;
            return consideration;
        };
        return HighestScoreReasoner;
    }(utilityAI.Reasoner));
    utilityAI.HighestScoreReasoner = HighestScoreReasoner;
})(utilityAI || (utilityAI = {}));
