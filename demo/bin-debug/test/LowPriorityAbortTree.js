var __reflect = (this && this.__reflect) || function (p, c, t) {
    p.__class__ = c, t ? t.push(c) : t = [c], p.__types__ = p.__types__ ? t.concat(p.__types__) : t;
};
var LowerPriorityAbortTree = (function () {
    function LowerPriorityAbortTree() {
        this.state = new State();
        this._distanceToNextLocation = 10;
    }
    LowerPriorityAbortTree.prototype.update = function () {
        if (this._tree)
            this._tree.tick();
    };
    LowerPriorityAbortTree.prototype.start = function () {
        var builder = BehaviorTreeBuilder.begin(this);
        builder.selector();
        // 睡觉最重要
        builder.sequence(AbortTypes.LowerPriority)
            .conditionalR(function (m) { return m.state.fatigue >= State.MAX_FATIGUE; })
            .logAction("-- 累了,准备回家")
            .action(function (m) { return m.goToLocation(Locate.Home); })
            .logAction("-- 准备上床")
            .action(function (m) { return m.sleep(); })
            .endComposite();
        // 喝水第二重要
        builder.sequence(AbortTypes.LowerPriority)
            .conditionalR(function (m) { return m.state.thirst >= State.MAX_THIRST; })
            .logAction("-- 渴了! 准备喝水")
            .action(function (m) { return m.goToLocation(Locate.Saloon); })
            .logAction("-- 开始喝水")
            .action(function (m) { return m.drink(); })
            .endComposite();
        // 存钱第三重要
        builder.sequence(AbortTypes.LowerPriority)
            .conditionalR(function (m) { return m.state.gold >= State.MAX_GOLD; })
            .logAction("--- 背包满了，准备去银行存钱.")
            .action(function (m) { return m.goToLocation(Locate.Bank); })
            .logAction("--- 开始存钱!")
            .action(function (m) { return m.depositGold(); })
            .endComposite();
        // 赚钱最后
        builder.sequence()
            .action(function (m) { return m.goToLocation(Locate.Mine); })
            .logAction("-- 开始挖矿！")
            .action(function (m) { return m.digForGold(); })
            .endComposite();
        builder.endComposite();
        this._tree = builder.build();
    };
    LowerPriorityAbortTree.prototype.digForGold = function () {
        console.log("\u5F00\u59CB\u91D1\u5E01\u589E\u52A0: " + this.state.gold + ".");
        this.state.gold++;
        this.state.fatigue++;
        this.state.thirst++;
        if (this.state.gold >= State.MAX_GOLD)
            return TaskStatus.Failure;
        return TaskStatus.Running;
    };
    LowerPriorityAbortTree.prototype.drink = function () {
        console.log("\u5F00\u59CB\u559D\u6C34, \u53E3\u6E34\u7A0B\u5EA6: " + this.state.thirst);
        if (this.state.thirst == 0)
            return TaskStatus.Success;
        this.state.thirst--;
        return TaskStatus.Running;
    };
    LowerPriorityAbortTree.prototype.sleep = function () {
        console.log("\u5F00\u59CB\u7761\u89C9, \u5F53\u524D\u75B2\u60EB\u503C: " + this.state.fatigue);
        if (this.state.fatigue == 0)
            return TaskStatus.Success;
        this.state.fatigue--;
        return TaskStatus.Running;
    };
    LowerPriorityAbortTree.prototype.goToLocation = function (location) {
        console.log("\u524D\u5F80\u76EE\u7684\u5730: " + location + ". \u8DDD\u79BB: " + this._distanceToNextLocation);
        if (location != this.state.currentLocation) {
            this._distanceToNextLocation--;
            if (this._distanceToNextLocation == 0) {
                this.state.fatigue++;
                this.state.currentLocation = location;
                this._distanceToNextLocation = Math.floor(Random.range(2, 8));
                return TaskStatus.Success;
            }
            return TaskStatus.Running;
        }
        return TaskStatus.Success;
    };
    LowerPriorityAbortTree.prototype.depositGold = function () {
        this.state.goldInBank += this.state.gold;
        this.state.gold = 0;
        console.log("\u5B58\u94B1\u8FDB\u5165\u94F6\u884C. \u5F53\u524D\u5B58\u6B3E " + this.state.goldInBank);
        return TaskStatus.Success;
    };
    return LowerPriorityAbortTree;
}());
__reflect(LowerPriorityAbortTree.prototype, "LowerPriorityAbortTree");
//# sourceMappingURL=LowPriorityAbortTree.js.map