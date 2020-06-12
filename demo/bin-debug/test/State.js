var __reflect = (this && this.__reflect) || function (p, c, t) {
    p.__class__ = c, t ? t.push(c) : t = [c], p.__types__ = p.__types__ ? t.concat(p.__types__) : t;
};
var State = (function () {
    function State() {
        this.fatigue = 0;
        this.thirst = 0;
        this.gold = 0;
        this.goldInBank = 0;
        this.currentLocation = Locate.Home;
    }
    State.MAX_FATIGUE = 10;
    State.MAX_GOLD = 8;
    State.MAX_THIRST = 5;
    return State;
}());
__reflect(State.prototype, "State");
var Locate;
(function (Locate) {
    Locate[Locate["Home"] = 0] = "Home";
    Locate[Locate["InTransit"] = 1] = "InTransit";
    Locate[Locate["Mine"] = 2] = "Mine";
    Locate[Locate["Saloon"] = 3] = "Saloon";
    Locate[Locate["Bank"] = 4] = "Bank";
})(Locate || (Locate = {}));
//# sourceMappingURL=State.js.map