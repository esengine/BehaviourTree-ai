/**
 * AlwaysSucceed 装饰器测试
 * 
 * 测试总是成功装饰器的行为：除了Running状态外总是返回Success
 */
import { AlwaysSucceed } from '../../../behaviourTree/decorators/AlwaysSucceed';
import { TaskStatus } from '../../../behaviourTree/TaskStatus';
import { TestUtils, TestContext, MockBehavior } from '../../utils/TestUtils';

describe('AlwaysSucceed 装饰器测试', () => {
  let context: TestContext;
  let alwaysSucceed: AlwaysSucceed<TestContext>;
  let childBehavior: MockBehavior<TestContext>;

  beforeEach(() => {
    context = TestUtils.createTestContext();
    alwaysSucceed = new AlwaysSucceed<TestContext>();
    childBehavior = TestUtils.createSuccessBehavior<TestContext>('TestChild');
    alwaysSucceed.child = childBehavior;
  });

  // 测试基本功能
  describe('基本功能测试', () => {
    test('应该能创建AlwaysSucceed实例', () => {
      expect(alwaysSucceed).toBeDefined();
      expect(alwaysSucceed.status).toBe(TaskStatus.Invalid);
    });

    test('子节点成功时应该返回成功', () => {
      childBehavior.setReturnStatus(TaskStatus.Success);
      
      const result = alwaysSucceed.tick(context);
      
      expect(result).toBe(TaskStatus.Success);
      expect(alwaysSucceed.status).toBe(TaskStatus.Success);
      expect(childBehavior.updateCallCount).toBe(1);
    });

    test('子节点失败时应该返回成功', () => {
      childBehavior.setReturnStatus(TaskStatus.Failure);
      
      const result = alwaysSucceed.tick(context);
      
      expect(result).toBe(TaskStatus.Success);
      expect(alwaysSucceed.status).toBe(TaskStatus.Success);
      expect(childBehavior.updateCallCount).toBe(1);
    });

    test('子节点运行中时应该返回运行中', () => {
      childBehavior.setReturnStatus(TaskStatus.Running);
      
      const result = alwaysSucceed.tick(context);
      
      expect(result).toBe(TaskStatus.Running);
      expect(alwaysSucceed.status).toBe(TaskStatus.Running);
      expect(childBehavior.updateCallCount).toBe(1);
    });

    test('子节点返回Invalid时应该返回成功', () => {
      childBehavior.setReturnStatus(TaskStatus.Invalid);
      
      const result = alwaysSucceed.tick(context);
      
      expect(result).toBe(TaskStatus.Success);
      expect(alwaysSucceed.status).toBe(TaskStatus.Success);
      expect(childBehavior.updateCallCount).toBe(1);
    });
  });

  // 测试状态持续性
  describe('状态持续性测试', () => {
    test('Running状态下再次tick应该继续执行子节点', () => {
      childBehavior.setReturnStatus(TaskStatus.Running);
      
      // 第一次tick
      let result = alwaysSucceed.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(childBehavior.updateCallCount).toBe(1);
      
      // 第二次tick，子节点应该继续执行
      result = alwaysSucceed.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(childBehavior.updateCallCount).toBe(2);
      
      // 子节点完成后，应该返回成功
      childBehavior.setReturnStatus(TaskStatus.Failure);
      result = alwaysSucceed.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(childBehavior.updateCallCount).toBe(3);
    });

    test('invalidate后应该重新开始执行', () => {
      childBehavior.setReturnStatus(TaskStatus.Running);
      
      // 第一次tick
      alwaysSucceed.tick(context);
      expect(childBehavior.updateCallCount).toBe(1);
      
      // invalidate
      alwaysSucceed.invalidate();
      expect(alwaysSucceed.status).toBe(TaskStatus.Invalid);
      expect(childBehavior.status).toBe(TaskStatus.Invalid);
      
      // 再次tick应该重新开始
      const result = alwaysSucceed.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(childBehavior.updateCallCount).toBe(2);
    });
  });

  // 测试边界情况
  describe('边界情况测试', () => {
    test('没有子节点时应该抛出错误', () => {
      const emptyAlwaysSucceed = new AlwaysSucceed<TestContext>();
      
      expect(() => {
        emptyAlwaysSucceed.tick(context);
      }).toThrow('child必须不能为空');
    });

    test('子节点为null时应该抛出错误', () => {
      alwaysSucceed.child = null as any;
      
      expect(() => {
        alwaysSucceed.tick(context);
      }).toThrow('child必须不能为空');
    });

    test('多次状态变化应该始终返回成功或运行中', () => {
      const testCases = [
        { input: TaskStatus.Success, expected: TaskStatus.Success },
        { input: TaskStatus.Failure, expected: TaskStatus.Success },
        { input: TaskStatus.Running, expected: TaskStatus.Running },
        { input: TaskStatus.Invalid, expected: TaskStatus.Success }
      ];
      
      testCases.forEach(({ input, expected }, index) => {
        alwaysSucceed.invalidate();
        childBehavior.reset();
        childBehavior.setReturnStatus(input);
        
        const result = alwaysSucceed.tick(context);
        expect(result).toBe(expected);
      });
    });
  });

  // 测试生命周期
  describe('生命周期测试', () => {
    test('应该正确调用子节点的生命周期方法', () => {
      const mockChild = TestUtils.createMockBehavior<TestContext>(TaskStatus.Success, 'MockChild');
      alwaysSucceed.child = mockChild;
      
      // 第一次tick会调用onStart
      alwaysSucceed.tick(context);
      
      // 验证子节点的update被调用
      expect(mockChild.updateCallCount).toBe(1);
    });

    test('invalidate应该传播到子节点', () => {
      const mockChild = TestUtils.createMockBehavior<TestContext>(TaskStatus.Running, 'MockChild');
      alwaysSucceed.child = mockChild;
      
      // 执行一次
      alwaysSucceed.tick(context);
      expect(mockChild.status).toBe(TaskStatus.Running);
      
      // invalidate应该传播
      alwaysSucceed.invalidate();
      expect(alwaysSucceed.status).toBe(TaskStatus.Invalid);
      expect(mockChild.status).toBe(TaskStatus.Invalid);
    });
  });

  // 测试性能
  describe('性能测试', () => {
    test('大量操作应该高效执行', () => {
      const iterations = 1000;
      childBehavior.setReturnStatus(TaskStatus.Failure);
      
      const startTime = performance.now();
      let totalCalls = 0;
      
      for (let i = 0; i < iterations; i++) {
        alwaysSucceed.invalidate();
        childBehavior.reset();
        const result = alwaysSucceed.tick(context);
        expect(result).toBe(TaskStatus.Success);
        totalCalls += childBehavior.updateCallCount;
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // 应该在100ms内完成
      expect(totalCalls).toBe(iterations);
    });

    test('连续状态变化应该高效处理', () => {
      const statuses = [
        TaskStatus.Success,
        TaskStatus.Failure,
        TaskStatus.Running,
        TaskStatus.Invalid,
        TaskStatus.Failure
      ];
      
      const expectedResults = [
        TaskStatus.Success,
        TaskStatus.Success,
        TaskStatus.Running,
        TaskStatus.Success,
        TaskStatus.Success
      ];
      
      const startTime = performance.now();
      
      for (let i = 0; i < statuses.length; i++) {
        alwaysSucceed.invalidate();
        childBehavior.reset();
        childBehavior.setReturnStatus(statuses[i]);
        
        const result = alwaysSucceed.tick(context);
        expect(result).toBe(expectedResults[i]);
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(10); // 应该在10ms内完成
    });
  });

  // 测试错误处理
  describe('错误处理测试', () => {
    test('子节点抛出异常时应该能处理', () => {
      const errorChild = TestUtils.createMockBehavior<TestContext>(TaskStatus.Success, 'ErrorChild');
      errorChild.update = () => {
        throw new Error('子节点执行错误');
      };
      alwaysSucceed.child = errorChild;
      
      expect(() => {
        alwaysSucceed.tick(context);
      }).toThrow('子节点执行错误');
    });

    test('上下文为null时应该能处理', () => {
      childBehavior.setReturnStatus(TaskStatus.Failure);
      
      const result = alwaysSucceed.tick(null as any);
      
      expect(result).toBe(TaskStatus.Success);
      expect(childBehavior.updateCallCount).toBe(1);
    });
  });

  // 测试实际使用场景
  describe('实际使用场景测试', () => {
    test('包装可能失败的动作应该始终成功', () => {
      // 模拟一个可能失败的动作
      const unreliableAction = TestUtils.createMockBehavior<TestContext>(TaskStatus.Failure, 'UnreliableAction');
      alwaysSucceed.child = unreliableAction;
      
      // 即使动作失败，装饰器也应该返回成功
      const result = alwaysSucceed.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(unreliableAction.updateCallCount).toBe(1);
    });

    test('包装长时间运行的任务应该保持运行状态', () => {
      const longRunningTask = TestUtils.createMockBehavior<TestContext>(TaskStatus.Running, 'LongRunningTask');
      alwaysSucceed.child = longRunningTask;
      
      // 长时间运行的任务应该保持运行状态
      let result = alwaysSucceed.tick(context);
      expect(result).toBe(TaskStatus.Running);
      
      // 继续运行
      result = alwaysSucceed.tick(context);
      expect(result).toBe(TaskStatus.Running);
      
      // 任务完成后应该返回成功
      longRunningTask.setReturnStatus(TaskStatus.Success);
      result = alwaysSucceed.tick(context);
      expect(result).toBe(TaskStatus.Success);
    });
  });
});
