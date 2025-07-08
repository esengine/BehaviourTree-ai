import { Decorator } from './Decorator';
import { TaskStatus } from '../TaskStatus';
import { IConditional, isIConditional } from '../conditionals/IConditional';
import { AbortTypes } from '../composites/AbortTypes';

/**
 * 装饰器，只有在满足条件的情况下才会运行其子程序。
 * 默认情况下，该条件将在每一次执行中被重新评估
 */
export class ConditionalDecorator<T> extends Decorator<T> implements IConditional<T> {
    public readonly discriminator: "IConditional" = "IConditional";
    
    /** 中止类型，决定节点在何种情况下会被中止 */
    public abortType: AbortTypes = AbortTypes.None;
    
    private _conditional: IConditional<T>;
    private _shouldReevaluate: boolean;
    private _conditionalStatus: TaskStatus = TaskStatus.Invalid;

    constructor(conditional: IConditional<T>, shouldReevalute: boolean = true, abortType: AbortTypes = AbortTypes.None) {
        super();

        if (!isIConditional(conditional)) {
            throw new Error("conditional 必须继承 IConditional");
        }
        this._conditional = conditional;
        this._shouldReevaluate = shouldReevalute;
        this.abortType = abortType;
    }

    public override invalidate() {
        super.invalidate();
        this._conditionalStatus = TaskStatus.Invalid;
    }

    public override onStart() {
        this._conditionalStatus = TaskStatus.Invalid;
    }

    public update(context: T): TaskStatus {
        if (!this.child) {
            throw new Error("child不能为空");
        }

        // 如果子节点正在运行且shouldReevaluate为false，直接继续执行子节点
        if (!this._shouldReevaluate && this.child.status === TaskStatus.Running) {
            return this.child.tick(context);
        }

        // 否则正常评估条件
        this._conditionalStatus = this.executeConditional(context);

        if (this._conditionalStatus == TaskStatus.Success) {
            const childStatus = this.child.tick(context);
            return childStatus;
        }
        return TaskStatus.Failure;
    }

    /**
     * 在shouldReevaluate标志之后执行条件，或者用一个选项来强制更新。
     * 终止将强制更新，以确保他们在条件变化时得到适当的数据。
     */
    public executeConditional(context: T, forceUpdate: boolean = false): TaskStatus {
        if (forceUpdate || this._shouldReevaluate || this._conditionalStatus == TaskStatus.Invalid)
            this._conditionalStatus = this._conditional.update(context);

        return this._conditionalStatus;
    }


}
