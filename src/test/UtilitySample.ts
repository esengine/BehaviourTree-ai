class UtilitySample{
    public state: State = new State();

    private _ai: UtilityAI<UtilitySample>;
    private _destinationLocation: Locate;
    private _distanceToNextLocation = 10;

    public start(){
        let reasoner = new FirstScoreReasoner<UtilitySample>();

        // 睡觉最重要
        // AllOrNothingQualifier所需的阈值为1
        let fatigueConsideration = new AllOrNothingConsideration<UtilitySample>(1)
            // - 我们必须回家睡觉
            .addAppraisal(new ActionAppraisal<UtilitySample>(c => c.state.currentLocation == Locate.Home ? 1 : 0))
            // - 我们必须有疲劳值
            .addAppraisal(new ActionAppraisal<UtilitySample>(c => c.state.fatigue > 0 ? 1: 0));

        fatigueConsideration.action = new ActionExecutor<UtilitySample>(c => c.sleep());
        reasoner.addConsideration(fatigueConsideration);

        // 喝水第二重要
        let thirstConsideration = new AllOrNothingConsideration<UtilitySample>(1)
            //  - 我们必须在Saloon里喝水
            .addAppraisal(new ActionAppraisal<UtilitySample>(c => c.state.currentLocation == Locate.Saloon ? 1 : 0))
            // - 我们必须口渴
            .addAppraisal(new ActionAppraisal<UtilitySample>(c => c.state.thirst > 0 ? 1 : 0));

        thirstConsideration.action = new ActionExecutor<UtilitySample>(c => c.drink());
        reasoner.addConsideration(thirstConsideration);

        // 存钱第三重要
        let goldConsideration = new AllOrNothingConsideration<UtilitySample>(1)
            // - 我们必须在银行存钱
            .addAppraisal(new ActionAppraisal<UtilitySample>(c => c.state.currentLocation == Locate.Bank ? 1 : 0))
            // - 我们必须有黄金存款
            .addAppraisal(new ActionAppraisal<UtilitySample>(c => c.state.gold > 0 ? 1 : 0));
        
        goldConsideration.action = new ActionExecutor<UtilitySample>(c => c.depositGold());
        reasoner.addConsideration(goldConsideration);

        // 决定去哪
        // 如果AllOrNothingQualifier评分为所需的阈值0
        // Action中得分的可以对所有位置进行评分。 然后它移动到得分最高的位置。
        let moveConsideration = new AllOrNothingConsideration<UtilitySample>(0)
            // - 如果我们的最大疲劳得分
            .addAppraisal(new ActionAppraisal<UtilitySample>(c => c.state.fatigue >= State.MAX_FATIGUE ? 1 : 0))
            // - 如果我们的最大口渴得分
            .addAppraisal(new ActionAppraisal<UtilitySample>(c => c.state.thirst >= State.MAX_THIRST ? 1 : 0))
            // - 如果我们的最大金额得分
            .addAppraisal(new ActionAppraisal<UtilitySample>(c => c.state.gold >= State.MAX_GOLD ? 1 : 0))
            // - 如果我们不在矿井得分
            .addAppraisal(new ActionAppraisal<UtilitySample>(c => c.state.currentLocation != Locate.Mine ? 1 : 0));
        let moveAction = new MoveToBestLocation();
        moveAction.addScorer(new ChooseBestLocation());
        moveConsideration.action = moveAction;
        reasoner.addConsideration(moveConsideration);

        // 采矿是最后的
        let mineConsideration = new AllOrNothingConsideration<UtilitySample>(1)
            .addAppraisal(new ActionAppraisal<UtilitySample>(c => c.state.currentLocation == Locate.Mine ? 1 : 0))
            .addAppraisal(new ActionAppraisal<UtilitySample>(c => c.state.gold >= State.MAX_GOLD ? 0 : 1));
        mineConsideration.action = new ActionExecutor<UtilitySample>(c => c.digForGold());
        reasoner.addConsideration(mineConsideration);

        // 默认情况下，是前往矿山
        reasoner.defaultConsideration.action = new ActionExecutor<UtilitySample>(c => c.goToLocation(Locate.Mine));

        this._ai = new UtilityAI<UtilitySample>(this, reasoner);
    }

    public update(){
        this._ai.tick();
    }

    public sleep(){
        console.log(`开始睡觉. 当前疲劳值 ${this.state.fatigue}`);
        this.state.fatigue--;
    }

    public drink(){
        console.log(`开始喝水. 当前口渴值 ${this.state.thirst}`);
        this.state.thirst--;
    }

    public depositGold(){
        this.state.goldInBank += this.state.gold;
        this.state.gold = 0;

        console.log(`将钱存入银行, 当前存款 ${this.state.goldInBank}`);
    }

    public goToLocation(location: Locate){
        if (location == this.state.currentLocation)
            return;

        if (this.state.currentLocation == Locate.InTransit && location == this._destinationLocation){
            console.log(`移动至 ${location}. 距离 ${this._distanceToNextLocation} 米`);
            this._distanceToNextLocation --;
            if (this._distanceToNextLocation == 0){
                this.state.fatigue++;
                this.state.currentLocation = this._destinationLocation;
                this._destinationLocation = Math.floor(Random.range(2, 8));
            }
        } else{
            this.state.currentLocation = Locate.InTransit;
            this._destinationLocation = location;
            this._distanceToNextLocation = Math.floor(Random.range(2, 8));
        }
    }

    public digForGold(){
        console.log(`准备采矿, 获的黄金 ${this.state.gold}`);
        this.state.gold ++;
        this.state.fatigue ++;
        this.state.thirst ++;
    }
}