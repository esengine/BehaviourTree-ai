import { IConditional } from './IConditional';
import { TaskStatus } from '../TaskStatus';

/**
 * 数值比较条件
 * 
 * @description 对上下文中的数值属性进行比较
 */
export class NumericComparison<T> implements IConditional<T> {
    readonly discriminator = 'IConditional' as const;
    
    /** 属性路径 */
    public propertyPath: string;
    
    /** 比较操作符 */
    public compareOperator: 'greater' | 'less' | 'equal' | 'greaterEqual' | 'lessEqual' | 'notEqual';
    
    /** 比较值 */
    public compareValue: number;

    constructor(
        propertyPath: string,
        compareOperator: 'greater' | 'less' | 'equal' | 'greaterEqual' | 'lessEqual' | 'notEqual',
        compareValue: number
    ) {
        this.propertyPath = propertyPath;
        this.compareOperator = compareOperator;
        this.compareValue = compareValue;
    }

    public update(context: T): TaskStatus {
        try {
            const value = this._getNestedProperty(context, this.propertyPath);
            
            if (typeof value !== 'number') {
                console.warn(`NumericComparison: 属性 "${this.propertyPath}" 不是数值类型，值为: ${value}`);
                return TaskStatus.Failure;
            }

            const result = this._performComparison(value, this.compareValue, this.compareOperator);
            return result ? TaskStatus.Success : TaskStatus.Failure;
        } catch (error) {
            console.error(`NumericComparison: 访问属性 "${this.propertyPath}" 时发生错误:`, error);
            return TaskStatus.Failure;
        }
    }

    /**
     * 获取嵌套属性值
     */
    private _getNestedProperty(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    /**
     * 执行数值比较
     */
    private _performComparison(left: number, right: number, operator: string): boolean {
        switch (operator) {
            case 'greater': return left > right;
            case 'less': return left < right;
            case 'equal': return left === right;
            case 'greaterEqual': return left >= right;
            case 'lessEqual': return left <= right;
            case 'notEqual': return left !== right;
            default: 
                console.warn(`NumericComparison: 未知的比较操作符: ${operator}`);
                return false;
        }
    }
}

/**
 * 属性存在检查条件
 * 
 * @description 检查上下文对象中是否存在指定的属性
 */
export class PropertyExists<T> implements IConditional<T> {
    readonly discriminator = 'IConditional' as const;
    
    /** 属性路径 */
    public propertyPath: string;

    constructor(propertyPath: string) {
        this.propertyPath = propertyPath;
    }

    public update(context: T): TaskStatus {
        try {
            const value = this._getNestedProperty(context, this.propertyPath);
            const exists = value !== undefined && value !== null;
            return exists ? TaskStatus.Success : TaskStatus.Failure;
        } catch (error) {
            console.error(`PropertyExists: 访问属性 "${this.propertyPath}" 时发生错误:`, error);
            return TaskStatus.Failure;
        }
    }

    /**
     * 获取嵌套属性值
     */
    private _getNestedProperty(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }
} 