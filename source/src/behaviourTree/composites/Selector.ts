module behaviourTree {
    /**
     * 选择器任务类似于一个 "或 "操作。只要它的一个子任务返回成功，它就会返回成功。
     * 如果一个子任务返回失败，那么它将依次运行下一个任务。
     * 如果没有子任务返回成功，那么它将返回失败
     */
    export class Selector<T> extends Composite<T>{
        constructor(abortType: AbortTypes = AbortTypes.None) {
            super();

            this.abortType = abortType;
        }

        public update(context: T): TaskStatus {
            // 首先，如果我们不在第一个子节点身上，我们就处理条件性中止
            if (this._currentChildIndex != 0)
                this.handleConditionalAborts(context);

            let current = this._children[this._currentChildIndex];
            let status = current.tick(context);

            // 如果子节点成功了或者还在跑，就提前返回
            if (status != TaskStatus.Failure)
                return status;

            this._currentChildIndex++;

            // 如果子节点再最后一个，这意味着整个事情失败了
            if (this._currentChildIndex == this._children.length) {
                // 重置索引，否则下次运行时会崩溃
                this._currentChildIndex = 0;
                return TaskStatus.Failure;
            }

            return TaskStatus.Running;
        }

        private handleConditionalAborts(context: T) {
            // 检查任何较低优先级的任务，看它们是否改变为成功
            if (this._hasLowerPriorityConditionalAbort)
                this.updateLowerPriorityAbortConditional(context, TaskStatus.Failure);

            if (AbortTypesExt.has(this.abortType, AbortTypes.Self))
                this.updateSelfAbortConditional(context, TaskStatus.Failure);
        }
    }
}
