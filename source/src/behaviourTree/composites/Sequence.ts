module behaviourTree {
    /**
     * 序列任务类似于一个 "和 "的操作。只要它的一个子任务返回失败，它就会返回失败。
     * 如果一个子任务返回成功，那么它将依次运行下一个任务。
     * 如果所有子任务都返回成功，那么它将返回成功。
     */
    export class Sequence<T> extends Composite<T>{
        public constructor(abortType: AbortTypes = AbortTypes.None){
            super();

            this.abortType = abortType;
        }

        public update(context: T): TaskStatus{
            // 首先，如果我们还没有在第一个子节点身上，我们将处理有条件的中止
            if (this._currentChildIndex != 0){
                this.handleConditionalAborts(context);
            }

            let current = this._children[this._currentChildIndex];
            let status = current.tick(context);

            // 如果子节点失败或仍在运行，提前返回
            if (status != TaskStatus.Success)
                return status;

            this._currentChildIndex ++;

            // 如果到子节点最后一个，整个序列就成功了
            if (this._currentChildIndex == this._children.length){
                // 为下一次运行重置索引
                this._currentChildIndex = 0;
                return TaskStatus.Success;
            }

            return TaskStatus.Running;
        }

        private handleConditionalAborts(context: T){
            if (this._hasLowerPriorityConditionalAbort)
                this.updateLowerPriorityAbortConditional(context, TaskStatus.Success);

            if (AbortTypesExt.has(this.abortType, AbortTypes.Self))
                this.updateSelfAbortConditional(context, TaskStatus.Success);
        }
    }
}
