import { Behavior } from '../Behavior';
import { TaskStatus } from '../TaskStatus';
import { Blackboard, BlackboardValueType } from '../Blackboard';

/**
 * 设置黑板变量值
 * 
 * @description 将指定值或另一个黑板变量的值设置到目标变量
 * 
 * @example
 * ```typescript
 * // 设置固定值
 * const setHealth = new SetBlackboardValue<GameContext>('playerHealth', 100);
 * 
 * // 从另一个变量复制值
 * const copyValue = new SetBlackboardValue<GameContext>('targetHealth', null, 'playerHealth');
 * ```
 */
export class SetBlackboardValue<T> extends Behavior<T> {
    /** 目标变量名 */
    public variableName: string;
    
    /** 要设置的值（与sourceVariable二选一） */
    public value: any;
    
    /** 源变量名（与value二选一） */
    public sourceVariable?: string;
    
    /** 是否强制设置（忽略只读限制） */
    public force: boolean;

    constructor(
        variableName: string, 
        value: any = null, 
        sourceVariable?: string, 
        force: boolean = false
    ) {
        super();
        this.variableName = variableName;
        this.value = value;
        this.sourceVariable = sourceVariable;
        this.force = force;
    }

    public update(context: T & { blackboard?: Blackboard }): TaskStatus {
        const blackboard = (context as any).blackboard;
        if (!blackboard || !(blackboard instanceof Blackboard)) {
            console.warn('SetBlackboardValue: 上下文中未找到Blackboard实例');
            return TaskStatus.Failure;
        }

        let valueToSet: any;
        
        if (this.sourceVariable) {
            if (!blackboard.hasVariable(this.sourceVariable)) {
                console.warn(`SetBlackboardValue: 源变量 "${this.sourceVariable}" 不存在`);
                return TaskStatus.Failure;
            }
            valueToSet = blackboard.getValue(this.sourceVariable);
        } else {
            valueToSet = this.value;
            
            // 处理黑板变量引用，如 "{{variableName}}"
            if (typeof valueToSet === 'string') {
                // 检查是否是纯黑板变量引用（如 "{{variableName}}"）
                const pureVariableMatch = valueToSet.match(/^{{\s*(\w+)\s*}}$/);
                if (pureVariableMatch) {
                    // 纯变量引用，返回原始类型的值
                    const varName = pureVariableMatch[1];
                    if (blackboard.hasVariable(varName)) {
                        valueToSet = blackboard.getValue(varName);
                    } else {
                        console.warn(`SetBlackboardValue: 引用的变量 "${varName}" 不存在`);
                        return TaskStatus.Failure;
                    }
                } else {
                    // 包含变量的字符串模板，进行字符串替换
                    valueToSet = valueToSet.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
                        if (blackboard.hasVariable(varName)) {
                            const value = blackboard.getValue(varName);
                            return value !== undefined ? String(value) : match;
                        }
                        return match;
                    });
                }
            }
        }

        // 获取目标变量的类型定义，确保类型匹配
        const targetVariableDef = blackboard.getVariableDefinition(this.variableName);
        if (targetVariableDef && valueToSet !== null && valueToSet !== undefined) {
            // 根据目标变量类型转换值
            valueToSet = this.convertValueToTargetType(valueToSet, targetVariableDef.type);
        }

        const success = blackboard.setValue(this.variableName, valueToSet, this.force);
        return success ? TaskStatus.Success : TaskStatus.Failure;
    }

    /**
     * 将值转换为目标类型
     */
    private convertValueToTargetType(value: any, targetType: any): any {
        if (value === null || value === undefined) {
            return value;
        }

        // 处理枚举值和字符串值
        const typeStr = targetType === BlackboardValueType.Number || targetType === 'number' ? 'number' :
                       targetType === BlackboardValueType.String || targetType === 'string' ? 'string' :
                       targetType === BlackboardValueType.Boolean || targetType === 'boolean' ? 'boolean' :
                       'unknown';

        // 如果已经是正确类型，直接返回
        switch (typeStr) {
            case 'string':
                return typeof value === 'string' ? value : String(value);
            case 'number':
                if (typeof value === 'number') return value;
                if (typeof value === 'string') {
                    const num = parseFloat(value);
                    return isNaN(num) ? 0 : num;
                }
                return Number(value) || 0;
            case 'boolean':
                if (typeof value === 'boolean') return value;
                if (typeof value === 'string') {
                    return value.toLowerCase() === 'true';
                }
                return Boolean(value);
            default:
                return value;
        }
    }
}

