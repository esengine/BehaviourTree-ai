/**
 * 行为树节点的执行状态枚举
 * 
 * @description 定义了行为树中每个节点可能的执行状态
 */
export enum TaskStatus {
    /** 
     * 无效状态 - 节点尚未执行或已被重置
     */
    Invalid,
    
    /** 
     * 成功状态 - 节点执行完成且成功
     */
    Success,
    
    /** 
     * 失败状态 - 节点执行完成但失败
     */
    Failure,
    
    /** 
     * 运行中状态 - 节点正在执行，需要在下一帧继续
     */
    Running
}
