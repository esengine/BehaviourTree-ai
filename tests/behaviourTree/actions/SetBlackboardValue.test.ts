/**
 * SetBlackboardValue 动作节点测试
 * 
 * 测试设置黑板变量值的行为
 */
import { SetBlackboardValue } from '../../../behaviourTree/actions/BlackboardActions';
import { TaskStatus } from '../../../behaviourTree/TaskStatus';
import { Blackboard, BlackboardValueType } from '../../../behaviourTree/Blackboard';
import { TestUtils, TestContext } from '../../utils/TestUtils';

// 扩展测试上下文以支持黑板
interface BlackboardTestContext extends TestContext {
  blackboard: Blackboard;
}

describe('SetBlackboardValue 动作节点测试', () => {
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
    test('应该能创建SetBlackboardValue实例', () => {
      const action = new SetBlackboardValue<BlackboardTestContext>('testVar', 42);
      expect(action).toBeDefined();
      expect(action.status).toBe(TaskStatus.Invalid);
      expect(action.variableName).toBe('testVar');
      expect(action.value).toBe(42);
    });

    test('应该能设置固定值到黑板变量', () => {
      // 定义变量
      blackboard.defineVariable('playerHealth', BlackboardValueType.Number, 100);
      
      const action = new SetBlackboardValue<BlackboardTestContext>('playerHealth', 75);
      
      const result = action.tick(context);
      
      expect(result).toBe(TaskStatus.Success);
      expect(blackboard.getValue('playerHealth')).toBe(75);
    });

    test('应该能从另一个黑板变量复制值', () => {
      // 定义变量
      blackboard.defineVariable('sourceHealth', BlackboardValueType.Number, 80);
      blackboard.defineVariable('targetHealth', BlackboardValueType.Number, 100);
      
      const action = new SetBlackboardValue<BlackboardTestContext>(
        'targetHealth', 
        null, 
        'sourceHealth'
      );
      
      const result = action.tick(context);
      
      expect(result).toBe(TaskStatus.Success);
      expect(blackboard.getValue('targetHealth')).toBe(80);
    });

    test('应该能设置不同类型的值', () => {
      // 定义不同类型的变量
      blackboard.defineVariable('stringVar', BlackboardValueType.String, 'default');
      blackboard.defineVariable('boolVar', BlackboardValueType.Boolean, false);
      blackboard.defineVariable('numberVar', BlackboardValueType.Number, 0);
      
      // 测试字符串
      let action = new SetBlackboardValue<BlackboardTestContext>('stringVar', 'hello');
      let result = action.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(blackboard.getValue('stringVar')).toBe('hello');
      
      // 测试布尔值
      action = new SetBlackboardValue<BlackboardTestContext>('boolVar', true);
      result = action.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(blackboard.getValue('boolVar')).toBe(true);
      
      // 测试数字
      action = new SetBlackboardValue<BlackboardTestContext>('numberVar', 42);
      result = action.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(blackboard.getValue('numberVar')).toBe(42);
    });
  });

  // 测试错误处理
  describe('错误处理测试', () => {
    test('没有黑板时应该返回失败', () => {
      const contextWithoutBlackboard = TestUtils.createTestContext();
      const action = new SetBlackboardValue<TestContext>('testVar', 42);
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = action.tick(contextWithoutBlackboard);
      
      expect(result).toBe(TaskStatus.Failure);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('尝试设置不存在的黑板变量')
      );
      
      consoleSpy.mockRestore();
    });

    test('目标变量不存在时应该返回失败', () => {
      const action = new SetBlackboardValue<BlackboardTestContext>('nonExistentVar', 42);
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = action.tick(context);
      
      expect(result).toBe(TaskStatus.Failure);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('尝试设置不存在的黑板变量 "nonExistentVar"')
      );
      
      consoleSpy.mockRestore();
    });

    test('源变量不存在时应该返回失败', () => {
      blackboard.defineVariable('targetVar', BlackboardValueType.Number, 0);
      
      const action = new SetBlackboardValue<BlackboardTestContext>(
        'targetVar', 
        null, 
        'nonExistentSource'
      );
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = action.tick(context);
      
      expect(result).toBe(TaskStatus.Failure);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('源变量 "nonExistentSource" 不存在')
      );
      
      consoleSpy.mockRestore();
    });

    test('设置只读变量时应该返回失败', () => {
      blackboard.defineVariable('readOnlyVar', BlackboardValueType.Number, 100, {
        readonly: true
      });
      
      const action = new SetBlackboardValue<BlackboardTestContext>('readOnlyVar', 50);
      
      const result = action.tick(context);
      
      expect(result).toBe(TaskStatus.Failure);
      expect(blackboard.getValue('readOnlyVar')).toBe(100); // 值不应该改变
    });

    test('强制设置只读变量应该成功', () => {
      blackboard.defineVariable('readOnlyVar', BlackboardValueType.Number, 100, {
        readonly: true
      });
      
      const action = new SetBlackboardValue<BlackboardTestContext>(
        'readOnlyVar', 
        50, 
        undefined, 
        true // force = true
      );
      
      const result = action.tick(context);
      
      expect(result).toBe(TaskStatus.Success);
      expect(blackboard.getValue('readOnlyVar')).toBe(50);
    });
  });

  // 测试状态管理
  describe('状态管理测试', () => {
    test('多次执行应该更新状态', () => {
      blackboard.defineVariable('counter', BlackboardValueType.Number, 0);
      
      const action = new SetBlackboardValue<BlackboardTestContext>('counter', 1);
      
      // 第一次执行
      let result = action.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(action.status).toBe(TaskStatus.Success);
      expect(blackboard.getValue('counter')).toBe(1);
      
      // 修改值并再次执行
      action.value = 2;
      result = action.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(blackboard.getValue('counter')).toBe(2);
    });

    test('invalidate应该重置状态', () => {
      blackboard.defineVariable('testVar', BlackboardValueType.Number, 0);
      
      const action = new SetBlackboardValue<BlackboardTestContext>('testVar', 42);
      
      // 执行一次
      action.tick(context);
      expect(action.status).toBe(TaskStatus.Success);
      
      // 重置状态
      action.invalidate();
      expect(action.status).toBe(TaskStatus.Invalid);
    });
  });

  // 测试动态配置
  describe('动态配置测试', () => {
    test('应该能动态修改目标变量名', () => {
      blackboard.defineVariable('var1', BlackboardValueType.Number, 0);
      blackboard.defineVariable('var2', BlackboardValueType.Number, 0);
      
      const action = new SetBlackboardValue<BlackboardTestContext>('var1', 10);
      
      // 设置第一个变量
      action.tick(context);
      expect(blackboard.getValue('var1')).toBe(10);
      expect(blackboard.getValue('var2')).toBe(0);
      
      // 修改目标变量
      action.variableName = 'var2';
      action.value = 20;
      action.tick(context);
      expect(blackboard.getValue('var1')).toBe(10);
      expect(blackboard.getValue('var2')).toBe(20);
    });

    test('应该能在固定值和源变量之间切换', () => {
      blackboard.defineVariable('source', BlackboardValueType.Number, 100);
      blackboard.defineVariable('target', BlackboardValueType.Number, 0);
      
      const action = new SetBlackboardValue<BlackboardTestContext>('target', 50);
      
      // 使用固定值
      action.tick(context);
      expect(blackboard.getValue('target')).toBe(50);
      
      // 切换到源变量
      action.value = null;
      action.sourceVariable = 'source';
      action.tick(context);
      expect(blackboard.getValue('target')).toBe(100);
      
      // 切换回固定值
      action.value = 75;
      action.sourceVariable = undefined;
      action.tick(context);
      expect(blackboard.getValue('target')).toBe(75);
    });
  });

  // 测试性能
  describe('性能测试', () => {
    test('大量设置操作应该高效执行', () => {
      blackboard.defineVariable('perfVar', BlackboardValueType.Number, 0);
      
      const action = new SetBlackboardValue<BlackboardTestContext>('perfVar', 0);
      
      const startTime = performance.now();
      const iterations = 1000;
      
      for (let i = 0; i < iterations; i++) {
        action.value = i;
        action.tick(context);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // 应该在100ms内完成
      expect(blackboard.getValue('perfVar')).toBe(iterations - 1);
    });
  });

  // 测试实际使用场景
  describe('实际使用场景测试', () => {
    test('设置玩家状态', () => {
      blackboard.defineVariable('playerHealth', BlackboardValueType.Number, 100);
      blackboard.defineVariable('playerMana', BlackboardValueType.Number, 50);
      
      const setHealth = new SetBlackboardValue<BlackboardTestContext>('playerHealth', 80);
      const setMana = new SetBlackboardValue<BlackboardTestContext>('playerMana', 30);
      
      setHealth.tick(context);
      setMana.tick(context);
      
      expect(blackboard.getValue('playerHealth')).toBe(80);
      expect(blackboard.getValue('playerMana')).toBe(30);
    });

    test('复制敌人属性到玩家', () => {
      blackboard.defineVariable('enemyDamage', BlackboardValueType.Number, 25);
      blackboard.defineVariable('playerDamage', BlackboardValueType.Number, 20);
      
      const copyDamage = new SetBlackboardValue<BlackboardTestContext>(
        'playerDamage', 
        null, 
        'enemyDamage'
      );
      
      copyDamage.tick(context);
      
      expect(blackboard.getValue('playerDamage')).toBe(25);
    });

    test('设置游戏状态标志', () => {
      blackboard.defineVariable('gameStarted', BlackboardValueType.Boolean, false);
      blackboard.defineVariable('currentLevel', BlackboardValueType.String, 'menu');
      
      const startGame = new SetBlackboardValue<BlackboardTestContext>('gameStarted', true);
      const setLevel = new SetBlackboardValue<BlackboardTestContext>('currentLevel', 'level1');
      
      startGame.tick(context);
      setLevel.tick(context);
      
      expect(blackboard.getValue('gameStarted')).toBe(true);
      expect(blackboard.getValue('currentLevel')).toBe('level1');
    });

    test('更新计数器', () => {
      blackboard.defineVariable('killCount', BlackboardValueType.Number, 0);
      blackboard.defineVariable('score', BlackboardValueType.Number, 0);
      
      const updateKills = new SetBlackboardValue<BlackboardTestContext>('killCount', 1);
      const updateScore = new SetBlackboardValue<BlackboardTestContext>('score', 100);
      
      // 模拟多次击杀
      for (let i = 1; i <= 5; i++) {
        updateKills.value = i;
        updateScore.value = i * 100;
        
        updateKills.tick(context);
        updateScore.tick(context);
      }
      
      expect(blackboard.getValue('killCount')).toBe(5);
      expect(blackboard.getValue('score')).toBe(500);
    });

    test('设置复杂对象数据', () => {
      blackboard.defineVariable('playerPosition', BlackboardValueType.Object, { x: 0, y: 0 });
      blackboard.defineVariable('inventory', BlackboardValueType.Array, []);
      
      const setPosition = new SetBlackboardValue<BlackboardTestContext>(
        'playerPosition', 
        { x: 10, y: 20 }
      );
      const setInventory = new SetBlackboardValue<BlackboardTestContext>(
        'inventory', 
        ['sword', 'potion', 'key']
      );
      
      setPosition.tick(context);
      setInventory.tick(context);
      
      expect(blackboard.getValue('playerPosition')).toEqual({ x: 10, y: 20 });
      expect(blackboard.getValue('inventory')).toEqual(['sword', 'potion', 'key']);
    });
  });
});
