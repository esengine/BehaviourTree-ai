class RandomProbability<T> extends Behavior<T> implements IConditional<T>{
    private _successProbability: number;

    public constructor(successProbability: number){
        super();

        this._successProbability = successProbability;
    }

    public update(context: T): TaskStatus{
        if (Math.random() > this._successProbability)
            return TaskStatus.Success;

        return TaskStatus.Failure;
    }
}