class MoveToBestLocation extends ActionWithOptions<UtilitySample, Locate>{
    private _locations: Array<Locate> = [
        Locate.Bank,
        Locate.Home,
        Locate.Mine,
        Locate.Saloon
    ];

    public execute(context: UtilitySample){
        let location = this.getBestOption(context, this._locations);

        context.goToLocation(location);
    }
}