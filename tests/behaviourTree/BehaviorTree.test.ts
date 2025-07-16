/**
 * BehaviorTree 类测试
 * 
 * 测试行为树控制器的执行和管理功能
 */
import { BehaviorTree } from '../../behaviourTree/BehaviorTree';
import { Behavior } from '../../behaviourTree/Behavior';
import { TaskStatus } from '../../behaviourTree/TaskStatus';
import { TestUtils, TestContext, MockBehavior } from '../utils/TestUtils';

describe('BehaviorTree 类测试', () => {
  let context: TestContext;
  let rootBehavior: MockBehavior<TestContext>;
  let behaviorTree: BehaviorTree<TestContext>;

  beforeEach(() => {
    context = TestUtils.createTestContext();
    rootBehavior = TestUtils.createSuccessBehavior<TestContext>('RootBehavior');
    // 设置更新周期为0，确保每次tick都会执行
    behaviorTree = new BehaviorTree(context, rootBehavior, 0);
  });

  // 测试构造函数
  describe('构造函数测试', () => {
    test('应该能创建行为树实例', () => {
      expect(behaviorTree).toBeDefined();
      expect(behaviorTree.updatePeriod).toBe(0); // 我们在beforeEach中设置为0
    });

    test('应该能设置自定义更新周期', () => {
      const customTree = new BehaviorTree(context, rootBehavior, 0.1);
      expect(customTree.updatePeriod).toBe(0.1);
    });

    test('设置负数更新周期应该抛出错误', () => {
      expect(() => {
        new BehaviorTree(context, rootBehavior, -1);
      }).toThrow('更新周期不能为负数');
    });
  });

  // 测试tick方法
  describe('tick方法测试', () => {
    test('调用tick应该执行根节点', () => {
      behaviorTree.tick();
      
      expect(rootBehavior.updateCallCount).toBe(1);
      expect(rootBehavior.lastContext).toBe(context);
    });

    test('多次调用tick应该多次执行根节点', () => {
      behaviorTree.tick();
      behaviorTree.tick();
      behaviorTree.tick();
      
      expect(rootBehavior.updateCallCount).toBe(3);
    });

    test('根节点返回Success时应该正常结束', () => {
      rootBehavior.setReturnStatus(TaskStatus.Success);
      
      behaviorTree.tick();
      
      expect(rootBehavior.status).toBe(TaskStatus.Success);
      expect(rootBehavior.updateCallCount).toBe(1);
    });

    test('根节点返回Failure时应该正常结束', () => {
      rootBehavior.setReturnStatus(TaskStatus.Failure);
      
      behaviorTree.tick();
      
      expect(rootBehavior.status).toBe(TaskStatus.Failure);
      expect(rootBehavior.updateCallCount).toBe(1);
    });

    test('根节点返回Running时应该继续执行', () => {
      rootBehavior.setReturnStatus(TaskStatus.Running);
      
      behaviorTree.tick();
      behaviorTree.tick();
      
      expect(rootBehavior.status).toBe(TaskStatus.Running);
      expect(rootBehavior.updateCallCount).toBe(2);
    });
  });

  // 测试更新周期控制
  describe('更新周期控制测试', () => {
    test('设置更新周期为0应该每次都更新', () => {
      behaviorTree.updatePeriod = 0;
      
      behaviorTree.tick();
      behaviorTree.tick();
      behaviorTree.tick();
      
      expect(rootBehavior.updateCallCount).toBe(3);
    });

    test('设置0更新周期应该每次都更新', () => {
      behaviorTree.updatePeriod = 0;

      behaviorTree.tick();
      behaviorTree.tick();
      behaviorTree.tick();

      expect(rootBehavior.updateCallCount).toBe(3);
    });

    // 注意：时间相关的测试可能需要模拟时间或使用真实延迟
    test('应该能设置更新周期', () => {
      // 创建一个新的行为树，更新周期为0.05秒（50ms）
      const testBehavior = TestUtils.createSuccessBehavior<TestContext>('TestBehavior');
      const testTree = new BehaviorTree(context, testBehavior, 0.05); // 50ms

      // 验证更新周期设置正确
      expect(testTree.updatePeriod).toBe(0.05);

      // 修改更新周期
      testTree.updatePeriod = 0.1;
      expect(testTree.updatePeriod).toBe(0.1);
    });
  });

  // 测试上下文传递
  describe('上下文传递测试', () => {
    test('应该将正确的上下文传递给根节点', () => {
      const customContext = TestUtils.createTestContext();
      customContext.testValue = 42;

      const customTree = new BehaviorTree(customContext, rootBehavior, 0);
      customTree.tick();

      expect(rootBehavior.lastContext).toBe(customContext);
      expect(rootBehavior.lastContext?.testValue).toBe(42);
    });

    test('修改上下文应该影响后续执行', () => {
      behaviorTree.tick();
      expect(rootBehavior.lastContext?.testValue).toBe(0);
      
      // 修改上下文
      context.testValue = 100;
      
      behaviorTree.tick();
      expect(rootBehavior.lastContext?.testValue).toBe(100);
    });
  });

  // 测试错误处理
  describe('错误处理测试', () => {
    test('根节点抛出异常时应该能处理', () => {
      // 创建一个会抛出异常的行为
      class ErrorBehavior extends Behavior<TestContext> {
        update(_context: TestContext): TaskStatus {
          throw new Error('Test error');
        }
      }

      const errorBehavior = new ErrorBehavior();
      const errorTree = new BehaviorTree(context, errorBehavior, 0);

      // 调用tick不应该导致未捕获的异常
      expect(() => {
        errorTree.tick();
      }).not.toThrow();
    });

    test('null上下文应该抛出错误', () => {
      expect(() => {
        new BehaviorTree(null as any, rootBehavior);
      }).toThrow('上下文不能为null或undefined');
    });

    test('null根节点应该抛出错误', () => {
      expect(() => {
        new BehaviorTree(context, null as any);
      }).toThrow('根节点不能为null或undefined');
    });
  });

  // 测试性能相关
  describe('性能测试', () => {
    test('大量tick调用应该在合理时间内完成', () => {
      const startTime = performance.now();
      
      // 执行大量tick
      for (let i = 0; i < 1000; i++) {
        behaviorTree.tick();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 1000次tick应该在100ms内完成（这个阈值可以根据实际情况调整）
      expect(duration).toBeLessThan(100);
    });

    test('复杂行为树应该能正常执行', () => {
      // 创建一个复杂的行为（模拟深层嵌套）
      class ComplexBehavior extends Behavior<TestContext> {
        private counter = 0;

        update(_context: TestContext): TaskStatus {
          this.counter++;

          // 模拟复杂计算
          for (let i = 0; i < 100; i++) {
            Math.random();
          }

          if (this.counter < 10) {
            return TaskStatus.Running;
          }

          return TaskStatus.Success;
        }
      }

      const complexBehavior = new ComplexBehavior();
      const complexTree = new BehaviorTree(context, complexBehavior, 0);

      // 执行直到完成
      let tickCount = 0;
      while (complexBehavior.status !== TaskStatus.Success && tickCount < 20) {
        complexTree.tick();
        tickCount++;
      }

      expect(complexBehavior.status).toBe(TaskStatus.Success);
      expect(tickCount).toBeLessThanOrEqual(10);
    });
  });
});
