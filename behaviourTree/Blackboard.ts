/**
 * 黑板变量类型枚举
 */
export enum BlackboardValueType {
    String = 'string',
    Number = 'number',
    Boolean = 'boolean',
    Vector2 = 'vector2',
    Vector3 = 'vector3',
    Object = 'object',
    Array = 'array'
}

/**
 * 黑板变量定义接口
 */
export interface BlackboardVariable {
    /** 变量名称 */
    name: string;
    /** 变量类型 */
    type: BlackboardValueType;
    /** 当前值 */
    value: any;
    /** 默认值 */
    defaultValue: any;
    /** 变量描述 */
    description?: string;
    /** 是否只读 */
    readonly?: boolean;
    /** 变量分组 */
    group?: string;
    /** 最小值（仅数字类型） */
    min?: number;
    /** 最大值（仅数字类型） */
    max?: number;
    /** 可选值列表 */
    options?: any[];
}

/**
 * 黑板监听器接口
 */
export interface BlackboardListener {
    /** 变量名称 */
    variableName: string;
    /** 回调函数 */
    callback: (newValue: any, oldValue: any) => void;
    /** 监听器ID */
    id: string;
}

/**
 * 行为树黑板系统
 * 
 * @description 
 * 提供类型安全的变量存储和访问机制，支持：
 * - 类型化变量定义和访问
 * - 变量监听和回调
 * - 序列化和反序列化
 * - 实时调试和编辑
 * 
 * @example
 * ```typescript
 * // 创建黑板实例
 * const blackboard = new Blackboard();
 * 
 * // 定义变量
 * blackboard.defineVariable('playerHealth', BlackboardValueType.Number, 100, {
 *   description: '玩家生命值',
 *   min: 0,
 *   max: 100
 * });
 * 
 * // 设置和获取值
 * blackboard.setValue('playerHealth', 80);
 * const health = blackboard.getValue<number>('playerHealth');
 * 
 * // 监听变量变化
 * blackboard.addListener('playerHealth', (newVal, oldVal) => {
 *   console.log(`玩家生命值从 ${oldVal} 变为 ${newVal}`);
 * });
 * ```
 */
export class Blackboard {
    /** 变量定义存储 */
    private _variables: Map<string, BlackboardVariable> = new Map();
    
    /** 变量监听器存储 */
    private _listeners: Map<string, BlackboardListener[]> = new Map();
    
    /** 监听器计数器 */
    private _listenerIdCounter: number = 0;
    
    /** 变量修改历史 */
    private _history: Array<{
        variableName: string;
        oldValue: any;
        newValue: any;
        timestamp: number;
    }> = [];
    
    /** 是否启用历史记录 */
    public enableHistory: boolean = false;

    /**
     * 定义一个黑板变量
     * 
     * @param name 变量名
     * @param type 变量类型
     * @param defaultValue 默认值
     * @param options 额外选项
     */
    public defineVariable(
        name: string, 
        type: BlackboardValueType, 
        defaultValue: any, 
        options: Partial<BlackboardVariable> = {}
    ): void {
        if (!name || typeof name !== 'string') {
            throw new Error('变量名必须是非空字符串');
        }

        if (this._variables.has(name)) {
            console.warn(`黑板变量 "${name}" 已存在，将被重新定义`);
        }

        // 验证默认值类型
        if (!this._validateValueType(defaultValue, type)) {
            throw new Error(`默认值类型与变量类型 "${type}" 不匹配`);
        }

        const variable: BlackboardVariable = {
            name,
            type,
            value: this._cloneValue(defaultValue),
            defaultValue: this._cloneValue(defaultValue),
            description: options.description || '',
            readonly: options.readonly || false,
            group: options.group || 'Default',
            min: options.min,
            max: options.max,
            options: options.options ? [...options.options] : undefined
        };

        this._variables.set(name, variable);
    }