/**
 * 增加数值型黑板变量
 * 
 * @description 将数值型变量增加指定的数值，支持从另一个变量获取增量
 */
export class AddToBlackboardValue<T> extends Behavior<T> {
    /** 目标变量名 */
    public variableName: string;
    
    /** 增量值（与incrementVariable二选一） */
    public increment: number;
    
    /** 增量来源变量名（与increment二选一） */
    public incrementVariable?: string;

    constructor(variableName: string, increment: number, incrementVariable?: string) {
        super();
        this.variableName = variableName;
        this.increment = increment;
        this.incrementVariable = incrementVariable;
    }

    public update(context: T & { blackboard?: Blackboard }): TaskStatus {
        const blackboard = (context as any).blackboard;
        if (!blackboard || !(blackboard instanceof Blackboard)) {
            console.warn('AddToBlackboardValue: 上下文中未找到Blackboard实例');
            return TaskStatus.Failure;
        }

        if (!blackboard.hasVariable(this.variableName)) {
            console.warn(`AddToBlackboardValue: 变量 "${this.variableName}" 不存在`);
            return TaskStatus.Failure;
        }

        const currentValue = blackboard.getValue<number>(this.variableName);
        if (typeof currentValue !== 'number') {
            console.warn(`AddToBlackboardValue: 变量 "${this.variableName}" 不是数值类型`);
            return TaskStatus.Failure;
        }

        let incrementValue: number;
        
        if (this.incrementVariable) {
            if (!blackboard.hasVariable(this.incrementVariable)) {
                console.warn(`AddToBlackboardValue: 增量变量 "${this.incrementVariable}" 不存在`);
                return TaskStatus.Failure;
            }
            incrementValue = blackboard.getValue<number>(this.incrementVariable);
            if (typeof incrementValue !== 'number') {
                console.warn(`AddToBlackboardValue: 增量变量 "${this.incrementVariable}" 不是数值类型`);
                return TaskStatus.Failure;
            }
        } else {
            incrementValue = this.increment;
        }

        const newValue = currentValue + incrementValue;
        const success = blackboard.setValue(this.variableName, newValue);
        
        return success ? TaskStatus.Success : TaskStatus.Failure;
    }
}

/**
 * 切换布尔型黑板变量
 * 
 * @description 将布尔型变量的值取反
 */
export class ToggleBlackboardBool<T> extends Behavior<T> {
    /** 目标变量名 */
    public variableName: string;

    constructor(variableName: string) {
        super();
        this.variableName = variableName;
    }

    public update(context: T & { blackboard?: Blackboard }): TaskStatus {
        const blackboard = (context as any).blackboard;
        if (!blackboard || !(blackboard instanceof Blackboard)) {
            console.warn('ToggleBlackboardBool: 上下文中未找到Blackboard实例');
            return TaskStatus.Failure;
        }

        if (!blackboard.hasVariable(this.variableName)) {
            console.warn(`ToggleBlackboardBool: 变量 "${this.variableName}" 不存在`);
            return TaskStatus.Failure;
        }

        const currentValue = blackboard.getValue<boolean>(this.variableName);
        if (typeof currentValue !== 'boolean') {
            console.warn(`ToggleBlackboardBool: 变量 "${this.variableName}" 不是布尔类型`);
            return TaskStatus.Failure;
        }

        const success = blackboard.setValue(this.variableName, !currentValue);
        return success ? TaskStatus.Success : TaskStatus.Failure;
    }
}

