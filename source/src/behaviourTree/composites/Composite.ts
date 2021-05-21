module behaviourTree {
    /**
     * 任何复合节点必须子类化这个。为子节点和助手提供存储，以处理AbortTypes。
     */
    export abstract class Composite<T> extends Behavior<T>{
        public abortType: AbortTypes = AbortTypes.None;

        protected _children: Array<Behavior<T>> = new Array<Behavior<T>>();
        protected _hasLowerPriorityConditionalAbort: boolean = false;
        protected _currentChildIndex: number = 0;

        public invalidate() {
            super.invalidate();

            for (let i = 0; i < this._children.length; i++) {
                this._children[i].invalidate();
            }
        }

        public onStart() {
            // 较低优先级的中止发生在下一级，所以我们在这里检查是否有
            this._hasLowerPriorityConditionalAbort = this.hasLowerPriorityConditionalAbortInChildren();
            this._currentChildIndex = 0;
        }

        public onEnd() {
            // 我们已经做好了使我们的子节点无效的准备，使他们再下一帧做好准备 
            for (let i = 0; i < this._children.length; i++) {
                this._children[i].invalidate();
            }
        }

        /**
         * 检查复合体的子代，看是否有具有LowerPriority AbortType的复合体
         */
        private hasLowerPriorityConditionalAbortInChildren(): boolean {
            for (let i = 0; i < this._children.length; i++) {
                // 检查是否有一个设置了中止类型的复合体
                let composite = this._children[i] as Composite<T>;
                if (composite != null && AbortTypesExt.has(composite.abortType, AbortTypes.LowerPriority)) {
                    // 现在确保第一个子节点是一个条件性的
                    if (composite.isFirstChildConditional())
                        return true;
                }
            }

            return false;
        }

        /**
         * 为这个复合体添加一个子节点
         */
        public addChild(child: Behavior<T>) {
            this._children.push(child);
        }

        /**
         * 如果一个复合体的第一个子节点是一个条件体，返回true。用来处理条件性中止
         */
        public isFirstChildConditional(): boolean {
            return isIConditional(this._children[0]);
        }

        /**
         * 检查任何IConditional的子代，看它们是否已经改变了状态
         */
        protected updateSelfAbortConditional(context: T, statusCheck: TaskStatus) {
            // 检查任何IConditional的子任务，看它们是否改变了状态
            for (let i = 0; i < this._currentChildIndex; i++) {

                let child = this._children[i];
                if (!isIConditional(child))
                    continue;
                
                let status = this.updateConditionalNode(context, child);
                if (status != statusCheck) {
                    this._currentChildIndex = i;

                    // 我们有一个中止，所以我们使子节点无效，所以他们被重新评估
                    for (let j = i; j < this._children.length; j++)
                        this._children[j].invalidate();
                    break;
                }
            }
        }

        /**
         * 检查任何具有LowerPriority AbortType和Conditional作为第一个子代的组合体。
         * 如果它找到一个，它将执行条件，如果状态不等于 statusCheck，_currentChildIndex将被更新，即当前运行的Action将被中止。
         */
        protected updateLowerPriorityAbortConditional(context: T, statusCheck: TaskStatus) {
            // 检查任何较低优先级的任务，看它们是否改变了状态
            for (let i = 0; i < this._currentChildIndex; i++) {
                let composite = this._children[i] as Composite<T>;
                if (composite != null && AbortTypesExt.has(composite.abortType, AbortTypes.LowerPriority)) {
                    // 现在我们只得到条件的状态（更新而不是执行），看看它是否发生了变化，并对条件装饰器加以注意
                    let child = composite._children[0];
                    let status = this.updateConditionalNode(context, child);
                    if (status != statusCheck) {
                        this._currentChildIndex = i;

                        // 我们有一个中止，所以我们使子节点无效，所以他们被重新评估
                        for (let j = i; j < this._children.length; j++) 
                            this._children[j].invalidate();
                        
                        break;
                    }
                }
            }
        }

        /**
         * 帮助器，用于获取一个条件或一个条件装饰器的任务状态
         * @param context 
         * @param node 
         * @returns 
         */
        private updateConditionalNode(context: T, node: Behavior<T>): TaskStatus {
            if (node instanceof ConditionalDecorator)
                return (node as ConditionalDecorator<T>).executeConditional(context, true);
            else
                return node.update(context);
        }
    }
}
