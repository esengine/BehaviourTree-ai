export enum AbortTypes {
    /**
     * 没有中止类型。即使其他条件更改了状态，当前操作也将始终运行 
     */
    None = 0,
    /**
     * 如果一个更重要的有条件的任务改变了状态，它可以发出一个中止指令，使低优先级的任务停止运行，并将控制权转回高优先级的分支。
     * 这种类型应该被设置在作为讨论中的复合体的子体的复合体上。
     * 父复合体将检查它的子体，看它们是否有LowerPriority中止。
     */
    LowerPriority = 1,
    /**
     * 只有当它们都是复合体的子任务时，条件任务才能中止一个行动任务。
     * 这个AbortType只影响它所设置的实际的Composite，不像LowerPriority会影响其父Composite。
     */
    Self = 2,
    /**
     * 检查LowerPriority和Self aborts
     */
    Both = Self | LowerPriority
}

export class AbortTypesExt {
    public static has(self: AbortTypes, check: AbortTypes): boolean {
        return (self & check) == check;
    }
}

