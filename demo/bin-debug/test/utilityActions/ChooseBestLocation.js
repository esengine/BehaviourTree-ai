var __reflect = (this && this.__reflect) || function (p, c, t) {
    p.__class__ = c, t ? t.push(c) : t = [c], p.__types__ = p.__types__ ? t.concat(p.__types__) : t;
};
var ChooseBestLocation = (function () {
    function ChooseBestLocation() {
    }
    /**
     * 行动评估将对提供最高分的位置进行评分，以便访问最佳位置
     */
    ChooseBestLocation.prototype.getScore = function (context, option) {
        if (option == Locate.Home)
            return context.state.fatigue >= State.MAX_FATIGUE ? 20 : 0;
        if (option == Locate.Saloon)
            return context.state.thirst >= State.MAX_THIRST ? 15 : 0;
        if (option == Locate.Bank) {
            if (context.state.gold >= State.MAX_GOLD)
                return 10;
            // 如果我们不在矿山，并且我们身上有足够的黄金，则先将其放入银行
            if (context.state.currentLocation != Locate.Mine) {
                // 将我们当前的黄金价值标准化为0-1
                var gold = Mathf.map01(context.state.gold, 0, State.MAX_GOLD);
                var score = Math.pow(gold, 2);
                return score * 10;
            }
            return 0;
        }
        return 5;
    };
    return ChooseBestLocation;
}());
__reflect(ChooseBestLocation.prototype, "ChooseBestLocation", ["IActionOptionAppraisal"]);
//# sourceMappingURL=ChooseBestLocation.js.map