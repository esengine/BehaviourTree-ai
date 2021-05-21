module behaviourTree {
    /**
     * 将重复执行其子任务，直到子任务被运行了指定的次数。
     * 即使子任务返回失败，它也可以选择继续执行子任务
     */
    export class Repeater<T> extends Decorator<T>{
        /** 重复执行其子任务的次数 */
        public count: number;
        /** 是否永远重复 */
        public repeatForever: boolean = false;
        /** 如果子任务返回失败，该任务是否应该返回 */
        public endOnFailure: boolean;
    
        private _iterationCount: number = 0;
    
        public constructor(count: number, endOnFailure: boolean = false){
            super();
    
            this.count = count;
            this.endOnFailure = endOnFailure;
        }
    
        public onStart(){
            this._iterationCount = 0;
        }
    
        public update(context: T): TaskStatus{
            Assert.isNotNull(this.child, "child必须不能为空");
    
            // 我们在这里和运行后检查，以防计数为0
            if (!this.repeatForever && this._iterationCount == this.count)
                return TaskStatus.Success;
    
            let status = this.child.tick(context);
            this._iterationCount++;
    
            if (this.endOnFailure && status == TaskStatus.Failure)
                return TaskStatus.Success;
    
            if (!this.repeatForever && this._iterationCount == this.count)
                return TaskStatus.Success;
    
            return TaskStatus.Running;
        }
    }
}
