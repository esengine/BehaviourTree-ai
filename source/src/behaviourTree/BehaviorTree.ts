/**
 * 用于控制行为树的根类。处理存储上下文
 */
class BehaviorTree<T>{
    /**
     * 行为树应该多久更新一次。
     * 更新周期为0.2将使树每秒更新5次。
     */
    public updatePeriod: number;
    public stepUpdateCounter: number = 0;
    /**
     * 上下文应包含运行树所需的所有数据
     */
    private _context: T;
    /**
     * 树的根节点
     */
    private _root: Behavior<T>;
    private _elapsedTime: number;

    constructor(context: T, rootNode: Behavior<T>, updatePeriod: number = 0.2){
        this._context = context;
        this._root = rootNode;

        this.updatePeriod = this._elapsedTime = updatePeriod;
    }

    public tick(){
        this.stepUpdateCounter += es.Time.deltaTime;
        /**
         * 小于或等于0的updatePeriod将标记每一帧
         */
        if (this.updatePeriod > 0){
            if (this.stepUpdateCounter >= this.updatePeriod){
                this._root.tick(this._context);
                this.stepUpdateCounter -= this.updatePeriod;
            }
        }
        else{
            this._root.tick(this._context);
        }
    }
}