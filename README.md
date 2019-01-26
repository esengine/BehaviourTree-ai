# egret-BehaviourTree
基于Egret开发的行为树（BehaviourTree）系统，一套已经非常完整的系统。大家可以自行看源代码来学习，项目当中也有一个示例，如果你对行为树也有更为深刻的理解可发起`pull request`请求或者提出`issue`。

## 目录结构

- src `源目录`
  - behaviourTree   `行为树主目录`
    - actions
    - composites
    - conditionals
    - decorators
  - core    `egret核心扩展`
  - test    `示例工程`

## 游戏实例

![](sceenshot/sample.png)

## 使用文档

```typescript
class AiComponent{
    private _tree: BehaviorTree<AiComponent>;
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
```

```typescript
class State{
    public static MAX_FATIGUE: number = 10;
    public static MAX_GOLD = 8;
    public static MAX_THIRST = 5;

    public fatigue: number = 0;
    public thirst: number = 0;
    public gold: number = 0;
    public goldInBank: number = 0;
    public currentLocation: Locate = Locate.Home;
}

enum Locate{
    Home,
    InTransit,
    Mine,
    Saloon,
    Bank
}
```

这两个文件是主要行为树文件。最后只需要在主文件当中进行实例化 `AiComponent`. 

```typescript
this.aiComponent = new AiComponent();
this.aiComponent.start();
```

并且对egret当中`egret.Event.ENTER_FRAME`进行监听。让行为树系统进行每帧更新

```typescript
this.aiComponent.update();
```

## 关于示例的使用

只需要留下一个`egret.Event.ENTER_FRAME`下其中一个`update`。

```typescript
// this.selfAbortTreeSample.update();
this.lowerPriorityAbortTreeSample.update();
```

> 只需要留下一个行为树例子。

## 功能实现

- [x] 行为树
- [ ] 实用AI
- 简单的状态机
- 路径寻找
  - AStar
  - BreadthFirst
  - Dijkstra
- GOAP

## 关于此项目

该项目由我的另一个项目 `CLEngine` 所提取出来的一个部分功能。如果你对该项目感兴趣，可以`Fork`该项目，另外请顺手`Star`一下该项目吧，后续还会更多对该项目的扩展。