/**
 * 重置黑板变量到默认值
 * 
 * @description 将指定变量重置为其定义时的默认值
 */
export class ResetBlackboardVariable<T> extends Behavior<T> {
    /** 目标变量名 */
    public variableName: string;

    constructor(variableName: string) {
        super();
        this.variableName = variableName;
    }

    public update(context: T & { blackboard?: Blackboard }): TaskStatus {
        const blackboard = (context as any).blackboard;
        if (!blackboard || !(blackboard instanceof Blackboard)) {
            console.warn('ResetBlackboardVariable: 上下文中未找到Blackboard实例');
            return TaskStatus.Failure;
        }

        const success = blackboard.resetVariable(this.variableName);
        return success ? TaskStatus.Success : TaskStatus.Failure;
    }
}

/**
 * 等待黑板变量满足条件
 * 
 * @description 等待指定的黑板变量满足某个条件，常用于同步操作
 */
export class WaitForBlackboardCondition<T> extends Behavior<T> {
    /** 要监听的变量名 */
    public variableName: string;
    
    /** 期望的值 */
    public expectedValue: any;
    
    /** 比较函数（可选，默认使用严格相等比较） */
    public compareFn?: (currentValue: any, expectedValue: any) => boolean;

    constructor(
        variableName: string, 
        expectedValue: any, 
        compareFn?: (currentValue: any, expectedValue: any) => boolean
    ) {
        super();
        this.variableName = variableName;
        this.expectedValue = expectedValue;
        this.compareFn = compareFn;
    }

    public update(context: T & { blackboard?: Blackboard }): TaskStatus {
        const blackboard = (context as any).blackboard;
        if (!blackboard || !(blackboard instanceof Blackboard)) {
            console.warn('WaitForBlackboardCondition: 上下文中未找到Blackboard实例');
            return TaskStatus.Failure;
        }

        if (!blackboard.hasVariable(this.variableName)) {
            console.warn(`WaitForBlackboardCondition: 变量 "${this.variableName}" 不存在`);
            return TaskStatus.Failure;
        }

        const currentValue = blackboard.getValue(this.variableName);
        
        let conditionMet: boolean;
        if (this.compareFn) {
            conditionMet = this.compareFn(currentValue, this.expectedValue);
        } else {
            conditionMet = currentValue === this.expectedValue;
        }

        return conditionMet ? TaskStatus.Success : TaskStatus.Running;
    }
}

/**
 * 记录黑板变量到控制台
 * 
 * @description 将黑板变量的当前值记录到控制台，用于调试
 */
export class LogBlackboardValue<T> extends Behavior<T> {
    /** 要记录的变量名 */
    public variableName: string;
    
    /** 日志前缀 */
    public prefix: string;

    constructor(variableName: string, prefix: string = '[Blackboard]') {
        super();
        this.variableName = variableName;
        this.prefix = prefix;
    }

    public update(context: T & { blackboard?: Blackboard }): TaskStatus {
        const blackboard = (context as any).blackboard;
        if (!blackboard || !(blackboard instanceof Blackboard)) {
            console.warn('LogBlackboardValue: 上下文中未找到Blackboard实例');
            return TaskStatus.Failure;
        }

        if (!blackboard.hasVariable(this.variableName)) {
            console.warn(`LogBlackboardValue: 变量 "${this.variableName}" 不存在`);
            return TaskStatus.Failure;
        }

        const value = blackboard.getValue(this.variableName);
        const variableDefinition = blackboard.getVariableDefinition(this.variableName);
        
        console.log(`${this.prefix} ${this.variableName} (${variableDefinition?.type}):`, value);
        
        return TaskStatus.Success;
    }
}

/**
 * 数学运算黑板变量
 * 
 * @description 对数值型黑板变量执行数学运算
 */
