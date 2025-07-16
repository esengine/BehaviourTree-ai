/**
 * RandomProbability 条件节点最小测试
 * 
 * 测试随机概率条件的最基本功能
 */
import { RandomProbability } from '../../../behaviourTree/conditionals/RandomProbability';
import { TaskStatus } from '../../../behaviourTree/TaskStatus';
import { TestUtils, TestContext } from '../../utils/TestUtils';

describe('RandomProbability 条件节点最小测试', () => {
  let context: TestContext;

  beforeEach(() => {
    context = TestUtils.createTestContext();
  });

  // 测试基本功能
  describe('基本功能测试', () => {
    test('应该能创建RandomProbability实例', () => {
      const randomCondition = new RandomProbability<TestContext>(0.5);
      expect(randomCondition).toBeDefined();
      expect(randomCondition.status).toBe(TaskStatus.Invalid);
      expect(randomCondition.discriminator).toBe('IConditional');
    });

    test('概率为0时应该总是返回成功（实现逻辑）', () => {
      const randomCondition = new RandomProbability<TestContext>(0);

      const result = randomCondition.tick(context);
      expect(result).toBe(TaskStatus.Success);
    });

    test('概率为1时应该总是返回失败（实现逻辑）', () => {
      const randomCondition = new RandomProbability<TestContext>(1);

      const result = randomCondition.tick(context);
      expect(result).toBe(TaskStatus.Failure);
    });

    test('应该只返回Success或Failure状态', () => {
      const randomCondition = new RandomProbability<TestContext>(0.5);

      const result = randomCondition.tick(context);
      expect([TaskStatus.Success, TaskStatus.Failure]).toContain(result);
      expect(result).not.toBe(TaskStatus.Running);
      expect(result).not.toBe(TaskStatus.Invalid);
    });
  });

  // 测试边界情况
  describe('边界情况测试', () => {
    test('应该能处理负数概率', () => {
      const randomCondition = new RandomProbability<TestContext>(-0.5);

      const result = randomCondition.tick(context);
      expect(result).toBe(TaskStatus.Success); // Math.random() > -0.5 总是为真
    });

    test('应该能处理大于1的概率', () => {
      const randomCondition = new RandomProbability<TestContext>(1.5);

      const result = randomCondition.tick(context);
      expect(result).toBe(TaskStatus.Failure); // Math.random() > 1.5 总是为假
    });

    test('应该能处理null上下文', () => {
      const randomCondition = new RandomProbability<TestContext>(0.5);

      const result = randomCondition.tick(null as any);
      expect([TaskStatus.Success, TaskStatus.Failure]).toContain(result);
    });
  });

  // 测试状态管理
  describe('状态管理测试', () => {
    test('invalidate应该重置状态', () => {
      const randomCondition = new RandomProbability<TestContext>(1);

      randomCondition.tick(context);
      expect(randomCondition.status).toBe(TaskStatus.Failure);

      randomCondition.invalidate();
      expect(randomCondition.status).toBe(TaskStatus.Invalid);
    });

    test('相同状态下再次tick应该保持结果', () => {
      const randomCondition = new RandomProbability<TestContext>(1);

      const result1 = randomCondition.tick(context);
      expect(result1).toBe(TaskStatus.Failure);

      const result2 = randomCondition.tick(context);
      expect(result2).toBe(TaskStatus.Failure);
    });
  });

  // 测试性能
  describe('性能测试', () => {
    test('大量随机检查应该高效执行', () => {
      const randomCondition = new RandomProbability<TestContext>(0.5);
      
      const startTime = performance.now();
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        randomCondition.invalidate();
        randomCondition.tick(context);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(200); // 应该在200ms内完成
    });
  });

  // 测试实际使用场景
  describe('实际使用场景测试', () => {
    test('随机攻击暴击判定', () => {
      const criticalHitChance = new RandomProbability<TestContext>(0.2);
      
      const result = criticalHitChance.tick(context);
      expect([TaskStatus.Success, TaskStatus.Failure]).toContain(result);
    });

    test('随机事件触发', () => {
      const normalEventChance = new RandomProbability<TestContext>(0.8);
      
      const result = normalEventChance.tick(context);
      expect([TaskStatus.Success, TaskStatus.Failure]).toContain(result);
    });

    test('AI决策随机性', () => {
      const strategyAChoice = new RandomProbability<TestContext>(0.6);
      
      const result = strategyAChoice.tick(context);
      expect([TaskStatus.Success, TaskStatus.Failure]).toContain(result);
    });
  });

  // 测试不同概率值
  describe('不同概率值测试', () => {
    test('极低概率应该返回有效结果', () => {
      const randomCondition = new RandomProbability<TestContext>(0.01);
      
      const result = randomCondition.tick(context);
      expect([TaskStatus.Success, TaskStatus.Failure]).toContain(result);
    });

    test('极高概率应该返回有效结果', () => {
      const randomCondition = new RandomProbability<TestContext>(0.99);
      
      const result = randomCondition.tick(context);
      expect([TaskStatus.Success, TaskStatus.Failure]).toContain(result);
    });

    test('中等概率应该返回有效结果', () => {
      const randomCondition = new RandomProbability<TestContext>(0.5);
      
      const result = randomCondition.tick(context);
      expect([TaskStatus.Success, TaskStatus.Failure]).toContain(result);
    });
  });

  // 测试随机性基本特征
  describe('随机性基本特征测试', () => {
    test('不同实例应该独立工作', () => {
      const condition1 = new RandomProbability<TestContext>(1);
      const condition2 = new RandomProbability<TestContext>(0);

      const result1 = condition1.tick(context);
      const result2 = condition2.tick(context);

      expect(result1).toBe(TaskStatus.Failure); // 概率为1时返回失败
      expect(result2).toBe(TaskStatus.Success); // 概率为0时返回成功
    });

    test('多次调用应该产生有效结果', () => {
      const randomCondition = new RandomProbability<TestContext>(0.5);
      
      for (let i = 0; i < 3; i++) {
        randomCondition.invalidate();
        const result = randomCondition.tick(context);
        expect([TaskStatus.Success, TaskStatus.Failure]).toContain(result);
      }
    });
  });
});
