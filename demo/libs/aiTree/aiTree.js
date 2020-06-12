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
var Behavior = (function () {
    function Behavior() {
        this.status = TaskStatus.Invalid;
    }
    Behavior.prototype.invalidate = function () {
        this.status = TaskStatus.Invalid;
    };
    Behavior.prototype.onStart = function () { };
    Behavior.prototype.onEnd = function () { };
    Behavior.prototype.tick = function (context) {
        if (this.status == TaskStatus.Invalid)
            this.onStart();
        this.status = this.update(context);
        if (this.status != TaskStatus.Running)
            this.onEnd();
        return this.status;
    };
    return Behavior;
}());
var BehaviorTree = (function () {
    function BehaviorTree(context, rootNode, updatePeriod) {
        if (updatePeriod === void 0) { updatePeriod = 0.2; }
        this.lastUpdate = 0;
        this.stepUpdateCounter = 0;
        this._context = context;
        this._root = rootNode;
        this.updatePeriod = this._elapsedTime = updatePeriod;
        this.lastUpdate = egret.getTimer();
    }
    BehaviorTree.prototype.tick = function () {
        var now = egret.getTimer();
        var dt = now - this.lastUpdate;
        this.lastUpdate = now;
        this.stepUpdateCounter += dt;
        if (this.updatePeriod > 0) {
            if (this.stepUpdateCounter >= this.updatePeriod) {
                this._root.tick(this._context);
                this.stepUpdateCounter -= this.updatePeriod;
            }
        }
        else {
            this._root.tick(this._context);
        }
    };
    return BehaviorTree;
}());
var BehaviorTreeBuilder = (function () {
    function BehaviorTreeBuilder(context) {
        this._parentNodeStack = new Array();
        this._context = context;
    }
    BehaviorTreeBuilder.begin = function (context) {
        return new BehaviorTreeBuilder(context);
    };
    BehaviorTreeBuilder.prototype.setChildOnParent = function (child) {
        var parent = ArrayExt.peek(this._parentNodeStack);
        if (parent instanceof Composite) {
            parent.addChild(child);
        }
        else if (parent instanceof Decorator) {
            parent.child = child;
            this.endDecorator();
        }
        return this;
    };
    BehaviorTreeBuilder.prototype.pushParentNode = function (composite) {
        if (this._parentNodeStack.length > 0)
            this.setChildOnParent(composite);
        ArrayExt.push(this._parentNodeStack, composite);
        return this;
    };
    BehaviorTreeBuilder.prototype.endDecorator = function () {
        this._currentNode = ArrayExt.pop(this._parentNodeStack);
        return this;
    };
    BehaviorTreeBuilder.prototype.action = function (func) {
        Assert.isFalse(this._parentNodeStack.length == 0, "无法创建无嵌套的动作节点, 它必须是一个叶节点");
        return this.setChildOnParent(new ExecuteAction(func));
    };
    BehaviorTreeBuilder.prototype.actionR = function (func) {
        return this.action(function (t) { return func(t) ? TaskStatus.Success : TaskStatus.Failure; });
    };
    BehaviorTreeBuilder.prototype.conditional = function (func) {
        Assert.isFalse(this._parentNodeStack.length == 0, "无法创建无嵌套的条件节点, 它必须是一个叶节点");
        return this.setChildOnParent(new ExecuteActionConditional(func));
    };
    BehaviorTreeBuilder.prototype.conditionalR = function (func) {
        return this.conditional(function (t) { return func(t) ? TaskStatus.Success : TaskStatus.Failure; });
    };
    BehaviorTreeBuilder.prototype.logAction = function (text) {
        Assert.isFalse(this._parentNodeStack.length == 0, "无法创建无嵌套的动作节点, 它必须是一个叶节点");
        return this.setChildOnParent(new LogAction(text));
    };
    BehaviorTreeBuilder.prototype.waitAction = function (waitTime) {
        Assert.isFalse(this._parentNodeStack.length == 0, "无法创建无嵌套的动作节点, 它必须是一个叶节点");
        return this.setChildOnParent(new WaitAciton(waitTime));
    };
    BehaviorTreeBuilder.prototype.subTree = function (subTree) {
        Assert.isFalse(this._parentNodeStack.length == 0, "无法创建无嵌套的动作节点, 它必须是一个叶节点");
        return this.setChildOnParent(new BehaviorTreeReference(subTree));
    };
    BehaviorTreeBuilder.prototype.conditionalDecorator = function (func, shouldReevaluate) {
        if (shouldReevaluate === void 0) { shouldReevaluate = true; }
        var conditional = new ExecuteActionConditional(func);
        return this.pushParentNode(new ConditionalDecorator(conditional, shouldReevaluate));
    };
    BehaviorTreeBuilder.prototype.conditionalDecoratorR = function (func, shouldReevaluate) {
        if (shouldReevaluate === void 0) { shouldReevaluate = true; }
        return this.conditionalDecorator(function (t) { return func(t) ? TaskStatus.Success : TaskStatus.Failure; }, shouldReevaluate);
    };
    BehaviorTreeBuilder.prototype.alwaysFail = function () {
        return this.pushParentNode(new AlwaysFail());
    };
    BehaviorTreeBuilder.prototype.alwaysSucceed = function () {
        return this.pushParentNode(new AlwaysSucceed());
    };
    BehaviorTreeBuilder.prototype.inverter = function () {
        return this.pushParentNode(new Inverter());
    };
    BehaviorTreeBuilder.prototype.repeater = function (count) {
        return this.pushParentNode(new Repeater(count));
    };
    BehaviorTreeBuilder.prototype.untilFail = function () {
        return this.pushParentNode(new UntilFail());
    };
    BehaviorTreeBuilder.prototype.untilSuccess = function () {
        return this.pushParentNode(new UntilSuccess());
    };
    BehaviorTreeBuilder.prototype.paraller = function () {
        return this.pushParentNode(new Parallel());
    };
    BehaviorTreeBuilder.prototype.parallelSelector = function () {
        return this.pushParentNode(new ParallelSelector());
    };
    BehaviorTreeBuilder.prototype.selector = function (abortType) {
        if (abortType === void 0) { abortType = AbortTypes.None; }
        return this.pushParentNode(new Selector(abortType));
    };
    BehaviorTreeBuilder.prototype.randomSelector = function () {
        return this.pushParentNode(new RandomSelector());
    };
    BehaviorTreeBuilder.prototype.sequence = function (abortType) {
        if (abortType === void 0) { abortType = AbortTypes.None; }
        return this.pushParentNode(new Sequence(abortType));
    };
    BehaviorTreeBuilder.prototype.randomSequence = function () {
        return this.pushParentNode(new RandomSequence());
    };
    BehaviorTreeBuilder.prototype.endComposite = function () {
        Assert.isTrue(ArrayExt.peek(this._parentNodeStack) instanceof Composite, "尝试结束复合器，但顶部节点是装饰器");
        this._currentNode = ArrayExt.pop(this._parentNodeStack);
        return this;
    };
    BehaviorTreeBuilder.prototype.build = function (updatePeriod) {
        if (updatePeriod === void 0) { updatePeriod = 0.2; }
        Assert.isNotNull(this._currentNode, "无法创建零节点的行为树");
        return new BehaviorTree(this._context, this._currentNode, updatePeriod);
    };
    return BehaviorTreeBuilder;
}());
var TaskStatus;
(function (TaskStatus) {
    TaskStatus[TaskStatus["Invalid"] = 0] = "Invalid";
    TaskStatus[TaskStatus["Success"] = 1] = "Success";
    TaskStatus[TaskStatus["Failure"] = 2] = "Failure";
    TaskStatus[TaskStatus["Running"] = 3] = "Running";
})(TaskStatus || (TaskStatus = {}));
var BehaviorTreeReference = (function (_super) {
    __extends(BehaviorTreeReference, _super);
    function BehaviorTreeReference(tree) {
        var _this = _super.call(this) || this;
        _this._childTree = tree;
        return _this;
    }
    BehaviorTreeReference.prototype.update = function (context) {
        this._childTree.tick();
        return TaskStatus.Success;
    };
    return BehaviorTreeReference;
}(Behavior));
var ExecuteAction = (function (_super) {
    __extends(ExecuteAction, _super);
    function ExecuteAction(action) {
        var _this = _super.call(this) || this;
        _this._action = action;
        return _this;
    }
    ExecuteAction.prototype.update = function (context) {
        Assert.isNotNull(this._action, "action 必须不为空");
        return this._action(context);
    };
    return ExecuteAction;
}(Behavior));
var LogAction = (function (_super) {
    __extends(LogAction, _super);
    function LogAction(text) {
        var _this = _super.call(this) || this;
        _this.text = text;
        return _this;
    }
    LogAction.prototype.update = function (context) {
        if (this.isError)
            console.error(this.text);
        else
            console.log(this.text);
        return TaskStatus.Success;
    };
    return LogAction;
}(Behavior));
var WaitAciton = (function (_super) {
    __extends(WaitAciton, _super);
    function WaitAciton(waitTime) {
        var _this = _super.call(this) || this;
        _this.waitTime = waitTime;
        return _this;
    }
    WaitAciton.prototype.onStart = function () {
        this._startTime = 0;
    };
    WaitAciton.prototype.update = function (context) {
        if (this._startTime == 0)
            this._startTime = Timer.time;
        if (Timer.time - this._startTime >= this.waitTime)
            return TaskStatus.Success;
        return TaskStatus.Running;
    };
    return WaitAciton;
}(Behavior));
var AbortTypes;
(function (AbortTypes) {
    AbortTypes[AbortTypes["None"] = 0] = "None";
    AbortTypes[AbortTypes["LowerPriority"] = 1] = "LowerPriority";
    AbortTypes[AbortTypes["Self"] = 2] = "Self";
    AbortTypes[AbortTypes["Both"] = 3] = "Both";
})(AbortTypes || (AbortTypes = {}));
var AbortTypesExt = (function () {
    function AbortTypesExt() {
    }
    AbortTypesExt.has = function (self, check) {
        return (self & check) == check;
    };
    return AbortTypesExt;
}());
var Composite = (function (_super) {
    __extends(Composite, _super);
    function Composite() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.abortType = AbortTypes.None;
        _this._children = new Array();
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
        this._hasLowerPriorityConditionalAbort = this.hasLowerPriorityConditionalAbortInChildren();
        this._currentChildIndex = 0;
    };
    Composite.prototype.onEnd = function () {
        for (var i = 0; i < this._children.length; i++) {
            this._children[i].invalidate();
        }
    };
    Composite.prototype.hasLowerPriorityConditionalAbortInChildren = function () {
        for (var i = 0; i < this._children.length; i++) {
            var composite = this._children[i];
            if (composite != null && AbortTypesExt.has(composite.abortType, AbortTypes.LowerPriority)) {
                if (composite.isFirstChildConditional())
                    return true;
            }
        }
        return false;
    };
    Composite.prototype.addChild = function (child) {
        this._children.push(child);
    };
    Composite.prototype.isFirstChildConditional = function () {
        return egret.is(this._children[0], "IConditional");
    };
    Composite.prototype.updateSelfAbortConditional = function (context, statusCheck) {
        for (var i = 0; i < this._currentChildIndex; i++) {
            var child = this._children[i];
            if (!egret.is(child, "IConditional")) {
                continue;
            }
            var status_1 = this.updateConditionalNode(context, child);
            if (status_1 != statusCheck) {
                this._currentChildIndex = i;
                for (var j = i; j < this._children.length; j++) {
                    this._children[j].invalidate();
                }
                break;
            }
        }
    };
    Composite.prototype.updateLowerPriorityAbortConditional = function (context, statusCheck) {
        for (var i = 0; i < this._currentChildIndex; i++) {
            var composite = this._children[i];
            if (composite != null && AbortTypesExt.has(composite.abortType, AbortTypes.LowerPriority)) {
                var child = composite._children[0];
                var status_2 = this.updateConditionalNode(context, child);
                if (status_2 != statusCheck) {
                    this._currentChildIndex = i;
                    for (var j = i; j < this._children.length; j++) {
                        this._children[j].invalidate();
                    }
                    break;
                }
            }
        }
    };
    Composite.prototype.updateConditionalNode = function (context, node) {
        if (node instanceof ConditionalDecorator)
            return node.executeConditional(context, true);
        else
            return node.update(context);
    };
    return Composite;
}(Behavior));
var Parallel = (function (_super) {
    __extends(Parallel, _super);
    function Parallel() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Parallel.prototype.update = function (context) {
        var didAllSucceed = true;
        for (var i = 0; i < this._children.length; i++) {
            var child = this._children[i];
            child.tick(context);
            if (child.status == TaskStatus.Failure)
                return TaskStatus.Failure;
            else if (child.status != TaskStatus.Success)
                didAllSucceed = false;
        }
        if (didAllSucceed)
            return TaskStatus.Success;
        return TaskStatus.Running;
    };
    return Parallel;
}(Composite));
var ParallelSelector = (function (_super) {
    __extends(ParallelSelector, _super);
    function ParallelSelector() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ParallelSelector.prototype.update = function (context) {
        var didAllFail = true;
        for (var i = 0; i < this._children.length; i++) {
            var child = this._children[i];
            child.tick(context);
            if (child.status == TaskStatus.Success)
                return TaskStatus.Success;
            if (child.status != TaskStatus.Failure)
                didAllFail = false;
        }
        if (didAllFail)
            return TaskStatus.Failure;
        return TaskStatus.Running;
    };
    return ParallelSelector;
}(Composite));
var Selector = (function (_super) {
    __extends(Selector, _super);
    function Selector(abortType) {
        if (abortType === void 0) { abortType = AbortTypes.None; }
        var _this = _super.call(this) || this;
        _this.abortType = abortType;
        return _this;
    }
    Selector.prototype.update = function (context) {
        if (this._currentChildIndex != 0)
            this.handleConditionalAborts(context);
        var current = this._children[this._currentChildIndex];
        var status = current.tick(context);
        if (status != TaskStatus.Failure)
            return status;
        this._currentChildIndex++;
        if (this._currentChildIndex == this._children.length) {
            this._currentChildIndex = 0;
            return TaskStatus.Failure;
        }
        return TaskStatus.Running;
    };
    Selector.prototype.handleConditionalAborts = function (context) {
        if (this._hasLowerPriorityConditionalAbort)
            this.updateLowerPriorityAbortConditional(context, TaskStatus.Failure);
        if (AbortTypesExt.has(this.abortType, AbortTypes.Self))
            this.updateSelfAbortConditional(context, TaskStatus.Failure);
    };
    return Selector;
}(Composite));
var RandomSelector = (function (_super) {
    __extends(RandomSelector, _super);
    function RandomSelector() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    RandomSelector.prototype.onStart = function () {
        ArrayExt.shuffle(this._children);
    };
    return RandomSelector;
}(Selector));
var Sequence = (function (_super) {
    __extends(Sequence, _super);
    function Sequence(abortType) {
        if (abortType === void 0) { abortType = AbortTypes.None; }
        var _this = _super.call(this) || this;
        _this.abortType = abortType;
        return _this;
    }
    Sequence.prototype.update = function (context) {
        if (this._currentChildIndex != 0) {
            this.handleConditionalAborts(context);
        }
        var current = this._children[this._currentChildIndex];
        var status = current.tick(context);
        if (status != TaskStatus.Success)
            return status;
        this._currentChildIndex++;
        if (this._currentChildIndex == this._children.length) {
            this._currentChildIndex = 0;
            return TaskStatus.Success;
        }
        return TaskStatus.Running;
    };
    Sequence.prototype.handleConditionalAborts = function (context) {
        if (this._hasLowerPriorityConditionalAbort)
            this.updateLowerPriorityAbortConditional(context, TaskStatus.Success);
        if (AbortTypesExt.has(this.abortType, AbortTypes.Self))
            this.updateSelfAbortConditional(context, TaskStatus.Success);
    };
    return Sequence;
}(Composite));
var RandomSequence = (function (_super) {
    __extends(RandomSequence, _super);
    function RandomSequence() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    RandomSequence.prototype.onStart = function () {
        ArrayExt.shuffle(this._children);
    };
    return RandomSequence;
}(Sequence));
var ExecuteActionConditional = (function (_super) {
    __extends(ExecuteActionConditional, _super);
    function ExecuteActionConditional(action) {
        return _super.call(this, action) || this;
    }
    return ExecuteActionConditional;
}(ExecuteAction));
var RandomProbability = (function (_super) {
    __extends(RandomProbability, _super);
    function RandomProbability(successProbability) {
        var _this = _super.call(this) || this;
        _this._successProbability = successProbability;
        return _this;
    }
    RandomProbability.prototype.update = function (context) {
        if (Math.random() > this._successProbability)
            return TaskStatus.Success;
        return TaskStatus.Failure;
    };
    return RandomProbability;
}(Behavior));
var Decorator = (function (_super) {
    __extends(Decorator, _super);
    function Decorator() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Decorator.prototype.invalidate = function () {
        _super.prototype.invalidate.call(this);
        this.child.invalidate();
    };
    return Decorator;
}(Behavior));
var AlwaysFail = (function (_super) {
    __extends(AlwaysFail, _super);
    function AlwaysFail() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AlwaysFail.prototype.update = function (context) {
        Assert.isNotNull(this.child, "child必须不能为空");
        var status = this.child.update(context);
        if (status == TaskStatus.Running)
            return TaskStatus.Running;
        return TaskStatus.Failure;
    };
    return AlwaysFail;
}(Decorator));
var AlwaysSucceed = (function (_super) {
    __extends(AlwaysSucceed, _super);
    function AlwaysSucceed() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AlwaysSucceed.prototype.update = function (context) {
        Assert.isNotNull(this.child, "child必须不能为空");
        var status = this.child.update(context);
        if (status == TaskStatus.Running)
            return TaskStatus.Running;
        return TaskStatus.Success;
    };
    return AlwaysSucceed;
}(Decorator));
var ConditionalDecorator = (function (_super) {
    __extends(ConditionalDecorator, _super);
    function ConditionalDecorator(conditional, shouldReevalute) {
        if (shouldReevalute === void 0) { shouldReevalute = true; }
        var _this = _super.call(this) || this;
        Assert.isTrue(egret.is(conditional, "IConditional"), "conditional 必须继承 IConditional");
        _this._conditional = conditional;
        _this._shouldReevaluate = shouldReevalute;
        return _this;
    }
    ConditionalDecorator.prototype.invalidate = function () {
        _super.prototype.invalidate.call(this);
        this._conditionalStatus = TaskStatus.Invalid;
    };
    ConditionalDecorator.prototype.onStart = function () {
        this._conditionalStatus = TaskStatus.Invalid;
    };
    ConditionalDecorator.prototype.update = function (context) {
        Assert.isNotNull(this.child, "child不能为空");
        this._conditionalStatus = this.executeConditional(context);
        if (this._conditionalStatus == TaskStatus.Success)
            return this.child.tick(context);
        return TaskStatus.Failure;
    };
    ConditionalDecorator.prototype.executeConditional = function (context, forceUpdate) {
        if (forceUpdate === void 0) { forceUpdate = false; }
        if (forceUpdate || this._shouldReevaluate || this._conditionalStatus == TaskStatus.Invalid)
            this._conditionalStatus = this._conditional.update(context);
        return this._conditionalStatus;
    };
    return ConditionalDecorator;
}(Decorator));
var Inverter = (function (_super) {
    __extends(Inverter, _super);
    function Inverter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Inverter.prototype.update = function (context) {
        Assert.isNotNull(this.child, "child必须不能为空");
        var status = this.child.tick(context);
        if (status == TaskStatus.Success)
            return TaskStatus.Failure;
        if (status == TaskStatus.Failure)
            return TaskStatus.Success;
        return TaskStatus.Running;
    };
    return Inverter;
}(Decorator));
var Repeater = (function (_super) {
    __extends(Repeater, _super);
    function Repeater(count, endOnFailure) {
        if (endOnFailure === void 0) { endOnFailure = false; }
        var _this = _super.call(this) || this;
        _this.count = count;
        _this.endOnFailure = endOnFailure;
        return _this;
    }
    Repeater.prototype.onStart = function () {
        this._iterationCount = 0;
    };
    Repeater.prototype.update = function (context) {
        Assert.isNotNull(this.child, "child必须不能为空");
        if (!this.repeatForever && this._iterationCount == this.count)
            return TaskStatus.Success;
        var status = this.child.tick(context);
        this._iterationCount++;
        if (this.endOnFailure && status == TaskStatus.Failure)
            return TaskStatus.Success;
        if (!this.repeatForever && this._iterationCount == this.count)
            return TaskStatus.Success;
        return TaskStatus.Running;
    };
    return Repeater;
}(Decorator));
var UntilFail = (function (_super) {
    __extends(UntilFail, _super);
    function UntilFail() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    UntilFail.prototype.update = function (context) {
        Assert.isNotNull(this.child, "child必须不为空");
        var status = this.child.update(context);
        if (status != TaskStatus.Failure)
            return TaskStatus.Running;
        return TaskStatus.Success;
    };
    return UntilFail;
}(Decorator));
var UntilSuccess = (function (_super) {
    __extends(UntilSuccess, _super);
    function UntilSuccess() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    UntilSuccess.prototype.update = function (context) {
        Assert.isNotNull(this.child, "child必须不为空");
        var status = this.child.update(context);
        if (status != TaskStatus.Success)
            return TaskStatus.Running;
        return TaskStatus.Success;
    };
    return UntilSuccess;
}(Decorator));
var ArrayExt = (function () {
    function ArrayExt() {
    }
    ArrayExt.shuffle = function (list) {
        var n = list.length - 1;
        while (n > 1) {
            n--;
            var k = Random.range(0, n + 1);
            var value = list[k];
            list[k] = list[n];
            list[n] = value;
        }
    };
    ArrayExt.peek = function (list) {
        return list[0];
    };
    ArrayExt.push = function (list, item) {
        list.splice(0, 0, item);
    };
    ArrayExt.pop = function (list) {
        return list.shift();
    };
    return ArrayExt;
}());
var Assert = (function () {
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
var Mathf = (function () {
    function Mathf() {
    }
    Mathf.map01 = function (value, min, max) {
        return (value - min) * 1 / (max - min);
    };
    return Mathf;
}());
var Random = (function () {
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
var Timer = (function () {
    function Timer() {
        this._enumI = 0;
        this._enumCount = 0;
        this._lastTimer = 0;
        this._items = new Array();
        this._itemPool = new Array();
        this._lastTimer = egret.getTimer();
        Timer.time = this._lastTimer;
        egret.startTick(this.__timer, this);
    }
    Timer.prototype.getItem = function () {
        if (this._itemPool.length)
            return this._itemPool.pop();
        else
            return new TimerItem();
    };
    Timer.prototype.findItem = function (callback, thisObj) {
        var len = this._items.length;
        for (var i = 0; i < len; i++) {
            var item = this._items[i];
            if (item.callback == callback && item.thisObj == thisObj)
                return item;
        }
        return null;
    };
    Timer.prototype.add = function (delayInMiniseconds, repeat, callback, thisObj, callbackParam) {
        if (callbackParam === void 0) { callbackParam = null; }
        var item = this.findItem(callback, thisObj);
        if (!item) {
            item = this.getItem();
            item.callback = callback;
            item.hasParam = callback.length == 1;
            item.thisObj = thisObj;
            this._items.push(item);
        }
        item.delay = delayInMiniseconds;
        item.counter = 0;
        item.repeat = repeat;
        item.param = callbackParam;
        item.end = false;
    };
    Timer.prototype.callLater = function (callback, thisObj, callbackParam) {
        if (callbackParam === void 0) { callbackParam = null; }
        this.add(1, 1, callback, thisObj, callbackParam);
    };
    Timer.prototype.callDelay = function (delay, callback, thisObj, callbackParam) {
        if (callbackParam === void 0) { callbackParam = null; }
        this.add(delay, 1, callback, thisObj, callbackParam);
    };
    Timer.prototype.callBy24Fps = function (callback, thisObj, callbackParam) {
        if (callbackParam === void 0) { callbackParam = null; }
        this.add(Timer.FPS24, 0, callback, thisObj, callbackParam);
    };
    Timer.prototype.exists = function (callback, thisObj) {
        var item = this.findItem(callback, thisObj);
        return item != null;
    };
    Timer.prototype.remove = function (callback, thisObj) {
        var item = this.findItem(callback, thisObj);
        if (item) {
            var i = this._items.indexOf(item);
            this._items.splice(i, 1);
            if (i < this._enumI)
                this._enumI--;
            this._enumCount--;
            item.reset();
            this._itemPool.push(item);
        }
    };
    Timer.prototype.__timer = function (TimerStamp) {
        Timer.time = TimerStamp;
        Timer.deltaTime = TimerStamp - this._lastTimer;
        this._lastTimer = TimerStamp;
        this._enumI = 0;
        this._enumCount = this._items.length;
        while (this._enumI < this._enumCount) {
            var item = this._items[this._enumI];
            this._enumI++;
            if (item.advance(Timer.deltaTime)) {
                if (item.end) {
                    this._enumI--;
                    this._enumCount--;
                    this._items.splice(this._enumI, 1);
                }
                if (item.hasParam)
                    item.callback.call(item.thisObj, item.param);
                else
                    item.callback.call(item.thisObj);
                if (item.end) {
                    item.reset();
                    this._itemPool.push(item);
                }
            }
        }
        return false;
    };
    Timer.deltaTime = 0;
    Timer.time = 0;
    Timer.inst = new Timer();
    Timer.FPS24 = 1000 / 24;
    return Timer;
}());
var TimerItem = (function () {
    function TimerItem() {
        this.delay = 0;
        this.repeat = 0;
        this.counter = 0;
    }
    TimerItem.prototype.advance = function (elapsed) {
        if (elapsed === void 0) { elapsed = 0; }
        this.counter += elapsed;
        if (this.counter >= this.delay) {
            this.counter -= this.delay;
            if (this.counter > this.delay)
                this.counter = this.delay;
            if (this.repeat > 0) {
                this.repeat--;
                if (this.repeat == 0)
                    this.end = true;
            }
            return true;
        }
        else
            return false;
    };
    TimerItem.prototype.reset = function () {
        this.callback = null;
        this.thisObj = null;
        this.param = null;
    };
    return TimerItem;
}());
var fsm;
(function (fsm) {
    var SimpleStateMachine = (function () {
        function SimpleStateMachine() {
            this.elapsedTimeInState = 0;
            this._stateCache = {};
        }
        Object.defineProperty(SimpleStateMachine.prototype, "currentState", {
            get: function () {
                return this._currentState;
            },
            set: function (value) {
                if (this._currentState == value)
                    return;
                this.previousState = this._currentState;
                this._currentState = value;
                if (this._stateMethods.exitState != null)
                    this._stateMethods.exitState();
                this.elapsedTimeInState = 0;
                this._stateMethods = this._stateCache[this._currentState];
                if (this._stateMethods.enterState != null)
                    this._stateMethods.enterState();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SimpleStateMachine.prototype, "initialState", {
            set: function (value) {
                this._currentState = value;
                this._stateMethods = this._stateCache[this._currentState];
                if (this._stateMethods.enterState != null)
                    this._stateMethods.enterState();
            },
            enumerable: true,
            configurable: true
        });
        SimpleStateMachine.prototype.update = function () {
            if (this._stateMethods.tick != null)
                this._stateMethods.tick();
        };
        SimpleStateMachine.prototype.setEnterMethod = function (stateName, enterState, tickState, exitState) {
            var state = new StateMethodCache();
            state.enterState = enterState;
            state.tick = tickState;
            state.exitState = exitState;
            this._stateCache[stateName] = state;
        };
        return SimpleStateMachine;
    }());
    fsm.SimpleStateMachine = SimpleStateMachine;
    var StateMethodCache = (function () {
        function StateMethodCache() {
        }
        return StateMethodCache;
    }());
    fsm.StateMethodCache = StateMethodCache;
})(fsm || (fsm = {}));
var fsm;
(function (fsm) {
    var State = (function () {
        function State() {
        }
        State.prototype.setMachineAndContext = function (machine, context) {
            this._machine = machine;
            this._context = context;
            this.onInitialized();
        };
        State.prototype.onInitialized = function () { };
        State.prototype.begin = function () { };
        State.prototype.reason = function () { };
        State.prototype.end = function () { };
        return State;
    }());
    fsm.State = State;
})(fsm || (fsm = {}));
var fsm;
(function (fsm) {
    var StateMachine = (function () {
        function StateMachine(context, initialState) {
            this.elapsedTimeInState = 0;
            this._states = {};
            this._context = context;
            this.addState(initialState);
        }
        Object.defineProperty(StateMachine.prototype, "currentState", {
            get: function () {
                return this._currentState;
            },
            enumerable: true,
            configurable: true
        });
        StateMachine.prototype.addState = function (state) {
            state.setMachineAndContext(this, this._context);
        };
        return StateMachine;
    }());
    fsm.StateMachine = StateMachine;
})(fsm || (fsm = {}));
var UtilityAI = (function () {
    function UtilityAI(context, rootSelector, updatePeriod) {
        if (updatePeriod === void 0) { updatePeriod = 0.2; }
        this._rootReasoner = rootSelector;
        this._context = context;
        this.updatePeriod = this._elapsedTime = updatePeriod;
    }
    UtilityAI.prototype.tick = function () {
        this._elapsedTime -= Number((1000 / Timer.deltaTime).toFixed(5)) / 10000;
        while (this._elapsedTime <= 0) {
            this._elapsedTime += this.updatePeriod;
            var action = this._rootReasoner.select(this._context);
            if (action != null)
                action.execute(this._context);
        }
    };
    return UtilityAI;
}());
var ActionExecutor = (function () {
    function ActionExecutor(action) {
        this._action = action;
    }
    ActionExecutor.prototype.execute = function (context) {
        this._action(context);
    };
    return ActionExecutor;
}());
var ActionWithOptions = (function () {
    function ActionWithOptions() {
        this._appraisals = new Array();
    }
    ActionWithOptions.prototype.getBestOption = function (context, options) {
        var result;
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
var CompositeAction = (function () {
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
var utility;
(function (utility) {
    var LogAction = (function () {
        function LogAction(text) {
            this._text = text;
        }
        LogAction.prototype.execute = function (context) {
            console.log(this._text);
        };
        return LogAction;
    }());
})(utility || (utility = {}));
var ReasonerAction = (function () {
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
var AllOrNothingConsideration = (function () {
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
var FixedScoreConsideration = (function () {
    function FixedScoreConsideration(score) {
        if (score === void 0) { score = 1; }
        this.score = score;
    }
    FixedScoreConsideration.prototype.getScore = function (context) {
        return this.score;
    };
    return FixedScoreConsideration;
}());
var SumOfChildrenConsideration = (function () {
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
var ThresholdConsideration = (function () {
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
var ActionAppraisal = (function () {
    function ActionAppraisal(appraisalAction) {
        this._appraisalAction = appraisalAction;
    }
    ActionAppraisal.prototype.getScore = function (context) {
        return this._appraisalAction(context);
    };
    return ActionAppraisal;
}());
var Reasoner = (function () {
    function Reasoner() {
        this.defaultConsideration = new FixedScoreConsideration();
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
var FirstScoreReasoner = (function (_super) {
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
}(Reasoner));
var HighestScoreReasoner = (function (_super) {
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
}(Reasoner));
