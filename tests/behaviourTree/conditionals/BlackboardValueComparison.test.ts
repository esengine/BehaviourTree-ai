/**
 * BlackboardValueComparison 条件节点测试
 * 
 * 测试黑板值比较条件的行为
 */
import { BlackboardValueComparison, CompareOperator } from '../../../behaviourTree/conditionals/BlackboardConditionals';
import { TaskStatus } from '../../../behaviourTree/TaskStatus';
import { Blackboard, BlackboardValueType } from '../../../behaviourTree/Blackboard';
import { TestUtils, TestContext } from '../../utils/TestUtils';

// 扩展测试上下文以支持黑板
interface BlackboardTestContext extends TestContext {
  blackboard: Blackboard;
}

describe('BlackboardValueComparison 条件节点测试', () => {
  let context: BlackboardTestContext;
  let blackboard: Blackboard;

  beforeEach(() => {
    blackboard = new Blackboard();
    context = {
      ...TestUtils.createTestContext(),
      blackboard
    };
  });

  // 测试基本功能
  describe('基本功能测试', () => {
    test('应该能创建BlackboardValueComparison实例', () => {
      const condition = new BlackboardValueComparison<BlackboardTestContext>(
        'testVar', 
        CompareOperator.Equal, 
        42
      );
      expect(condition).toBeDefined();
      expect(condition.discriminator).toBe('IConditional');
      expect(condition.variableName).toBe('testVar');
      expect(condition.operator).toBe(CompareOperator.Equal);
      expect(condition.compareValue).toBe(42);
    });

    test('应该能比较数值相等', () => {
      blackboard.defineVariable('playerHealth', BlackboardValueType.Number, 100);
      
      const condition = new BlackboardValueComparison<BlackboardTestContext>(
        'playerHealth', 
        CompareOperator.Equal, 
        100
      );
      
      const result = condition.update(context);
      expect(result).toBe(TaskStatus.Success);
    });

    test('应该能比较数值不相等', () => {
      blackboard.defineVariable('playerHealth', BlackboardValueType.Number, 100);
      
      const condition = new BlackboardValueComparison<BlackboardTestContext>(
        'playerHealth', 
        CompareOperator.NotEqual, 
        50
      );
      
      const result = condition.update(context);
      expect(result).toBe(TaskStatus.Success);
    });

    test('应该能比较大于关系', () => {
      blackboard.defineVariable('playerLevel', BlackboardValueType.Number, 15);
      
      const condition = new BlackboardValueComparison<BlackboardTestContext>(
        'playerLevel', 
        CompareOperator.Greater, 
        10
      );
      
      const result = condition.update(context);
      expect(result).toBe(TaskStatus.Success);
    });

    test('应该能比较小于关系', () => {
      blackboard.defineVariable('enemyCount', BlackboardValueType.Number, 3);
      
      const condition = new BlackboardValueComparison<BlackboardTestContext>(
        'enemyCount', 
        CompareOperator.Less, 
        5
      );
      
      const result = condition.update(context);
      expect(result).toBe(TaskStatus.Success);
    });

    test('应该能比较大于等于关系', () => {
      blackboard.defineVariable('score', BlackboardValueType.Number, 1000);
      
      const condition = new BlackboardValueComparison<BlackboardTestContext>(
        'score', 
        CompareOperator.GreaterOrEqual, 
        1000
      );
      
      const result = condition.update(context);
      expect(result).toBe(TaskStatus.Success);
    });

    test('应该能比较小于等于关系', () => {
      blackboard.defineVariable('ammo', BlackboardValueType.Number, 10);
      
      const condition = new BlackboardValueComparison<BlackboardTestContext>(
        'ammo', 
        CompareOperator.LessOrEqual, 
        10
      );
      
      const result = condition.update(context);
      expect(result).toBe(TaskStatus.Success);
    });
  });

  // 测试字符串比较
  describe('字符串比较测试', () => {
    test('应该能比较字符串相等', () => {
      blackboard.defineVariable('playerName', BlackboardValueType.String, 'Hero');
      
      const condition = new BlackboardValueComparison<BlackboardTestContext>(
        'playerName', 
        CompareOperator.Equal, 
        'Hero'
      );
      
      const result = condition.update(context);
      expect(result).toBe(TaskStatus.Success);
    });

    test('应该能检查字符串包含', () => {
      blackboard.defineVariable('message', BlackboardValueType.String, 'Hello World');
      
      const condition = new BlackboardValueComparison<BlackboardTestContext>(
        'message', 
        CompareOperator.Contains, 
        'World'
      );
      
      const result = condition.update(context);
      expect(result).toBe(TaskStatus.Success);
    });

    test('应该能检查字符串不包含', () => {
      blackboard.defineVariable('message', BlackboardValueType.String, 'Hello World');
      
      const condition = new BlackboardValueComparison<BlackboardTestContext>(
        'message', 
        CompareOperator.NotContains, 
        'Goodbye'
      );
      
      const result = condition.update(context);
      expect(result).toBe(TaskStatus.Success);
    });
  });

  // 测试变量间比较
  describe('变量间比较测试', () => {
    test('应该能比较两个黑板变量', () => {
      blackboard.defineVariable('playerHealth', BlackboardValueType.Number, 80);
      blackboard.defineVariable('enemyHealth', BlackboardValueType.Number, 60);
      
      const condition = new BlackboardValueComparison<BlackboardTestContext>(
        'playerHealth', 
        CompareOperator.Greater, 
        null,
        'enemyHealth'
      );
      
      const result = condition.update(context);
      expect(result).toBe(TaskStatus.Success);
    });

    test('应该能比较两个字符串变量', () => {
      blackboard.defineVariable('currentState', BlackboardValueType.String, 'combat');
      blackboard.defineVariable('expectedState', BlackboardValueType.String, 'combat');
      
      const condition = new BlackboardValueComparison<BlackboardTestContext>(
        'currentState', 
        CompareOperator.Equal, 
        null,
        'expectedState'
      );
      
      const result = condition.update(context);
      expect(result).toBe(TaskStatus.Success);
    });

    test('变量比较失败时应该返回失败', () => {
      blackboard.defineVariable('playerDamage', BlackboardValueType.Number, 20);
      blackboard.defineVariable('enemyArmor', BlackboardValueType.Number, 30);
      
      const condition = new BlackboardValueComparison<BlackboardTestContext>(
        'playerDamage', 
        CompareOperator.Greater, 
        null,
        'enemyArmor'
      );
      
      const result = condition.update(context);
      expect(result).toBe(TaskStatus.Failure);
    });
  });

  // 测试错误处理
  describe('错误处理测试', () => {
    test('没有黑板时应该返回失败', () => {
      const contextWithoutBlackboard = TestUtils.createTestContext();
      const condition = new BlackboardValueComparison<TestContext>(
        'testVar', 
        CompareOperator.Equal, 
        42
      );
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = condition.update(contextWithoutBlackboard);
      
      expect(result).toBe(TaskStatus.Failure);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('变量 "testVar" 不存在')
      );
      
      consoleSpy.mockRestore();
    });

    test('变量不存在时应该返回失败', () => {
      const condition = new BlackboardValueComparison<BlackboardTestContext>(
        'nonExistentVar', 
        CompareOperator.Equal, 
        42
      );
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = condition.update(context);
      
      expect(result).toBe(TaskStatus.Failure);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('变量 "nonExistentVar" 不存在')
      );
      
      consoleSpy.mockRestore();
    });

    test('比较变量不存在时应该返回失败', () => {
      blackboard.defineVariable('existingVar', BlackboardValueType.Number, 100);
      
      const condition = new BlackboardValueComparison<BlackboardTestContext>(
        'existingVar', 
        CompareOperator.Equal, 
        null,
        'nonExistentCompareVar'
      );
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = condition.update(context);
      
      expect(result).toBe(TaskStatus.Failure);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('比较变量 "nonExistentCompareVar" 不存在')
      );
      
      consoleSpy.mockRestore();
    });
  });

  // 测试布尔值比较
  describe('布尔值比较测试', () => {
    test('应该能比较布尔值相等', () => {
      blackboard.defineVariable('gameStarted', BlackboardValueType.Boolean, true);
      
      const condition = new BlackboardValueComparison<BlackboardTestContext>(
        'gameStarted', 
        CompareOperator.Equal, 
        true
      );
      
      const result = condition.update(context);
      expect(result).toBe(TaskStatus.Success);
    });

    test('应该能比较布尔值不相等', () => {
      blackboard.defineVariable('isPaused', BlackboardValueType.Boolean, false);
      
      const condition = new BlackboardValueComparison<BlackboardTestContext>(
        'isPaused', 
        CompareOperator.NotEqual, 
        true
      );
      
      const result = condition.update(context);
      expect(result).toBe(TaskStatus.Success);
    });
  });

  // 测试性能
  describe('性能测试', () => {
    test('大量比较操作应该高效执行', () => {
      blackboard.defineVariable('counter', BlackboardValueType.Number, 500);
      
      const condition = new BlackboardValueComparison<BlackboardTestContext>(
        'counter', 
        CompareOperator.Greater, 
        100
      );
      
      const startTime = performance.now();
      const iterations = 1000;
      
      for (let i = 0; i < iterations; i++) {
        condition.update(context);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // 应该在100ms内完成
    });
  });

  // 测试实际使用场景
  describe('实际使用场景测试', () => {
    test('检查玩家生命值是否足够', () => {
      blackboard.defineVariable('playerHealth', BlackboardValueType.Number, 75);
      
      const healthCheck = new BlackboardValueComparison<BlackboardTestContext>(
        'playerHealth', 
        CompareOperator.Greater, 
        50
      );
      
      const result = healthCheck.update(context);
      expect(result).toBe(TaskStatus.Success);
    });

    test('检查弹药是否充足', () => {
      blackboard.defineVariable('ammoCount', BlackboardValueType.Number, 5);
      
      const ammoCheck = new BlackboardValueComparison<BlackboardTestContext>(
        'ammoCount', 
        CompareOperator.GreaterOrEqual, 
        10
      );
      
      const result = ammoCheck.update(context);
      expect(result).toBe(TaskStatus.Failure); // 弹药不足
    });

    test('检查游戏状态', () => {
      blackboard.defineVariable('gameState', BlackboardValueType.String, 'playing');
      
      const stateCheck = new BlackboardValueComparison<BlackboardTestContext>(
        'gameState', 
        CompareOperator.Equal, 
        'playing'
      );
      
      const result = stateCheck.update(context);
      expect(result).toBe(TaskStatus.Success);
    });

    test('比较玩家和敌人属性', () => {
      blackboard.defineVariable('playerSpeed', BlackboardValueType.Number, 10);
      blackboard.defineVariable('enemySpeed', BlackboardValueType.Number, 8);
      
      const speedComparison = new BlackboardValueComparison<BlackboardTestContext>(
        'playerSpeed', 
        CompareOperator.Greater, 
        null,
        'enemySpeed'
      );
      
      const result = speedComparison.update(context);
      expect(result).toBe(TaskStatus.Success); // 玩家更快
    });

    test('检查任务完成条件', () => {
      blackboard.defineVariable('killCount', BlackboardValueType.Number, 10);
      blackboard.defineVariable('requiredKills', BlackboardValueType.Number, 10);
      
      const questCheck = new BlackboardValueComparison<BlackboardTestContext>(
        'killCount', 
        CompareOperator.GreaterOrEqual, 
        null,
        'requiredKills'
      );
      
      const result = questCheck.update(context);
      expect(result).toBe(TaskStatus.Success); // 任务完成
    });

    test('检查物品名称匹配', () => {
      blackboard.defineVariable('currentItem', BlackboardValueType.String, 'Health Potion');
      
      const itemCheck = new BlackboardValueComparison<BlackboardTestContext>(
        'currentItem', 
        CompareOperator.Contains, 
        'Potion'
      );
      
      const result = itemCheck.update(context);
      expect(result).toBe(TaskStatus.Success);
    });

    test('检查权限标志', () => {
      blackboard.defineVariable('hasPermission', BlackboardValueType.Boolean, true);
      blackboard.defineVariable('isAdmin', BlackboardValueType.Boolean, false);
      
      const permissionCheck = new BlackboardValueComparison<BlackboardTestContext>(
        'hasPermission', 
        CompareOperator.Equal, 
        true
      );
      
      const adminCheck = new BlackboardValueComparison<BlackboardTestContext>(
        'isAdmin', 
        CompareOperator.Equal, 
        true
      );
      
      expect(permissionCheck.update(context)).toBe(TaskStatus.Success);
      expect(adminCheck.update(context)).toBe(TaskStatus.Failure);
    });
  });

  // 测试边界情况
  describe('边界情况测试', () => {
    test('应该能处理零值比较', () => {
      blackboard.defineVariable('zeroVar', BlackboardValueType.Number, 0);
      
      const condition = new BlackboardValueComparison<BlackboardTestContext>(
        'zeroVar', 
        CompareOperator.Equal, 
        0
      );
      
      const result = condition.update(context);
      expect(result).toBe(TaskStatus.Success);
    });

    test('应该能处理负数比较', () => {
      blackboard.defineVariable('negativeVar', BlackboardValueType.Number, -5);
      
      const condition = new BlackboardValueComparison<BlackboardTestContext>(
        'negativeVar', 
        CompareOperator.Less, 
        0
      );
      
      const result = condition.update(context);
      expect(result).toBe(TaskStatus.Success);
    });

    test('应该能处理空字符串比较', () => {
      blackboard.defineVariable('emptyString', BlackboardValueType.String, '');
      
      const condition = new BlackboardValueComparison<BlackboardTestContext>(
        'emptyString', 
        CompareOperator.Equal, 
        ''
      );
      
      const result = condition.update(context);
      expect(result).toBe(TaskStatus.Success);
    });

    test('应该能处理对象值比较', () => {
      const testObject = { x: 10, y: 20 };
      blackboard.defineVariable('objectVar', BlackboardValueType.Object, testObject);

      // 对象比较通常会失败，因为引用不同
      const condition = new BlackboardValueComparison<BlackboardTestContext>(
        'objectVar',
        CompareOperator.Equal,
        { x: 10, y: 20 } // 不同的对象引用
      );

      const result = condition.update(context);
      expect(result).toBe(TaskStatus.Failure); // 对象引用比较失败
    });
  });
});
