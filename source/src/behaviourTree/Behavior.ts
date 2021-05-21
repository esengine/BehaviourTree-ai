module behaviourTree {
    /**
     * 所有节点的根类
     */
    export abstract class Behavior<T>{
        public status: TaskStatus = TaskStatus.Invalid;

        public abstract update(context:T) : TaskStatus;

        /**
         * 使该节点的状态无效。
         * 组合体可以覆盖这一点并使其所有的子节点失效
         */
        public invalidate(){
            this.status = TaskStatus.Invalid;
        }

        /**
         * 在执行前立即调用。
         * 它被用来设置任何需要从上一次运行中重置的变量
         */
        public onStart(){}

        /**
         * 当一个任务的状态改变为运行以外的其他状态时被调用
         */
        public onEnd(){}

        /**
         * tick处理调用，以更新实际工作完成的地方。
         * 它的存在是为了在必要时可以调用onStart/onEnd。
         * @param context 
         * @returns 
         */
        public tick(context: T): TaskStatus{
            if (this.status == TaskStatus.Invalid)
                this.onStart();

            this.status = this.update(context);

            if (this.status != TaskStatus.Running)
                this.onEnd();

            return this.status;
        }
    }
}
