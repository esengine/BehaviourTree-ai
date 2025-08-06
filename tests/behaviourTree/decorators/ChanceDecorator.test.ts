/**
 * ChanceDecorator 装饰器测试
 * 
 * 测试概率装饰器的随机性行为
 */
import { ChanceDecorator } from '../../../behaviourTree/decorators/ChanceDecorator';
import { TaskStatus } from '../../../behaviourTree/TaskStatus';
import { TestUtils, TestContext, MockBehavior } from '../../utils/TestUtils';

describe('ChanceDecorator 装饰器测试', () => {
  let context: TestContext;
  let childBehavior: MockBehavior<TestContext>;

  beforeEach(() => {
    context = TestUtils.createTestContext();
    childBehavior = TestUtils.createSuccessBehavior<TestContext>('TestChild');
  });

  // 测试基本功能
  describe('基本功能测试', () => {
    test('应该能创建ChanceDecorator实例', () => {
      const chanceDecorator = new ChanceDecorator<TestContext>(0.5);
      expect(chanceDecorator).toBeDefined();
      expect(chanceDecorator.status).toBe(TaskStatus.Invalid);
    });

    test('构造函数应该限制概率在0-1范围内', () => {
      // 测试边界值
      const chance0 = new ChanceDecorator<TestContext>(0);
      const chance1 = new ChanceDecorator<TestContext>(1);
      expect(chance0).toBeDefined();
      expect(chance1).toBeDefined();
      
      // 测试超出范围的值会被限制
      const chanceNegative = new ChanceDecorator<TestContext>(-0.5);
      const chanceOver1 = new ChanceDecorator<TestContext>(1.5);
      expect(chanceNegative).toBeDefined();
      expect(chanceOver1).toBeDefined();
    });

    test('概率为0时应该总是返回失败', () => {
      const chanceDecorator = new ChanceDecorator<TestContext>(0);
      chanceDecorator.child = childBehavior;
      
      // 多次测试，应该总是失败
      for (let i = 0; i < 10; i++) {
        chanceDecorator.invalidate();
        childBehavior.reset();
        const result = chanceDecorator.tick(context);
        expect(result).toBe(TaskStatus.Failure);
        expect(childBehavior.updateCallCount).toBe(0); // 子节点不应该被执行
      }
    });

    test('概率为1时应该总是执行子节点', () => {
      const chanceDecorator = new ChanceDecorator<TestContext>(1);
      chanceDecorator.child = childBehavior;
      
      // 多次测试，应该总是执行子节点
      for (let i = 0; i < 10; i++) {
        chanceDecorator.invalidate();
        childBehavior.reset();
        const result = chanceDecorator.tick(context);
        expect(result).toBe(TaskStatus.Success);
        expect(childBehavior.updateCallCount).toBe(1); // 子节点应该被执行
      }
    });

    test('子节点返回不同状态时应该正确传递', () => {
      const chanceDecorator = new ChanceDecorator<TestContext>(1); // 100%概率
      chanceDecorator.child = childBehavior;
      
      // 测试成功状态
      childBehavior.setReturnStatus(TaskStatus.Success);
      let result = chanceDecorator.tick(context);
      expect(result).toBe(TaskStatus.Success);
      
      // 重置并测试失败状态
      chanceDecorator.invalidate();
      childBehavior.reset();
      childBehavior.setReturnStatus(TaskStatus.Failure);
      result = chanceDecorator.tick(context);
      expect(result).toBe(TaskStatus.Failure);
      
      // 重置并测试运行中状态
      chanceDecorator.invalidate();
      childBehavior.reset();
      childBehavior.setReturnStatus(TaskStatus.Running);
      result = chanceDecorator.tick(context);
      expect(result).toBe(TaskStatus.Running);
    });
  });

  // 测试概率分布
  describe('概率分布测试', () => {
    test('50%概率应该大致有一半成功', () => {
      const chanceDecorator = new ChanceDecorator<TestContext>(0.5);
      chanceDecorator.child = childBehavior;
      
      let successCount = 0;
      let failureCount = 0;
      const iterations = 1000;
      
      for (let i = 0; i < iterations; i++) {
        chanceDecorator.invalidate();
        childBehavior.reset();
        const result = chanceDecorator.tick(context);
        
        if (result === TaskStatus.Success) {
          successCount++;
        } else if (result === TaskStatus.Failure) {
          failureCount++;
        }
      }
      
      // 允许一定的误差范围（±10%）
      const expectedSuccess = iterations * 0.5;
      const tolerance = iterations * 0.1;
      
      expect(successCount).toBeGreaterThan(expectedSuccess - tolerance);
      expect(successCount).toBeLessThan(expectedSuccess + tolerance);
      expect(successCount + failureCount).toBe(iterations);
    });

    test('25%概率应该大致有四分之一成功', () => {
      const chanceDecorator = new ChanceDecorator<TestContext>(0.25);
      chanceDecorator.child = childBehavior;
      
      let successCount = 0;
      const iterations = 1000;
      
      for (let i = 0; i < iterations; i++) {
        chanceDecorator.invalidate();
        childBehavior.reset();
        const result = chanceDecorator.tick(context);
        
        if (result === TaskStatus.Success) {
          successCount++;
        }
      }
      
      // 允许一定的误差范围（±8%）
      const expectedSuccess = iterations * 0.25;
      const tolerance = iterations * 0.08;
      
      expect(successCount).toBeGreaterThan(expectedSuccess - tolerance);
      expect(successCount).toBeLessThan(expectedSuccess + tolerance);
    });

    test('75%概率应该大致有四分之三成功', () => {
      const chanceDecorator = new ChanceDecorator<TestContext>(0.75);
      chanceDecorator.child = childBehavior;
      
      let successCount = 0;
      const iterations = 1000;
      
      for (let i = 0; i < iterations; i++) {
        chanceDecorator.invalidate();
        childBehavior.reset();
        const result = chanceDecorator.tick(context);
        
        if (result === TaskStatus.Success) {
          successCount++;
        }
      }
      
      // 允许一定的误差范围（±8%）
      const expectedSuccess = iterations * 0.75;
      const tolerance = iterations * 0.08;
      
      expect(successCount).toBeGreaterThan(expectedSuccess - tolerance);
      expect(successCount).toBeLessThan(expectedSuccess + tolerance);
    });
  });

  // 测试边界情况
  describe('边界情况测试', () => {
    test('没有子节点时应该返回成功（概率通过时）', () => {
      const chanceDecorator = new ChanceDecorator<TestContext>(1); // 100%概率
      
      const result = chanceDecorator.tick(context);
      
      expect(result).toBe(TaskStatus.Success);
    });

    test('没有子节点时应该返回失败（概率不通过时）', () => {
      const chanceDecorator = new ChanceDecorator<TestContext>(0); // 0%概率
      
      const result = chanceDecorator.tick(context);
      
      expect(result).toBe(TaskStatus.Failure);
    });

    test('子节点为null时应该能处理', () => {
      const chanceDecorator = new ChanceDecorator<TestContext>(1);
      chanceDecorator.child = null as any;
      
      const result = chanceDecorator.tick(context);
      
      expect(result).toBe(TaskStatus.Success);
    });

    test('极小概率值应该能正确处理', () => {
      const chanceDecorator = new ChanceDecorator<TestContext>(0.001);
      chanceDecorator.child = childBehavior;
      
      let successCount = 0;
      const iterations = 10000;
      
      for (let i = 0; i < iterations; i++) {
        chanceDecorator.invalidate();
        childBehavior.reset();
        const result = chanceDecorator.tick(context);
        
        if (result === TaskStatus.Success) {
          successCount++;
        }
      }
      
      // 期望大约10次成功，允许较大误差范围
      expect(successCount).toBeGreaterThan(0);
      expect(successCount).toBeLessThan(50); // 应该很少成功
    });
  });

  // 测试生命周期
  describe('生命周期测试', () => {
    test('概率通过时应该调用子节点的生命周期方法', () => {
      const chanceDecorator = new ChanceDecorator<TestContext>(1); // 100%概率
      const mockChild = TestUtils.createMockBehavior<TestContext>(TaskStatus.Success, 'MockChild');
      chanceDecorator.child = mockChild;
      
      // 执行
      chanceDecorator.tick(context);
      
      // 验证子节点被调用
      expect(mockChild.updateCallCount).toBe(1);
    });

    test('概率不通过时不应该调用子节点', () => {
      const chanceDecorator = new ChanceDecorator<TestContext>(0); // 0%概率
      const mockChild = TestUtils.createMockBehavior<TestContext>(TaskStatus.Success, 'MockChild');
      chanceDecorator.child = mockChild;
      
      // 执行
      chanceDecorator.tick(context);
      
      // 验证子节点没有被调用
      expect(mockChild.updateCallCount).toBe(0);
    });

    test('invalidate应该传播到子节点', () => {
      const chanceDecorator = new ChanceDecorator<TestContext>(1);
      const mockChild = TestUtils.createMockBehavior<TestContext>(TaskStatus.Running, 'MockChild');
      chanceDecorator.child = mockChild;
      
      // 执行一次
      chanceDecorator.tick(context);
      expect(mockChild.status).toBe(TaskStatus.Running);
      
      // invalidate应该传播
      chanceDecorator.invalidate();
      expect(chanceDecorator.status).toBe(TaskStatus.Invalid);
      expect(mockChild.status).toBe(TaskStatus.Invalid);
    });
  });

  // 测试性能
  describe('性能测试', () => {
    test('大量概率检查应该高效执行', () => {
      const chanceDecorator = new ChanceDecorator<TestContext>(0.5);
      chanceDecorator.child = childBehavior;
      
      const startTime = performance.now();
      const iterations = 10000;
      
      for (let i = 0; i < iterations; i++) {
        chanceDecorator.invalidate();
        childBehavior.reset();
        chanceDecorator.tick(context);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000); // 应该在1000ms内完成
    });
  });

  // 测试错误处理
  describe('错误处理测试', () => {
    test('子节点抛出异常时应该能处理', () => {
      const chanceDecorator = new ChanceDecorator<TestContext>(1); // 100%概率
      const errorChild = TestUtils.createMockBehavior<TestContext>(TaskStatus.Success, 'ErrorChild');
      errorChild.update = () => {
        throw new Error('子节点执行错误');
      };
      chanceDecorator.child = errorChild;
      
      expect(() => {
        chanceDecorator.tick(context);
      }).toThrow('子节点执行错误');
    });

    test('上下文为null时应该能处理', () => {
      const chanceDecorator = new ChanceDecorator<TestContext>(1);
      chanceDecorator.child = childBehavior;
      
      const result = chanceDecorator.tick(null as any);
      
      expect(result).toBe(TaskStatus.Success);
      expect(childBehavior.updateCallCount).toBe(1);
    });
  });

  // 测试实际使用场景
  describe('实际使用场景测试', () => {
    test('随机攻击暴击', () => {
      // 20%概率触发暴击攻击
      const criticalHitChance = new ChanceDecorator<TestContext>(0.2);
      const criticalAttack = TestUtils.createMockBehavior<TestContext>(TaskStatus.Success, 'CriticalAttack');
      criticalHitChance.child = criticalAttack;
      
      let criticalHits = 0;
      const attacks = 100;
      
      for (let i = 0; i < attacks; i++) {
        criticalHitChance.invalidate();
        criticalAttack.reset();
        const result = criticalHitChance.tick(context);
        
        if (result === TaskStatus.Success) {
          criticalHits++;
        }
      }
      
      // 期望大约20次暴击，允许误差
      expect(criticalHits).toBeGreaterThan(10);
      expect(criticalHits).toBeLessThan(35);
    });

    test('随机事件触发', () => {
      // 10%概率触发特殊事件
      const eventChance = new ChanceDecorator<TestContext>(0.1);
      const specialEvent = TestUtils.createMockBehavior<TestContext>(TaskStatus.Success, 'SpecialEvent');
      eventChance.child = specialEvent;
      
      let eventTriggered = 0;
      const iterations = 1000;
      
      for (let i = 0; i < iterations; i++) {
        eventChance.invalidate();
        specialEvent.reset();
        const result = eventChance.tick(context);
        
        if (result === TaskStatus.Success) {
          eventTriggered++;
        }
      }
      
      // 期望大约100次事件触发，允许误差
      expect(eventTriggered).toBeGreaterThan(70);
      expect(eventTriggered).toBeLessThan(130);
    });

    test('随机决策分支', () => {
      // 30%概率选择激进策略
      const aggressiveChance = new ChanceDecorator<TestContext>(0.3);
      const aggressiveStrategy = TestUtils.createMockBehavior<TestContext>(TaskStatus.Success, 'AggressiveStrategy');
      aggressiveChance.child = aggressiveStrategy;
      
      let aggressiveChoices = 0;
      const decisions = 500;
      
      for (let i = 0; i < decisions; i++) {
        aggressiveChance.invalidate();
        aggressiveStrategy.reset();
        const result = aggressiveChance.tick(context);
        
        if (result === TaskStatus.Success) {
          aggressiveChoices++;
        }
      }
      
      // 期望大约150次激进选择，允许误差
      expect(aggressiveChoices).toBeGreaterThan(120);
      expect(aggressiveChoices).toBeLessThan(180);
    });

    test('技能冷却随机减少', () => {
      // 25%概率减少技能冷却时间
      const cooldownReduction = new ChanceDecorator<TestContext>(0.25);
      const reduceCooldown = TestUtils.createMockBehavior<TestContext>(TaskStatus.Success, 'ReduceCooldown');
      cooldownReduction.child = reduceCooldown;
      
      let reductions = 0;
      const skillUses = 200;
      
      for (let i = 0; i < skillUses; i++) {
        cooldownReduction.invalidate();
        reduceCooldown.reset();
        const result = cooldownReduction.tick(context);
        
        if (result === TaskStatus.Success) {
          reductions++;
        }
      }
      
      // 期望大约50次冷却减少，允许更大的随机误差
      expect(reductions).toBeGreaterThan(30); // 放宽下限
      expect(reductions).toBeLessThan(70); // 放宽上限
    });
  });
});
