var __reflect = (this && this.__reflect) || function (p, c, t) {
    p.__class__ = c, t ? t.push(c) : t = [c], p.__types__ = p.__types__ ? t.concat(p.__types__) : t;
};
var UtilitySample = (function () {
    function UtilitySample() {
        this.state = new State();
        this._distanceToNextLocation = 10;
    }
    UtilitySample.prototype.start = function () {
        var reasoner = new FirstScoreReasoner();
        // 睡觉最重要
        // AllOrNothingQualifier所需的阈值为1
        var fatigueConsideration = new AllOrNothingConsideration(1)
            .addAppraisal(new ActionAppraisal(function (c) { return c.state.currentLocation == Locate.Home ? 1 : 0; }))
            .addAppraisal(new ActionAppraisal(function (c) { return c.state.fatigue > 0 ? 1 : 0; }));
        fatigueConsideration.action = new ActionExecutor(function (c) { return c.sleep(); });
        reasoner.addConsideration(fatigueConsideration);
        // 喝水第二重要
        var thirstConsideration = new AllOrNothingConsideration(1)
            .addAppraisal(new ActionAppraisal(function (c) { return c.state.currentLocation == Locate.Saloon ? 1 : 0; }))
            .addAppraisal(new ActionAppraisal(function (c) { return c.state.thirst > 0 ? 1 : 0; }));
        thirstConsideration.action = new ActionExecutor(function (c) { return c.drink(); });
        reasoner.addConsideration(thirstConsideration);
        // 存钱第三重要
        var goldConsideration = new AllOrNothingConsideration(1)
            .addAppraisal(new ActionAppraisal(function (c) { return c.state.currentLocation == Locate.Bank ? 1 : 0; }))
            .addAppraisal(new ActionAppraisal(function (c) { return c.state.gold > 0 ? 1 : 0; }));
        goldConsideration.action = new ActionExecutor(function (c) { return c.depositGold(); });
        reasoner.addConsideration(goldConsideration);
        // 决定去哪
        // 如果AllOrNothingQualifier评分为所需的阈值0
        // Action中得分的可以对所有位置进行评分。 然后它移动到得分最高的位置。
        var moveConsideration = new AllOrNothingConsideration(0)
            .addAppraisal(new ActionAppraisal(function (c) { return c.state.fatigue >= State.MAX_FATIGUE ? 1 : 0; }))
            .addAppraisal(new ActionAppraisal(function (c) { return c.state.thirst >= State.MAX_THIRST ? 1 : 0; }))
            .addAppraisal(new ActionAppraisal(function (c) { return c.state.gold >= State.MAX_GOLD ? 1 : 0; }))
            .addAppraisal(new ActionAppraisal(function (c) { return c.state.currentLocation != Locate.Mine ? 1 : 0; }));
        var moveAction = new MoveToBestLocation();
        moveAction.addScorer(new ChooseBestLocation());
        moveConsideration.action = moveAction;
        reasoner.addConsideration(moveConsideration);
        // 采矿是最后的
        var mineConsideration = new AllOrNothingConsideration(1)
            .addAppraisal(new ActionAppraisal(function (c) { return c.state.currentLocation == Locate.Mine ? 1 : 0; }))
            .addAppraisal(new ActionAppraisal(function (c) { return c.state.gold >= State.MAX_GOLD ? 0 : 1; }));
        mineConsideration.action = new ActionExecutor(function (c) { return c.digForGold(); });
        reasoner.addConsideration(mineConsideration);
        // 默认情况下，是前往矿山
        reasoner.defaultConsideration.action = new ActionExecutor(function (c) { return c.goToLocation(Locate.Mine); });
        this._ai = new UtilityAI(this, reasoner);
    };
    UtilitySample.prototype.update = function () {
        this._ai.tick();
    };
    UtilitySample.prototype.sleep = function () {
        console.log("\u5F00\u59CB\u7761\u89C9. \u5F53\u524D\u75B2\u52B3\u503C " + this.state.fatigue);
        this.state.fatigue--;
    };
    UtilitySample.prototype.drink = function () {
        console.log("\u5F00\u59CB\u559D\u6C34. \u5F53\u524D\u53E3\u6E34\u503C " + this.state.thirst);
        this.state.thirst--;
    };
    UtilitySample.prototype.depositGold = function () {
        this.state.goldInBank += this.state.gold;
        this.state.gold = 0;
        console.log("\u5C06\u94B1\u5B58\u5165\u94F6\u884C, \u5F53\u524D\u5B58\u6B3E " + this.state.goldInBank);
    };
    UtilitySample.prototype.goToLocation = function (location) {
        if (location == this.state.currentLocation)
            return;
        if (this.state.currentLocation == Locate.InTransit && location == this._destinationLocation) {
            console.log("\u79FB\u52A8\u81F3 " + location + ". \u8DDD\u79BB " + this._distanceToNextLocation + " \u7C73");
            this._distanceToNextLocation--;
            if (this._distanceToNextLocation == 0) {
                this.state.fatigue++;
                this.state.currentLocation = this._destinationLocation;
                this._destinationLocation = Math.floor(Random.range(2, 8));
            }
        }
        else {
            this.state.currentLocation = Locate.InTransit;
            this._destinationLocation = location;
            this._distanceToNextLocation = Math.floor(Random.range(2, 8));
        }
    };
    UtilitySample.prototype.digForGold = function () {
        console.log("\u51C6\u5907\u91C7\u77FF, \u83B7\u7684\u9EC4\u91D1 " + this.state.gold);
        this.state.gold++;
        this.state.fatigue++;
        this.state.thirst++;
    };
    return UtilitySample;
}());
__reflect(UtilitySample.prototype, "UtilitySample");
//# sourceMappingURL=UtilitySample.js.map