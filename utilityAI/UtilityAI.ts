import { Reasoner } from './reasoners/Reasoner';

export class UtilityAI<T> {
    /**
     * 行为树应该多久更新一次。 updatePeriod为0.2将使树每秒更新5次
     */
    public updatePeriod: number;

    private _context: T;
    private _rootReasoner: Reasoner<T>;
    private _elapsedTime: number;

    public constructor(context: T, rootSelector: Reasoner<T>, updatePeriod: number = 0.2) {
        this._rootReasoner = rootSelector;
        this._context = context;
        this.updatePeriod = this._elapsedTime = updatePeriod;
    }

    public tick(deltaTime: number): void {
        this._elapsedTime -= deltaTime;
        while (this._elapsedTime <= 0) {
            this._elapsedTime += this.updatePeriod;
            let action = this._rootReasoner.select(this._context);
            if (action != null)
                action.execute(this._context);
        }
    }
}
