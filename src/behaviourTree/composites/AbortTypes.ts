enum AbortTypes{
    /**
     * 没有中止类型。 
     * 即使其他条件改变状态，当前操作也将始终运行
     */
    None,
    /**
     * 如果更重要的条件任务更改状态，则可以发出中止，以阻止低优先级任务运行并将控制权移回更高优先级的分支。 
     * 应在 Composites 上设置此类型，Composites 是评估 Composites 的子项。 
     * 父Composite将检查它的子节点以查看它们是否具有优先级较低的中止。
     */
    LowerPriority,
    /**
     * 条件任务只有在它们都是Composite的子项时才能中止Action任务。 
     * 与不影响其父复合的LowerPriority不同，此AbortType仅影响它所设置的实际Composite。
     */
    Self,
    /**
     * 检查LowerPriority和Self aborts
     */
    Both = Self | LowerPriority
}

class AbortTypesExt{
    public static has(self: AbortTypes, check: AbortTypes){
        return ( self & check ) == check;
    }
}