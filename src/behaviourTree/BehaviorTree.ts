class BehaviorTree<T>{
    public updatePeriod: number;
    private _context: T;
    private _root: Behavior<T>;
    private _elapsedTime: number;

    constructor(context: T, rootNode: Behavior<T>, updatePeriod: number = 0.2){
        this._context = context;
        this._root = rootNode;

        this.updatePeriod = this._elapsedTime = updatePeriod;
    }

    public tick(){
        if (this.updatePeriod > 0){
            // this._elapsedTime -= Number((1000 / Timer.deltaTime).toFixed(5));
            this._elapsedTime -= Timer.deltaTime;
            if (this._elapsedTime <= 0){
                while (this._elapsedTime <= 0)
                    this._elapsedTime += this.updatePeriod;

                this._root.tick(this._context);
            }
        }
        else{
            this._root.tick(this._context);
        }
    }
}