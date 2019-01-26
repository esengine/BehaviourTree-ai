class SelfAbortTree{
    private _tree: BehaviorTree<SelfAbortTree>;
    public state: State = new State();
    private _distanceToNextLocation: number = 10;
    public update(){
        if (this._tree)
            this._tree.tick();
    }

    public start(){
        let builder = BehaviorTreeBuilder.begin(this);

        builder.selector(AbortTypes.Self);

        // 睡觉最重要
        builder.conditionalDecoratorR(m => m.state.fatigue >= State.MAX_FATIGUE, false);
        builder.sequence(AbortTypes.LowerPriority)
            .logAction("-- 累了,准备回家")
            .actionR(m => m.goToLocation(Locate.Home))
            .logAction("-- 准备上床")
            .actionR(m => m.sleep())
            .endComposite();

        // 喝水第二重要
        builder.conditionalDecoratorR(m => m.state.thirst >= State.MAX_THIRST, false);
        builder.sequence(AbortTypes.LowerPriority)
            .logAction("-- 渴了! 准备喝水")
            .actionR(m => m.goToLocation(Locate.Saloon))
            .logAction("-- 开始喝水")
            .actionR(m => m.drink())
            .endComposite();

        // 存钱第三重要
        builder.conditionalDecoratorR(m => m.state.gold >= State.MAX_GOLD, false);
        builder.sequence(AbortTypes.LowerPriority)
            .logAction( "--- 背包满了，准备去银行存钱." )
            .actionR( m => m.goToLocation( Locate.Bank ) )
            .logAction( "--- 开始存钱!" )
            .actionR( m => m.depositGold() )
            .endComposite();

        // 赚钱最后
        builder.sequence()
            .actionR(m => m.goToLocation(Locate.Mine))
            .logAction("-- 开始挖矿！")
            .actionR(m => m.digForGold())
            .endComposite();

        builder.endComposite();

        this._tree = builder.build();
    }

    private digForGold(): TaskStatus{
        console.log(`开始金币增加: ${this.state.gold}.`);
        this.state.gold++;
        this.state.fatigue++;
        this.state.thirst++;

        if( this.state.gold >= State.MAX_GOLD )
            return TaskStatus.Failure;

        return TaskStatus.Running;
    }

    private drink(): TaskStatus{
        console.log(`开始喝水, 口渴程度: ${this.state.thirst}`);

        if( this.state.thirst == 0 )
            return TaskStatus.Success;

        this.state.thirst--;
        return TaskStatus.Running;
    }

    private sleep(): TaskStatus{
        console.log(`开始睡觉, 当前疲惫值: ${this.state.fatigue}`);

        if (this.state.fatigue == 0)
            return TaskStatus.Success;
        
        this.state.fatigue--;
        return TaskStatus.Running;
    }

    private goToLocation(location: Locate): TaskStatus{
        console.log(`前往目的地: ${location}. 距离: ${this._distanceToNextLocation}`);

        if (location != this.state.currentLocation){
            this._distanceToNextLocation--; 
            if (this._distanceToNextLocation == 0){
                this.state.fatigue ++;
                this.state.currentLocation = location;
                this._distanceToNextLocation = Math.floor(Random.range(2, 8));
                return TaskStatus.Success;
            }

            return TaskStatus.Running;
        }

        return TaskStatus.Success;
    }

    private depositGold(): TaskStatus{
        this.state.goldInBank += this.state.gold;
        this.state.gold = 0;

        console.log(`存钱进入银行. 当前存款 ${this.state.goldInBank}`);

        return TaskStatus.Success;
    }
}