export enum MathOperation {
    Add = 'add',
    Subtract = 'subtract', 
    Multiply = 'multiply',
    Divide = 'divide',
    Modulo = 'modulo',
    Power = 'power',
    Min = 'min',
    Max = 'max'
}

export class MathBlackboardOperation<T> extends Behavior<T> {
    /** 目标变量名 */
    public targetVariable: string;
    
    /** 第一个操作数变量名 */
    public operand1Variable: string;
    
    /** 第二个操作数（可以是值或变量名） */
    public operand2: number | string;
    
    /** 数学操作类型 */
    public operation: MathOperation;

    constructor(
        targetVariable: string,
        operand1Variable: string,
        operand2: number | string,
        operation: MathOperation
    ) {
        super();
        this.targetVariable = targetVariable;
        this.operand1Variable = operand1Variable;
        this.operand2 = operand2;
        this.operation = operation;
    }

    public update(context: T & { blackboard?: Blackboard }): TaskStatus {
        const blackboard = (context as any).blackboard;
        if (!blackboard || !(blackboard instanceof Blackboard)) {
            console.warn('MathBlackboardOperation: 上下文中未找到Blackboard实例');
            return TaskStatus.Failure;
        }

        // 获取第一个操作数
        if (!blackboard.hasVariable(this.operand1Variable)) {
            console.warn(`MathBlackboardOperation: 操作数变量 "${this.operand1Variable}" 不存在`);
            return TaskStatus.Failure;
        }
        
        const operand1 = blackboard.getValue<number>(this.operand1Variable);
        if (typeof operand1 !== 'number') {
            console.warn(`MathBlackboardOperation: 操作数变量 "${this.operand1Variable}" 不是数值类型`);
            return TaskStatus.Failure;
        }

        // 获取第二个操作数
        let operand2: number;
        if (typeof this.operand2 === 'string') {
            if (!blackboard.hasVariable(this.operand2)) {
                console.warn(`MathBlackboardOperation: 操作数变量 "${this.operand2}" 不存在`);
                return TaskStatus.Failure;
            }
            operand2 = blackboard.getValue<number>(this.operand2);
            if (typeof operand2 !== 'number') {
                console.warn(`MathBlackboardOperation: 操作数变量 "${this.operand2}" 不是数值类型`);
                return TaskStatus.Failure;
            }
        } else {
            operand2 = this.operand2;
        }

        // 执行数学运算
        let result: number;
        try {
            switch (this.operation) {
                case MathOperation.Add:
                    result = operand1 + operand2;
                    break;
                case MathOperation.Subtract:
                    result = operand1 - operand2;
                    break;
                case MathOperation.Multiply:
                    result = operand1 * operand2;
                    break;
                case MathOperation.Divide:
                    if (operand2 === 0) {
                        console.warn('MathBlackboardOperation: 除数不能为零');
                        return TaskStatus.Failure;
                    }
                    result = operand1 / operand2;
                    break;
                case MathOperation.Modulo:
                    if (operand2 === 0) {
                        console.warn('MathBlackboardOperation: 模运算的除数不能为零');
                        return TaskStatus.Failure;
                    }
                    result = operand1 % operand2;
                    break;
                case MathOperation.Power:
                    result = Math.pow(operand1, operand2);
                    break;
                case MathOperation.Min:
                    result = Math.min(operand1, operand2);
                    break;
                case MathOperation.Max:
                    result = Math.max(operand1, operand2);
                    break;
                default:
                    console.warn(`MathBlackboardOperation: 不支持的数学操作 "${this.operation}"`);
                    return TaskStatus.Failure;
            }
        } catch (error) {
            console.error('MathBlackboardOperation: 数学运算执行失败:', error);
            return TaskStatus.Failure;
        }

        // 设置结果
        const success = blackboard.setValue(this.targetVariable, result);
        return success ? TaskStatus.Success : TaskStatus.Failure;
    }
} 