    /**
     * 设置变量值
     * 
     * @param name 变量名
     * @param value 新值
     * @param force 是否强制设置（忽略只读限制）
     */
    public setValue<T = any>(name: string, value: T, force: boolean = false): boolean {
        const variable = this._variables.get(name);
        if (!variable) {
            console.warn(`尝试设置不存在的黑板变量 "${name}"`);
            return false;
        }

        if (variable.readonly && !force) {
            console.warn(`尝试修改只读黑板变量 "${name}"`);
            return false;
        }

        // 类型验证
        if (!this._validateValueType(value, variable.type)) {
            console.error(`设置的值类型与变量 "${name}" 的类型 "${variable.type}" 不匹配`);
            return false;
        }

        // 数值范围验证
        if (variable.type === BlackboardValueType.Number && typeof value === 'number') {
            if (variable.min !== undefined && value < variable.min) {
                console.warn(`变量 "${name}" 的值 ${value} 小于最小值 ${variable.min}`);
                return false;
            }
            if (variable.max !== undefined && value > variable.max) {
                console.warn(`变量 "${name}" 的值 ${value} 大于最大值 ${variable.max}`);
                return false;
            }
        }

        // 可选值验证
        if (variable.options && !variable.options.includes(value)) {
            console.warn(`变量 "${name}" 的值不在允许的选项中`);
            return false;
        }

        const oldValue = this._cloneValue(variable.value);
        const newValue = this._cloneValue(value);
        
        // 更新值
        variable.value = newValue;

        // 记录历史
        if (this.enableHistory) {
            this._history.push({
                variableName: name,
                oldValue,
                newValue,
                timestamp: Date.now()
            });
        }

        // 触发监听器
        this._notifyListeners(name, newValue, oldValue);

        return true;
    }

    /**
     * 获取变量值
     * 
     * @param name 变量名
     * @param defaultValue 变量不存在时的默认返回值
     * @returns 变量值
     */
    public getValue<T = any>(name: string, defaultValue?: T): T {
        const variable = this._variables.get(name);
        if (!variable) {
            if (defaultValue !== undefined) {
                return defaultValue;
            }
            console.warn(`尝试获取不存在的黑板变量 "${name}"`);
            return undefined as any;
        }
        
        return this._cloneValue(variable.value) as T;
    }

    /**
     * 设置变量值 (setValue的别名方法)
     * 
     * @param name 变量名
     * @param value 新值
     * @param force 是否强制设置（忽略只读限制）
     */
    public set<T = any>(name: string, value: T, force: boolean = false): boolean {
        return this.setValue(name, value, force);
    }

    /**
     * 获取变量值 (getValue的别名方法)
     * 
     * @param name 变量名
     * @param defaultValue 变量不存在时的默认返回值
     * @returns 变量值
     */
    public get<T = any>(name: string, defaultValue?: T): T {
        return this.getValue(name, defaultValue);
    }

    /**
     * 检查变量是否存在
     */
    public hasVariable(name: string): boolean {
        return this._variables.has(name);
    }

    /**
     * 获取变量定义
     */
    public getVariableDefinition(name: string): BlackboardVariable | undefined {
        const variable = this._variables.get(name);
        return variable ? { ...variable } : undefined;
    }

    /**
     * 获取所有变量名称
     */
    public getVariableNames(): string[] {
        return Array.from(this._variables.keys());
    }

    /**
     * 按分组获取变量
     */
    public getVariablesByGroup(group: string): BlackboardVariable[] {
        return Array.from(this._variables.values())
            .filter(v => v.group === group)
            .map(v => ({ ...v }));
    }

    /**
     * 获取所有分组
     */
    public getGroups(): string[] {
        const groups = new Set<string>();
        this._variables.forEach(variable => {
            groups.add(variable.group || 'Default');
        });
        return Array.from(groups).sort();
    }

    /**
     * 重置变量到默认值
     */
    public resetVariable(name: string): boolean {
        const variable = this._variables.get(name);
        if (!variable) {
            return false;
        }
        
        return this.setValue(name, variable.defaultValue, true);
    }

    /**
     * 重置所有变量到默认值
     */
    public resetAll(): void {
        this._variables.forEach((variable, name) => {
            this.setValue(name, variable.defaultValue, true);
        });
    }

    /**
     * 删除变量
     */
    public removeVariable(name: string): boolean {
        if (!this._variables.has(name)) {
            return false;
        }

        this._variables.delete(name);
        this._listeners.delete(name);
        return true;
    }

    /**
     * 添加变量监听器
     */
    public addListener(
        variableName: string, 
        callback: (newValue: any, oldValue: any) => void
    ): string {
        const id = `listener_${this._listenerIdCounter++}`;
        const listener: BlackboardListener = {
            variableName,
            callback,
            id
        };

        if (!this._listeners.has(variableName)) {
            this._listeners.set(variableName, []);
        }
        
        this._listeners.get(variableName)!.push(listener);
        return id;
    }

