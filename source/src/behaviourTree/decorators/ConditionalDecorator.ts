///<reference path="./Decorator.ts"/>
/**
 * 装饰器只有在满足条件时才会运行其子节点。 
 * 默认情况下，每次打勾都会重新评估条件。
 */
class ConditionalDecorator<T> extends Decorator<T> implements IConditional<T> {
    private _conditional: IConditional<T>;
    private _shouldReevaluate: boolean;
    private _conditionalStatus: TaskStatus;

    constructor(conditional: IConditional<T>, shouldReevalute: boolean = true){
        super();

        Assert.isTrue( egret.is(conditional, "IConditional"), "conditional 必须继承 IConditional" );
        this._conditional = conditional;
        this._shouldReevaluate = shouldReevalute;
    }

    public invalidate(){
        super.invalidate();
        this._conditionalStatus = TaskStatus.Invalid;
    }

    public onStart(){
        this._conditionalStatus = TaskStatus.Invalid;
    }

    public update(context: T): TaskStatus{
        Assert.isNotNull(this.child, "child不能为空");

        this._conditionalStatus = this.executeConditional(context);

        if (this._conditionalStatus == TaskStatus.Success)
            return this.child.tick(context);

        return TaskStatus.Failure;
    }

    /**
     * 在shouldReevaluate标志之后执行条件，或者使用强制更新的选项执行条件。 
     * 如果条件更改，中止将强制更新以确保它们获得正确的数据。
     */
    public executeConditional(context: T, forceUpdate: boolean = false): TaskStatus{
        if (forceUpdate || this._shouldReevaluate || this._conditionalStatus == TaskStatus.Invalid)
            this._conditionalStatus = this._conditional.update(context);

        return this._conditionalStatus;
    }
}