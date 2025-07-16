/**
 * Blackboard 类测试
 *
 * 测试行为树黑板系统的数据存储和访问功能
 */
import { Blackboard, BlackboardValueType } from '../../behaviourTree/Blackboard';

describe('Blackboard 类测试', () => {
  let blackboard: Blackboard;

  beforeEach(() => {
    blackboard = new Blackboard();
  });

  // 测试变量定义
  describe('变量定义测试', () => {
    test('应该能定义基本类型变量', () => {
      // 定义不同类型的变量
      blackboard.defineVariable('numberVar', BlackboardValueType.Number, 100);
      blackboard.defineVariable('stringVar', BlackboardValueType.String, 'test');
      blackboard.defineVariable('boolVar', BlackboardValueType.Boolean, true);
      blackboard.defineVariable('objectVar', BlackboardValueType.Object, { key: 'value' });
      blackboard.defineVariable('arrayVar', BlackboardValueType.Array, [1, 2, 3]);

      // 验证变量是否存在
      expect(blackboard.hasVariable('numberVar')).toBe(true);
      expect(blackboard.hasVariable('stringVar')).toBe(true);
      expect(blackboard.hasVariable('boolVar')).toBe(true);
      expect(blackboard.hasVariable('objectVar')).toBe(true);
      expect(blackboard.hasVariable('arrayVar')).toBe(true);
    });

    test('应该能定义带选项的变量', () => {
      // 定义带选项的变量
      blackboard.defineVariable('healthVar', BlackboardValueType.Number, 100, {
        description: '玩家生命值',
        readonly: false,
        min: 0,
        max: 100
      });

      // 获取变量定义
      const varDef = blackboard.getVariableDefinition('healthVar');
      
      // 验证变量定义
      expect(varDef).toBeDefined();
      expect(varDef?.type).toBe(BlackboardValueType.Number);
      expect(varDef?.value).toBe(100);
      expect(varDef?.description).toBe('玩家生命值');
      expect(varDef?.readonly).toBe(false);
      expect(varDef?.min).toBe(0);
      expect(varDef?.max).toBe(100);
    });

    test('重复定义变量应该覆盖旧值', () => {
      // 首次定义
      blackboard.defineVariable('score', BlackboardValueType.Number, 100);
      expect(blackboard.getValue<number>('score')).toBe(100);

      // 重新定义
      blackboard.defineVariable('score', BlackboardValueType.Number, 200);
      expect(blackboard.getValue<number>('score')).toBe(200);
    });

    test('定义变量时类型不匹配应该抛出错误', () => {
      // 尝试定义类型不匹配的变量
      expect(() => {
        blackboard.defineVariable('invalidVar', BlackboardValueType.Number, 'not a number');
      }).toThrow();
    });
  });

  // 测试变量访问
  describe('变量访问测试', () => {
    beforeEach(() => {
      // 预先定义一些变量
      blackboard.defineVariable('health', BlackboardValueType.Number, 100);
      blackboard.defineVariable('name', BlackboardValueType.String, 'Player');
      blackboard.defineVariable('isActive', BlackboardValueType.Boolean, true);
      blackboard.defineVariable('inventory', BlackboardValueType.Array, ['sword', 'shield']);
      blackboard.defineVariable('stats', BlackboardValueType.Object, { strength: 10, agility: 8 });
    });

    test('应该能获取变量值', () => {
      expect(blackboard.getValue<number>('health')).toBe(100);
      expect(blackboard.getValue<string>('name')).toBe('Player');
      expect(blackboard.getValue<boolean>('isActive')).toBe(true);
      expect(blackboard.getValue<string[]>('inventory')).toEqual(['sword', 'shield']);
      expect(blackboard.getValue<object>('stats')).toEqual({ strength: 10, agility: 8 });
    });

    test('获取不存在的变量应该返回undefined', () => {
      expect(blackboard.getValue('nonExistent')).toBeUndefined();
    });

    test('获取不存在的变量时提供默认值应该返回默认值', () => {
      expect(blackboard.getValue('nonExistent', 'default')).toBe('default');
    });

    test('应该能设置变量值', () => {
      // 设置新值
      blackboard.setValue('health', 80);
      blackboard.setValue('name', 'Hero');
      blackboard.setValue('isActive', false);
      blackboard.setValue('inventory', ['sword', 'shield', 'potion']);
      blackboard.setValue('stats', { strength: 12, agility: 9 });

      // 验证新值
      expect(blackboard.getValue<number>('health')).toBe(80);
      expect(blackboard.getValue<string>('name')).toBe('Hero');
      expect(blackboard.getValue<boolean>('isActive')).toBe(false);
      expect(blackboard.getValue<string[]>('inventory')).toEqual(['sword', 'shield', 'potion']);
      expect(blackboard.getValue<object>('stats')).toEqual({ strength: 12, agility: 9 });
    });

    test('设置不存在的变量应该失败', () => {
      const result = blackboard.setValue('nonExistent', 100);
      expect(result).toBe(false);
    });

    test('设置类型不匹配的值应该失败', () => {
      const result = blackboard.setValue('health', 'not a number');
      expect(result).toBe(false);
      // 原值应该保持不变
      expect(blackboard.getValue<number>('health')).toBe(100);
    });
  });

  // 测试只读变量
  describe('只读变量测试', () => {
    beforeEach(() => {
      blackboard.defineVariable('readonlyVar', BlackboardValueType.Number, 100, {
        readonly: true
      });
    });

    test('不应该能修改只读变量', () => {
      const result = blackboard.setValue('readonlyVar', 200);
      expect(result).toBe(false);
      // 值应该保持不变
      expect(blackboard.getValue<number>('readonlyVar')).toBe(100);
    });

    test('使用force参数应该能修改只读变量', () => {
      const result = blackboard.setValue('readonlyVar', 200, true);
      expect(result).toBe(true);
      // 值应该被修改
      expect(blackboard.getValue<number>('readonlyVar')).toBe(200);
    });
  });

  // 测试变量监听
  describe('变量监听测试', () => {
    beforeEach(() => {
      blackboard.defineVariable('observedVar', BlackboardValueType.Number, 100);
    });

    test('应该能监听变量变化', () => {
      const mockListener = jest.fn();
      
      // 添加监听器
      blackboard.addListener('observedVar', mockListener);
      
      // 修改变量
      blackboard.setValue('observedVar', 200);
      
      // 验证监听器被调用
      expect(mockListener).toHaveBeenCalledTimes(1);
      expect(mockListener).toHaveBeenCalledWith(200, 100);
    });

    test('移除监听器后不应该再收到通知', () => {
      const mockListener = jest.fn();

      // 添加监听器
      const listenerId = blackboard.addListener('observedVar', mockListener);

      // 移除监听器
      const result = blackboard.removeListener(listenerId);
      expect(result).toBe(true);

      // 修改变量
      blackboard.setValue('observedVar', 200);

      // 验证监听器未被调用
      expect(mockListener).not.toHaveBeenCalled();
    });

    test('多个监听器应该都能收到通知', () => {
      const mockListener1 = jest.fn();
      const mockListener2 = jest.fn();
      
      // 添加监听器
      blackboard.addListener('observedVar', mockListener1);
      blackboard.addListener('observedVar', mockListener2);
      
      // 修改变量
      blackboard.setValue('observedVar', 200);
      
      // 验证两个监听器都被调用
      expect(mockListener1).toHaveBeenCalledTimes(1);
      expect(mockListener2).toHaveBeenCalledTimes(1);
    });

    test('值变化时应该触发监听器并传递正确的新旧值', () => {
      const mockListener = jest.fn();

      // 添加监听器
      blackboard.addListener('observedVar', mockListener);

      // 获取当前值
      const currentValue = blackboard.getValue('observedVar');
      const newValue = currentValue + 50;

      // 设置新值
      blackboard.setValue('observedVar', newValue);

      // 验证监听器被调用，并且传递了正确的新旧值
      expect(mockListener).toHaveBeenCalledTimes(1);
      expect(mockListener).toHaveBeenCalledWith(newValue, currentValue);
    });
  });

  // 测试序列化和反序列化
  describe('序列化和反序列化测试', () => {
    beforeEach(() => {
      blackboard.defineVariable('number', BlackboardValueType.Number, 100);
      blackboard.defineVariable('string', BlackboardValueType.String, 'test');
      blackboard.defineVariable('boolean', BlackboardValueType.Boolean, true);
      blackboard.defineVariable('array', BlackboardValueType.Array, [1, 2, 3]);
      blackboard.defineVariable('object', BlackboardValueType.Object, { a: 1, b: 2 });
    });

    test('应该能序列化为JSON', () => {
      const json = blackboard.serialize();
      expect(json).toBeDefined();

      // 解析JSON
      const parsed = JSON.parse(json);

      // 验证序列化结果
      expect(parsed.variables).toBeDefined();
      expect(Array.isArray(parsed.variables)).toBe(true);

      // 找到对应的变量
      const numberVar = parsed.variables.find((v: any) => v.name === 'number');
      const stringVar = parsed.variables.find((v: any) => v.name === 'string');
      const boolVar = parsed.variables.find((v: any) => v.name === 'boolean');
      const arrayVar = parsed.variables.find((v: any) => v.name === 'array');
      const objectVar = parsed.variables.find((v: any) => v.name === 'object');

      expect(numberVar.value).toBe(100);
      expect(stringVar.value).toBe('test');
      expect(boolVar.value).toBe(true);
      expect(arrayVar.value).toEqual([1, 2, 3]);
      expect(objectVar.value).toEqual({ a: 1, b: 2 });
    });

    test('应该能从序列化数据恢复', () => {
      const json = blackboard.serialize();

      // 创建新的黑板
      const newBlackboard = new Blackboard();
      const result = newBlackboard.deserialize(json);

      expect(result).toBe(true);

      // 验证加载结果
      expect(newBlackboard.getValue<number>('number')).toBe(100);
      expect(newBlackboard.getValue<string>('string')).toBe('test');
      expect(newBlackboard.getValue<boolean>('boolean')).toBe(true);
      expect(newBlackboard.getValue<number[]>('array')).toEqual([1, 2, 3]);
      expect(newBlackboard.getValue<object>('object')).toEqual({ a: 1, b: 2 });
    });

    test('反序列化无效数据应该返回false', () => {
      const newBlackboard = new Blackboard();
      const result = newBlackboard.deserialize('{"invalid": "data"}');
      expect(result).toBe(false);
    });
  });
});
