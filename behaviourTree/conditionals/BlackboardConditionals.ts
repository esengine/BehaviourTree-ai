import { IConditional } from './IConditional';
import { Blackboard, BlackboardValueType } from '../Blackboard';
import { TaskStatus } from '../TaskStatus';

/**
 * 黑板比较操作符
 */
export enum CompareOperator {
    Equal = 'equal',
    NotEqual = 'notEqual',
    Greater = 'greater',
    GreaterOrEqual = 'greaterOrEqual',
    Less = 'less',
    LessOrEqual = 'lessOrEqual',
    Contains = 'contains',
    NotContains = 'notContains'
}

/**
 * 黑板值比较条件
 * 
 * @description 比较黑板变量与指定值或另一个黑板变量
 * 
 * @example
 * ```typescript
 * // 检查玩家生命值是否大于50
 * const healthCheck = new BlackboardValueComparison<GameContext>(
 *   'playerHealth', 
 *   CompareOperator.Greater, 
 *   50
 * );
 * 
 * // 比较两个黑板变量
 * const compareVars = new BlackboardValueComparison<GameContext>(
 *   'playerHealth', 
 *   CompareOperator.Greater, 
 *   null,
 *   'enemyHealth'
 * );
 * ```
 */
export class BlackboardValueComparison<T> implements IConditional<T> {
    readonly discriminator = 'IConditional' as const;
    
    /** 要比较的黑板变量名 */
    public variableName: string;
    
    /** 比较操作符 */
    public operator: CompareOperator;
    
    /** 比较值（与compareVariable二选一） */
    public compareValue: any;
    
    /** 要比较的另一个黑板变量名（与compareValue二选一） */
    public compareVariable?: string;

    constructor(
        variableName: string,
        operator: CompareOperator,
        compareValue: any = null,
        compareVariable?: string
    ) {
        this.variableName = variableName;
        this.operator = operator;
        this.compareValue = compareValue;
        this.compareVariable = compareVariable;
    }

    /**
     * 检查条件是否满足
     */
    public update(context: T & { blackboard?: Blackboard }): TaskStatus {
        const blackboard = (context as any).blackboard;
        if (!blackboard || !(blackboard instanceof Blackboard)) {
            console.warn('BlackboardValueComparison: 上下文中未找到Blackboard实例');
            return TaskStatus.Failure;
        }

        if (!blackboard.hasVariable(this.variableName)) {
            console.warn(`BlackboardValueComparison: 变量 "${this.variableName}" 不存在`);
            return TaskStatus.Failure;
        }

        const leftValue = blackboard.getValue(this.variableName);
        
        let rightValue: any;

        if (this.compareVariable) {
            if (!blackboard.hasVariable(this.compareVariable)) {
                console.warn(`BlackboardValueComparison: 比较变量 "${this.compareVariable}" 不存在`);
                return TaskStatus.Failure;
            }
            rightValue = blackboard.getValue(this.compareVariable);
        } else {
            rightValue = this.compareValue;
        }

        const result = this._performComparison(leftValue, rightValue, this.operator);
        return result ? TaskStatus.Success : TaskStatus.Failure;
    }

    /**
     * 执行比较操作
     */
    private _performComparison(left: any, right: any, operator: CompareOperator): boolean {
        switch (operator) {
            case CompareOperator.Equal:
                return left === right;
            
            case CompareOperator.NotEqual:
                return left !== right;
            
            case CompareOperator.Greater:
                return typeof left === 'number' && typeof right === 'number' && left > right;
            
            case CompareOperator.GreaterOrEqual:
                return typeof left === 'number' && typeof right === 'number' && left >= right;
            
            case CompareOperator.Less:
                return typeof left === 'number' && typeof right === 'number' && left < right;
            
            case CompareOperator.LessOrEqual:
                return typeof left === 'number' && typeof right === 'number' && left <= right;
            
            case CompareOperator.Contains:
                if (typeof left === 'string' && typeof right === 'string') {
                    return left.includes(right);
                }
                if (Array.isArray(left)) {
                    return left.includes(right);
                }
                return false;
            
            case CompareOperator.NotContains:
                if (typeof left === 'string' && typeof right === 'string') {
                    return !left.includes(right);
                }
                if (Array.isArray(left)) {
                    return !left.includes(right);
                }
                return true;
            
            default:
                return false;
        }
    }
}

