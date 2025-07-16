/**
 * UntilFail 装饰器测试
 * 
 * 测试直到失败装饰器的行为：继续执行子节点直到失败
 */
import { UntilFail } from '../../../behaviourTree/decorators/UntilFail';
import { TaskStatus } from '../../../behaviourTree/TaskStatus';
import { TestUtils, TestContext, MockBehavior } from '../../utils/TestUtils';

describe('UntilFail 装饰器测试', () => {
  let context: TestContext;
  let untilFail: UntilFail<TestContext>;
  let childBehavior: MockBehavior<TestContext>;

  beforeEach(() => {
    context = TestUtils.createTestContext();
    untilFail = new UntilFail<TestContext>();
    childBehavior = TestUtils.createSuccessBehavior<TestContext>('TestChild');
    untilFail.child = childBehavior;
  });

  // 测试基本功能
  describe('基本功能测试', () => {
    test('应该能创建UntilFail实例', () => {
      expect(untilFail).toBeDefined();
      expect(untilFail.status).toBe(TaskStatus.Invalid);
    });

    test('子节点成功时应该返回Running', () => {
      childBehavior.setReturnStatus(TaskStatus.Success);
      
      const result = untilFail.tick(context);
      
      expect(result).toBe(TaskStatus.Running);
      expect(untilFail.status).toBe(TaskStatus.Running);
      expect(childBehavior.updateCallCount).toBe(1);
    });

    test('子节点失败时应该返回Success', () => {
      childBehavior.setReturnStatus(TaskStatus.Failure);
      
      const result = untilFail.tick(context);
      
      expect(result).toBe(TaskStatus.Success);
      expect(untilFail.status).toBe(TaskStatus.Success);
      expect(childBehavior.updateCallCount).toBe(1);
    });

    test('子节点运行中时应该返回Running', () => {
      childBehavior.setReturnStatus(TaskStatus.Running);
      
      const result = untilFail.tick(context);
      
      expect(result).toBe(TaskStatus.Running);
      expect(untilFail.status).toBe(TaskStatus.Running);
      expect(childBehavior.updateCallCount).toBe(1);
    });

    test('子节点返回Invalid时应该返回Running', () => {
      childBehavior.setReturnStatus(TaskStatus.Invalid);
      
      const result = untilFail.tick(context);
      
      expect(result).toBe(TaskStatus.Running);
      expect(untilFail.status).toBe(TaskStatus.Running);
      expect(childBehavior.updateCallCount).toBe(1);
    });
  });

  // 测试状态持续性
  describe('状态持续性测试', () => {
    test('Running状态下再次tick应该继续执行子节点', () => {
      childBehavior.setReturnStatus(TaskStatus.Success);
      
      // 第一次tick，子节点成功，应该继续运行
      let result = untilFail.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(childBehavior.updateCallCount).toBe(1);
      
      // 第二次tick，子节点仍然成功，继续运行
      result = untilFail.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(childBehavior.updateCallCount).toBe(2);
      
      // 第三次tick，子节点仍然成功，继续运行
      result = untilFail.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(childBehavior.updateCallCount).toBe(3);
      
      // 子节点失败，应该返回成功
      childBehavior.setReturnStatus(TaskStatus.Failure);
      result = untilFail.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(childBehavior.updateCallCount).toBe(4);
    });

    test('invalidate后应该重新开始执行', () => {
      childBehavior.setReturnStatus(TaskStatus.Success);
      
      // 第一次tick
      untilFail.tick(context);
      expect(childBehavior.updateCallCount).toBe(1);
      
      // invalidate
      untilFail.invalidate();
      expect(untilFail.status).toBe(TaskStatus.Invalid);
      expect(childBehavior.status).toBe(TaskStatus.Invalid);
      
      // 再次tick应该重新开始
      const result = untilFail.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(childBehavior.updateCallCount).toBe(2);
    });
  });

  // 测试边界情况
  describe('边界情况测试', () => {
    test('没有子节点时应该抛出错误', () => {
      const emptyUntilFail = new UntilFail<TestContext>();
      
      expect(() => {
        emptyUntilFail.tick(context);
      }).toThrow('child必须不为空');
    });

    test('子节点为null时应该抛出错误', () => {
      untilFail.child = null as any;
      
      expect(() => {
        untilFail.tick(context);
      }).toThrow('child必须不为空');
    });

    test('多次状态变化应该正确处理', () => {
      const testCases = [
        { input: TaskStatus.Success, expected: TaskStatus.Running },
        { input: TaskStatus.Running, expected: TaskStatus.Running },
        { input: TaskStatus.Invalid, expected: TaskStatus.Running },
        { input: TaskStatus.Failure, expected: TaskStatus.Success }
      ];
      
      testCases.forEach(({ input, expected }, index) => {
        untilFail.invalidate();
        childBehavior.reset();
        childBehavior.setReturnStatus(input);
        
        const result = untilFail.tick(context);
        expect(result).toBe(expected);
      });
    });
  });

  // 测试生命周期
  describe('生命周期测试', () => {
    test('应该正确调用子节点的生命周期方法', () => {
      const mockChild = TestUtils.createMockBehavior<TestContext>(TaskStatus.Success, 'MockChild');
      untilFail.child = mockChild;
      
      // 第一次tick会调用onStart
      untilFail.tick(context);
      
      // 验证子节点的update被调用
      expect(mockChild.updateCallCount).toBe(1);
    });

    test('invalidate应该传播到子节点', () => {
      const mockChild = TestUtils.createMockBehavior<TestContext>(TaskStatus.Running, 'MockChild');
      untilFail.child = mockChild;
      
      // 执行一次
      untilFail.tick(context);
      expect(mockChild.status).toBe(TaskStatus.Running);
      
      // invalidate应该传播
      untilFail.invalidate();
      expect(untilFail.status).toBe(TaskStatus.Invalid);
      expect(mockChild.status).toBe(TaskStatus.Invalid);
    });
  });

  // 测试性能
  describe('性能测试', () => {
    test('大量循环应该高效执行', () => {
      const iterations = 1000;
      childBehavior.setReturnStatus(TaskStatus.Success);
      
      const startTime = performance.now();
      let totalCalls = 0;
      
      for (let i = 0; i < iterations; i++) {
        untilFail.invalidate();
        childBehavior.reset();
        const result = untilFail.tick(context);
        expect(result).toBe(TaskStatus.Running);
        totalCalls += childBehavior.updateCallCount;
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(200); // 应该在200ms内完成
      expect(totalCalls).toBe(iterations);
    });

    test('连续状态变化应该高效处理', () => {
      const statuses = [
        TaskStatus.Success,
        TaskStatus.Running,
        TaskStatus.Invalid,
        TaskStatus.Success,
        TaskStatus.Failure
      ];
      
      const expectedResults = [
        TaskStatus.Running,
        TaskStatus.Running,
        TaskStatus.Running,
        TaskStatus.Running,
        TaskStatus.Success
      ];
      
      const startTime = performance.now();
      
      for (let i = 0; i < statuses.length; i++) {
        untilFail.invalidate();
        childBehavior.reset();
        childBehavior.setReturnStatus(statuses[i]);
        
        const result = untilFail.tick(context);
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
      untilFail.child = errorChild;
      
      expect(() => {
        untilFail.tick(context);
      }).toThrow('子节点执行错误');
    });

    test('上下文为null时应该能处理', () => {
      childBehavior.setReturnStatus(TaskStatus.Success);
      
      const result = untilFail.tick(null as any);
      
      expect(result).toBe(TaskStatus.Running);
      expect(childBehavior.updateCallCount).toBe(1);
    });
  });

  // 测试实际使用场景
  describe('实际使用场景测试', () => {
    test('巡逻直到遇到敌人', () => {
      // 模拟巡逻动作，通常返回成功，直到遇到敌人返回失败
      const patrolAction = TestUtils.createMockBehavior<TestContext>(TaskStatus.Success, 'PatrolAction');
      untilFail.child = patrolAction;
      
      // 前几次巡逻成功，继续巡逻
      let result = untilFail.tick(context);
      expect(result).toBe(TaskStatus.Running);
      result = untilFail.tick(context);
      expect(result).toBe(TaskStatus.Running);
      result = untilFail.tick(context);
      expect(result).toBe(TaskStatus.Running);
      
      // 遇到敌人，巡逻失败，UntilFail成功完成
      patrolAction.setReturnStatus(TaskStatus.Failure);
      result = untilFail.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(patrolAction.updateCallCount).toBe(4);
    });

    test('收集资源直到背包满', () => {
      // 模拟收集动作，成功时继续收集，失败时（背包满）停止
      const collectAction = TestUtils.createMockBehavior<TestContext>(TaskStatus.Success, 'CollectAction');
      untilFail.child = collectAction;
      
      // 持续收集资源
      for (let i = 1; i <= 10; i++) {
        const result = untilFail.tick(context);
        expect(result).toBe(TaskStatus.Running);
        expect(collectAction.updateCallCount).toBe(i);
      }
      
      // 背包满了，收集失败，UntilFail成功完成
      collectAction.setReturnStatus(TaskStatus.Failure);
      const result = untilFail.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(collectAction.updateCallCount).toBe(11);
    });

    test('执行任务直到出错', () => {
      // 模拟执行任务，正常情况下成功，出错时失败
      const taskAction = TestUtils.createMockBehavior<TestContext>(TaskStatus.Success, 'TaskAction');
      untilFail.child = taskAction;
      
      // 正常执行任务
      let result = untilFail.tick(context);
      expect(result).toBe(TaskStatus.Running);
      result = untilFail.tick(context);
      expect(result).toBe(TaskStatus.Running);
      
      // 任务出错，UntilFail成功完成
      taskAction.setReturnStatus(TaskStatus.Failure);
      result = untilFail.tick(context);
      expect(result).toBe(TaskStatus.Success);
    });

    test('等待条件变化', () => {
      // 模拟等待某个条件变化，条件满足时返回成功，不满足时返回失败
      const waitCondition = TestUtils.createMockBehavior<TestContext>(TaskStatus.Success, 'WaitCondition');
      untilFail.child = waitCondition;
      
      // 条件一直满足，继续等待
      let result = untilFail.tick(context);
      expect(result).toBe(TaskStatus.Running);
      result = untilFail.tick(context);
      expect(result).toBe(TaskStatus.Running);
      
      // 条件不满足了，等待结束
      waitCondition.setReturnStatus(TaskStatus.Failure);
      result = untilFail.tick(context);
      expect(result).toBe(TaskStatus.Success);
    });
  });
});
