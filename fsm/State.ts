import { StateMachine } from './StateMachine.js';

export abstract class State<T> {
    protected _machine!: StateMachine<T>;
    protected _context!: T;

    public setMachineAndContext(machine: StateMachine<T>, context: T): void {
        this._machine = machine;
        this._context = context;
        this.onInitialized();
    }

    /**
     * 在设置machine和context之后直接调用，允许状态执行任何所需的设置
     *
     * @memberof State
     */
    public onInitialized(): void {}

    /**
     * 当状态变为活动状态时调用
     *
     * @memberof State
     */
    public begin(): void {}

    /**
     * 在更新之前调用，允许状态最后一次机会改变状态
     *
     * @memberof State
     */
    public reason(): void {}

    /**
     * 每个帧调用此状态为活动状态
     *
     * @abstract
     * @param {number} deltaTime
     * @memberof State
     */
    public abstract update(deltaTime: number): void;

    /**
     * 此状态不再是活动状态时调用
     *
     * @memberof State
     */
    public end(): void {}
}