/**
 * 黑板变量存在性检查
 * 
 * @description 检查指定的黑板变量是否存在且不为null/undefined
 */
export class BlackboardVariableExists<T> implements IConditional<T> {
    readonly discriminator = 'IConditional' as const;
    
    /** 要检查的变量名 */
    public variableName: string;
    
    /** 是否反转结果（检查变量不存在或为null） */
    public invert: boolean;

    constructor(variableName: string, invert: boolean = false) {
        this.variableName = variableName;
        this.invert = invert;
    }

    public update(context: T & { blackboard?: Blackboard }): TaskStatus {
        const blackboard = (context as any).blackboard;
        if (!blackboard || !(blackboard instanceof Blackboard)) {
            console.warn('BlackboardVariableExists: 上下文中未找到Blackboard实例');
            return this.invert ? TaskStatus.Success : TaskStatus.Failure;
        }

        const exists = blackboard.hasVariable(this.variableName);
        const value = exists ? blackboard.getValue(this.variableName) : undefined;
        const isValid = exists && value !== null && value !== undefined;

        const result = this.invert ? !isValid : isValid;
        return result ? TaskStatus.Success : TaskStatus.Failure;
    }
}

/**
 * 黑板变量类型检查
 * 
 * @description 检查黑板变量是否为指定类型
 */
export class BlackboardVariableTypeCheck<T> implements IConditional<T> {
    readonly discriminator = 'IConditional' as const;
    
    /** 要检查的变量名 */
    public variableName: string;
    
    /** 期望的变量类型 */
    public expectedType: BlackboardValueType;

    constructor(variableName: string, expectedType: BlackboardValueType) {
        this.variableName = variableName;
        this.expectedType = expectedType;
    }

    public update(context: T & { blackboard?: Blackboard }): TaskStatus {
        const blackboard = (context as any).blackboard;
        if (!blackboard || !(blackboard instanceof Blackboard)) {
            console.warn('BlackboardVariableTypeCheck: 上下文中未找到Blackboard实例');
            return TaskStatus.Failure;
        }

        const variableDefinition = blackboard.getVariableDefinition(this.variableName);
        if (!variableDefinition) {
            return TaskStatus.Failure;
        }

        const result = variableDefinition.type === this.expectedType;
        return result ? TaskStatus.Success : TaskStatus.Failure;
    }
}

/**
 * 黑板变量范围检查
 * 
 * @description 检查数值型黑板变量是否在指定范围内
 */
export class BlackboardVariableRangeCheck<T> implements IConditional<T> {
    readonly discriminator = 'IConditional' as const;
    
    /** 要检查的变量名 */
    public variableName: string;
    
    /** 最小值（包含） */
    public minValue: number;
    
    /** 最大值（包含） */
    public maxValue: number;

    constructor(variableName: string, minValue: number, maxValue: number) {
        this.variableName = variableName;
        this.minValue = minValue;
        this.maxValue = maxValue;
    }

    public update(context: T & { blackboard?: Blackboard }): TaskStatus {
        const blackboard = (context as any).blackboard;
        if (!blackboard || !(blackboard instanceof Blackboard)) {
            console.warn('BlackboardVariableRangeCheck: 上下文中未找到Blackboard实例');
            return TaskStatus.Failure;
        }

        if (!blackboard.hasVariable(this.variableName)) {
            return TaskStatus.Failure;
        }

        const value = blackboard.getValue<number>(this.variableName);
        if (typeof value !== 'number') {
            return TaskStatus.Failure;
        }

        const result = value >= this.minValue && value <= this.maxValue;
        return result ? TaskStatus.Success : TaskStatus.Failure;
    }
} 