    /**
     * 移除监听器
     */
    public removeListener(listenerId: string): boolean {
        for (const [variableName, listeners] of this._listeners.entries()) {
            const index = listeners.findIndex(l => l.id === listenerId);
            if (index !== -1) {
                listeners.splice(index, 1);
                if (listeners.length === 0) {
                    this._listeners.delete(variableName);
                }
                return true;
            }
        }
        return false;
    }

    /**
     * 序列化黑板数据
     */
    public serialize(): string {
        const data = {
            variables: Array.from(this._variables.entries()).map(([name, variable]) => ({
                name,
                type: variable.type,
                value: variable.value,
                defaultValue: variable.defaultValue,
                description: variable.description,
                readonly: variable.readonly,
                group: variable.group,
                min: variable.min,
                max: variable.max,
                options: variable.options
            }))
        };
        
        return JSON.stringify(data, null, 2);
    }

    /**
     * 从序列化数据恢复黑板
     */
    public deserialize(data: string): boolean {
        try {
            const parsed = JSON.parse(data);
            if (!parsed.variables || !Array.isArray(parsed.variables)) {
                throw new Error('无效的黑板数据格式');
            }

            // 清空现有数据
            this._variables.clear();
            this._listeners.clear();

            // 恢复变量定义
            for (const varData of parsed.variables) {
                this.defineVariable(
                    varData.name,
                    varData.type,
                    varData.defaultValue,
                    {
                        description: varData.description,
                        readonly: varData.readonly,
                        group: varData.group,
                        min: varData.min,
                        max: varData.max,
                        options: varData.options
                    }
                );
                
                // 设置当前值
                this.setValue(varData.name, varData.value, true);
            }

            return true;
        } catch (error) {
            console.error('反序列化黑板数据失败:', error);
            return false;
        }
    }

    /**
     * 获取修改历史
     */
    public getHistory(): Array<{
        variableName: string;
        oldValue: any;
        newValue: any;
        timestamp: number;
    }> {
        return [...this._history];
    }

    /**
     * 清空历史记录
     */
    public clearHistory(): void {
        this._history.length = 0;
    }

    /**
     * 验证值类型
     */
    private _validateValueType(value: any, type: BlackboardValueType): boolean {
        switch (type) {
            case BlackboardValueType.String:
                return typeof value === 'string';
            case BlackboardValueType.Number:
                return typeof value === 'number' && !isNaN(value);
            case BlackboardValueType.Boolean:
                return typeof value === 'boolean';
            case BlackboardValueType.Vector2:
                return this._isVector2(value);
            case BlackboardValueType.Vector3:
                return this._isVector3(value);
            case BlackboardValueType.Object:
                return typeof value === 'object' && value !== null && !Array.isArray(value);
            case BlackboardValueType.Array:
                return Array.isArray(value);
            default:
                return true;
        }
    }

    /**
     * 检查是否为Vector2
     */
    private _isVector2(value: any): boolean {
        return typeof value === 'object' && 
               value !== null && 
               typeof value.x === 'number' && 
               typeof value.y === 'number';
    }

    /**
     * 检查是否为Vector3
     */
    private _isVector3(value: any): boolean {
        return typeof value === 'object' && 
               value !== null && 
               typeof value.x === 'number' && 
               typeof value.y === 'number' && 
               typeof value.z === 'number';
    }

    /**
     * 深拷贝值
     */
    private _cloneValue(value: any): any {
        if (value === null || typeof value !== 'object') {
            return value;
        }
        
        if (Array.isArray(value)) {
            return value.map(item => this._cloneValue(item));
        }
        
        const cloned: any = {};
        for (const key in value) {
            if (value.hasOwnProperty(key)) {
                cloned[key] = this._cloneValue(value[key]);
            }
        }
        return cloned;
    }

    /**
     * 通知监听器
     */
    private _notifyListeners(variableName: string, newValue: any, oldValue: any): void {
        const listeners = this._listeners.get(variableName);
        if (listeners) {
            listeners.forEach(listener => {
                try {
                    listener.callback(newValue, oldValue);
                } catch (error) {
                    console.error(`黑板监听器回调执行失败:`, error);
                }
            });
        }
    }
} 