var __reflect = (this && this.__reflect) || function (p, c, t) {
    p.__class__ = c, t ? t.push(c) : t = [c], p.__types__ = p.__types__ ? t.concat(p.__types__) : t;
};
var __extends = this && this.__extends || function __extends(t, e) { 
 function r() { 
 this.constructor = t;
}
for (var i in e) e.hasOwnProperty(i) && (t[i] = e[i]);
r.prototype = e.prototype, t.prototype = new r();
};
var MoveToBestLocation = (function (_super) {
    __extends(MoveToBestLocation, _super);
    function MoveToBestLocation() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._locations = [
            Locate.Bank,
            Locate.Home,
            Locate.Mine,
            Locate.Saloon
        ];
        return _this;
    }
    MoveToBestLocation.prototype.execute = function (context) {
        var location = this.getBestOption(context, this._locations);
        context.goToLocation(location);
    };
    return MoveToBestLocation;
}(ActionWithOptions));
__reflect(MoveToBestLocation.prototype, "MoveToBestLocation");
//# sourceMappingURL=MoveToBestLocation.js.map