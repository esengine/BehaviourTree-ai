import { IConditional } from '../conditionals/IConditional';
import { ExecuteActionConditional } from '../conditionals/ExecuteActionConditional';
import { BlackboardValueComparison, CompareOperator } from '../conditionals/BlackboardConditionals';
import { TaskStatus } from '../TaskStatus';
import { Blackboard } from '../Blackboard';

/**
 * 条件配置接口
 */
export interface ConditionConfig {
    type: string;
    properties?: Record<string, any>;
}

/**
 * 条件处理器工厂类
 * @description 专门负责创建各种类型的条件节点，保持代码整洁和可维护性
 */
export class ConditionFactory {
    /**
     * 从条件配置创建条件节点
     * @param condition 条件配置
     * @param nodeProperties 父节点的属性（用于条件装饰器）
     * @param context 执行上下文
     * @returns 条件节点实例
     */
    public static createCondition<T>(
        condition: ConditionConfig | undefined,
        nodeProperties: Record<string, any> = {},
        context: T
    ): IConditional<T> {
        if (!condition) {
            return new ExecuteActionConditional<T>(() => TaskStatus.Success);
        }

        switch (condition.type) {
            case 'blackboard-value-comparison':
                return ConditionFactory.createBlackboardComparison<T>(nodeProperties);
                
            case 'condition-custom':
                return ConditionFactory.createCustomCondition<T>(condition.properties);
                
            default:
                console.warn(`未知的条件类型: ${condition.type}，使用默认成功条件`);
                return new ExecuteActionConditional<T>(() => TaskStatus.Success);
        }
    }

    /**
     * 创建黑板值比较条件
     * @param properties 节点属性
     * @returns 黑板比较条件实例
     */
    private static createBlackboardComparison<T>(properties: Record<string, any>): IConditional<T> {
        // 提取嵌套的属性值
        const variableName = ConditionFactory.extractNestedValue(properties.variableName) || 'variable';
        const operator = ConditionFactory.extractNestedValue(properties.operator) || 'equal';
        const compareValue = ConditionFactory.extractNestedValue(properties.compareValue);
        const compareVariable = ConditionFactory.extractNestedValue(properties.compareVariable);

        // 映射操作符字符串到枚举
        const operatorEnum = ConditionFactory.mapOperatorToEnum(operator);

        // 处理黑板变量引用（如 "{{variableName}}"）
        const cleanVariableName = ConditionFactory.cleanVariableName(variableName);
        const cleanCompareVariable = compareVariable ? ConditionFactory.cleanVariableName(compareVariable) : undefined;

        console.log(`[ConditionFactory] 原始变量名: "${variableName}" -> 清理后: "${cleanVariableName}"`);
        console.log(`[ConditionFactory] 原始比较值: "${compareValue}" (${typeof compareValue})`);
        console.log(`[ConditionFactory] 原始properties.compareValue:`, JSON.stringify(properties.compareValue, null, 2));

        // 处理类型转换 - 特别是布尔值的字符串表示
        let processedCompareValue = compareValue;
        if (typeof compareValue === 'string') {
            // 如果比较值是字符串，尝试转换为对应的类型
            if (compareValue.toLowerCase() === 'true') {
                processedCompareValue = true;
            } else if (compareValue.toLowerCase() === 'false') {
                processedCompareValue = false;
            } else if (!isNaN(Number(compareValue)) && compareValue.trim() !== '') {
                // 如果是数字字符串，转换为数字
                processedCompareValue = Number(compareValue);
            }
        }

        console.log(`[ConditionFactory] 创建黑板比较条件: ${cleanVariableName} ${operator} ${processedCompareValue} (类型: ${typeof processedCompareValue})`);

        return new BlackboardValueComparison<T>(
            cleanVariableName,
            operatorEnum,
            processedCompareValue,
            cleanCompareVariable
        );
    }

    /**
     * 创建自定义条件
     * @param properties 条件属性
     * @returns 自定义条件实例
     */
    private static createCustomCondition<T>(properties: Record<string, any> = {}): IConditional<T> {
        const conditionCodeConfig = properties.conditionCode;
        const conditionCode = typeof conditionCodeConfig === 'string' ? conditionCodeConfig :
            (typeof conditionCodeConfig === 'object' && conditionCodeConfig && 'value' in conditionCodeConfig ?
                String((conditionCodeConfig as { value: unknown }).value) : undefined);

        if (conditionCode && typeof conditionCode === 'string') {
            try {
                const condFunc = new Function('context', `
                    try {
                        return (${conditionCode})(context);
                    } catch (error) {
                        console.error('自定义条件函数执行错误:', error);
                        return false;
                    }
                `);
                
                return new ExecuteActionConditional<T>((ctx: T) => {
                    try {
                        const result = condFunc(ctx);
                        return result ? TaskStatus.Success : TaskStatus.Failure;
                    } catch (error) {
                        console.error('自定义条件函数执行失败:', error);
                        return TaskStatus.Failure;
                    }
                });
            } catch (error) {
                console.warn('解析自定义条件函数失败:', error);
            }
        }

        return new ExecuteActionConditional<T>(() => TaskStatus.Failure);
    }

    /**
     * 映射操作符字符串到枚举
     * @param operator 操作符字符串
     * @returns 操作符枚举值
     */
    private static mapOperatorToEnum(operator: string): CompareOperator {
        switch (operator.toLowerCase()) {
            case 'equal': return CompareOperator.Equal;
            case 'notequal': case 'not_equal': return CompareOperator.NotEqual;
            case 'greater': return CompareOperator.Greater;
            case 'greaterorequal': case 'greater_or_equal': return CompareOperator.GreaterOrEqual;
            case 'less': return CompareOperator.Less;
            case 'lessorequal': case 'less_or_equal': return CompareOperator.LessOrEqual;
            case 'contains': return CompareOperator.Contains;
            case 'notcontains': case 'not_contains': return CompareOperator.NotContains;
            default: return CompareOperator.Equal;
        }
    }

    /**
     * 清理变量名，移除黑板变量引用语法
     * @param variableName 原始变量名
     * @returns 清理后的变量名
     */
    private static cleanVariableName(variableName: string): string {
        if (typeof variableName !== 'string') {
            return String(variableName);
        }
        return variableName.replace(/^\{\{|\}\}$/g, '');
    }

    /**
     * 提取嵌套属性值
     * @description 处理编辑器生成的嵌套属性结构
     * @param prop 属性配置对象或直接值
     * @returns 提取的值
     */
    private static extractNestedValue(prop: any): any {
        if (prop === null || prop === undefined) {
            return prop;
        }

        // 如果是简单值，直接返回
        if (typeof prop !== 'object') {
            return prop;
        }

        // 如果有value属性，递归提取
        if ('value' in prop) {
            return ConditionFactory.extractNestedValue(prop.value);
        }

        return prop;
    }
} 