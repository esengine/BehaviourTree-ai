/**
 * UntilSuccess 装饰器测试
 * 
 * 测试直到成功装饰器的行为：继续执行子节点直到成功
 */
import { UntilSuccess } from '../../../behaviourTree/decorators/UntilSuccess';
import { TaskStatus } from '../../../behaviourTree/TaskStatus';
import { TestUtils, TestContext, MockBehavior } from '../../utils/TestUtils';

describe('UntilSuccess 装饰器测试', () => {
  let context: TestContext;
  let untilSuccess: UntilSuccess<TestContext>;
  let childBehavior: MockBehavior<TestContext>;

  beforeEach(() => {
    context = TestUtils.createTestContext();
    untilSuccess = new UntilSuccess<TestContext>();
    childBehavior = TestUtils.createFailureBehavior<TestContext>('TestChild');
    untilSuccess.child = childBehavior;
  });

  // 测试基本功能
  describe('基本功能测试', () => {
    test('应该能创建UntilSuccess实例', () => {
      expect(untilSuccess).toBeDefined();
      expect(untilSuccess.status).toBe(TaskStatus.Invalid);
    });

    test('子节点成功时应该返回Success', () => {
      childBehavior.setReturnStatus(TaskStatus.Success);
      
      const result = untilSuccess.tick(context);
      
      expect(result).toBe(TaskStatus.Success);
      expect(untilSuccess.status).toBe(TaskStatus.Success);
      expect(childBehavior.updateCallCount).toBe(1);
    });

    test('子节点失败时应该返回Running', () => {
      childBehavior.setReturnStatus(TaskStatus.Failure);
      
      const result = untilSuccess.tick(context);
      
      expect(result).toBe(TaskStatus.Running);
      expect(untilSuccess.status).toBe(TaskStatus.Running);
      expect(childBehavior.updateCallCount).toBe(1);
    });

    test('子节点运行中时应该返回Running', () => {
      childBehavior.setReturnStatus(TaskStatus.Running);
      
      const result = untilSuccess.tick(context);
      
      expect(result).toBe(TaskStatus.Running);
      expect(untilSuccess.status).toBe(TaskStatus.Running);
      expect(childBehavior.updateCallCount).toBe(1);
    });

    test('子节点返回Invalid时应该返回Running', () => {
      childBehavior.setReturnStatus(TaskStatus.Invalid);
      
      const result = untilSuccess.tick(context);
      
      expect(result).toBe(TaskStatus.Running);
      expect(untilSuccess.status).toBe(TaskStatus.Running);
      expect(childBehavior.updateCallCount).toBe(1);
    });
  });

  // 测试状态持续性
  describe('状态持续性测试', () => {
    test('Running状态下再次tick应该继续执行子节点', () => {
      childBehavior.setReturnStatus(TaskStatus.Failure);
      
      // 第一次tick，子节点失败，应该继续运行
      let result = untilSuccess.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(childBehavior.updateCallCount).toBe(1);
      
      // 第二次tick，子节点仍然失败，继续运行
      result = untilSuccess.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(childBehavior.updateCallCount).toBe(2);
      
      // 第三次tick，子节点仍然失败，继续运行
      result = untilSuccess.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(childBehavior.updateCallCount).toBe(3);
      
      // 子节点成功，应该返回成功
      childBehavior.setReturnStatus(TaskStatus.Success);
      result = untilSuccess.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(childBehavior.updateCallCount).toBe(4);
    });

    test('invalidate后应该重新开始执行', () => {
      childBehavior.setReturnStatus(TaskStatus.Failure);
      
      // 第一次tick
      untilSuccess.tick(context);
      expect(childBehavior.updateCallCount).toBe(1);
      
      // invalidate
      untilSuccess.invalidate();
      expect(untilSuccess.status).toBe(TaskStatus.Invalid);
      expect(childBehavior.status).toBe(TaskStatus.Invalid);
      
      // 再次tick应该重新开始
      const result = untilSuccess.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(childBehavior.updateCallCount).toBe(2);
    });
  });

  // 测试边界情况
  describe('边界情况测试', () => {
    test('没有子节点时应该抛出错误', () => {
      const emptyUntilSuccess = new UntilSuccess<TestContext>();
      
      expect(() => {
        emptyUntilSuccess.tick(context);
      }).toThrow('child必须不为空');
    });

    test('子节点为null时应该抛出错误', () => {
      untilSuccess.child = null as any;
      
      expect(() => {
        untilSuccess.tick(context);
      }).toThrow('child必须不为空');
    });

    test('多次状态变化应该正确处理', () => {
      const testCases = [
        { input: TaskStatus.Failure, expected: TaskStatus.Running },
        { input: TaskStatus.Running, expected: TaskStatus.Running },
        { input: TaskStatus.Invalid, expected: TaskStatus.Running },
        { input: TaskStatus.Success, expected: TaskStatus.Success }
      ];
      
      testCases.forEach(({ input, expected }, index) => {
        untilSuccess.invalidate();
        childBehavior.reset();
        childBehavior.setReturnStatus(input);
        
        const result = untilSuccess.tick(context);
        expect(result).toBe(expected);
      });
    });
  });

  // 测试生命周期
  describe('生命周期测试', () => {
    test('应该正确调用子节点的生命周期方法', () => {
      const mockChild = TestUtils.createMockBehavior<TestContext>(TaskStatus.Failure, 'MockChild');
      untilSuccess.child = mockChild;
      
      // 第一次tick会调用onStart
      untilSuccess.tick(context);
      
      // 验证子节点的update被调用
      expect(mockChild.updateCallCount).toBe(1);
    });

    test('invalidate应该传播到子节点', () => {
      const mockChild = TestUtils.createMockBehavior<TestContext>(TaskStatus.Running, 'MockChild');
      untilSuccess.child = mockChild;
      
      // 执行一次
      untilSuccess.tick(context);
      expect(mockChild.status).toBe(TaskStatus.Running);
      
      // invalidate应该传播
      untilSuccess.invalidate();
      expect(untilSuccess.status).toBe(TaskStatus.Invalid);
      expect(mockChild.status).toBe(TaskStatus.Invalid);
    });
  });

  // 测试性能
  describe('性能测试', () => {
    test('大量循环应该高效执行', () => {
      const iterations = 1000;
      childBehavior.setReturnStatus(TaskStatus.Failure);
      
      const startTime = performance.now();
      let totalCalls = 0;
      
      for (let i = 0; i < iterations; i++) {
        untilSuccess.invalidate();
        childBehavior.reset();
        const result = untilSuccess.tick(context);
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
        TaskStatus.Failure,
        TaskStatus.Running,
        TaskStatus.Invalid,
        TaskStatus.Failure,
        TaskStatus.Success
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
        untilSuccess.invalidate();
        childBehavior.reset();
        childBehavior.setReturnStatus(statuses[i]);
        
        const result = untilSuccess.tick(context);
        expect(result).toBe(expectedResults[i]);
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(10); // 应该在10ms内完成
    });
  });

  // 测试错误处理
  describe('错误处理测试', () => {
    test('子节点抛出异常时应该能处理', () => {
      const errorChild = TestUtils.createMockBehavior<TestContext>(TaskStatus.Failure, 'ErrorChild');
      errorChild.update = () => {
        throw new Error('子节点执行错误');
      };
      untilSuccess.child = errorChild;
      
      expect(() => {
        untilSuccess.tick(context);
      }).toThrow('子节点执行错误');
    });

    test('上下文为null时应该能处理', () => {
      childBehavior.setReturnStatus(TaskStatus.Failure);
      
      const result = untilSuccess.tick(null as any);
      
      expect(result).toBe(TaskStatus.Running);
      expect(childBehavior.updateCallCount).toBe(1);
    });
  });

  // 测试实际使用场景
  describe('实际使用场景测试', () => {
    test('尝试攻击直到命中', () => {
      // 模拟攻击动作，通常失败（未命中），直到成功（命中）
      const attackAction = TestUtils.createMockBehavior<TestContext>(TaskStatus.Failure, 'AttackAction');
      untilSuccess.child = attackAction;
      
      // 前几次攻击失败，继续尝试
      let result = untilSuccess.tick(context);
      expect(result).toBe(TaskStatus.Running);
      result = untilSuccess.tick(context);
      expect(result).toBe(TaskStatus.Running);
      result = untilSuccess.tick(context);
      expect(result).toBe(TaskStatus.Running);
      
      // 攻击成功，UntilSuccess成功完成
      attackAction.setReturnStatus(TaskStatus.Success);
      result = untilSuccess.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(attackAction.updateCallCount).toBe(4);
    });

    test('尝试连接服务器直到成功', () => {
      // 模拟连接动作，通常失败，直到连接成功
      const connectAction = TestUtils.createMockBehavior<TestContext>(TaskStatus.Failure, 'ConnectAction');
      untilSuccess.child = connectAction;
      
      // 持续尝试连接
      for (let i = 1; i <= 5; i++) {
        const result = untilSuccess.tick(context);
        expect(result).toBe(TaskStatus.Running);
        expect(connectAction.updateCallCount).toBe(i);
      }
      
      // 连接成功，UntilSuccess成功完成
      connectAction.setReturnStatus(TaskStatus.Success);
      const result = untilSuccess.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(connectAction.updateCallCount).toBe(6);
    });

    test('寻找路径直到找到', () => {
      // 模拟寻路动作，失败时表示没找到路径，成功时表示找到路径
      const pathfindAction = TestUtils.createMockBehavior<TestContext>(TaskStatus.Failure, 'PathfindAction');
      untilSuccess.child = pathfindAction;
      
      // 前几次寻路失败
      let result = untilSuccess.tick(context);
      expect(result).toBe(TaskStatus.Running);
      result = untilSuccess.tick(context);
      expect(result).toBe(TaskStatus.Running);
      
      // 找到路径，寻路成功
      pathfindAction.setReturnStatus(TaskStatus.Success);
      result = untilSuccess.tick(context);
      expect(result).toBe(TaskStatus.Success);
    });

    test('等待资源加载完成', () => {
      // 模拟资源加载检查，失败时表示还在加载，成功时表示加载完成
      const loadCheckAction = TestUtils.createMockBehavior<TestContext>(TaskStatus.Failure, 'LoadCheckAction');
      untilSuccess.child = loadCheckAction;
      
      // 资源还在加载中
      let result = untilSuccess.tick(context);
      expect(result).toBe(TaskStatus.Running);
      result = untilSuccess.tick(context);
      expect(result).toBe(TaskStatus.Running);
      result = untilSuccess.tick(context);
      expect(result).toBe(TaskStatus.Running);
      
      // 资源加载完成
      loadCheckAction.setReturnStatus(TaskStatus.Success);
      result = untilSuccess.tick(context);
      expect(result).toBe(TaskStatus.Success);
    });

    test('重试失败的操作', () => {
      // 模拟一个可能失败的操作，需要重试直到成功
      const retryAction = TestUtils.createMockBehavior<TestContext>(TaskStatus.Failure, 'RetryAction');
      untilSuccess.child = retryAction;
      
      // 操作失败，需要重试
      for (let i = 1; i <= 3; i++) {
        const result = untilSuccess.tick(context);
        expect(result).toBe(TaskStatus.Running);
        expect(retryAction.updateCallCount).toBe(i);
      }
      
      // 操作成功
      retryAction.setReturnStatus(TaskStatus.Success);
      const result = untilSuccess.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(retryAction.updateCallCount).toBe(4);
    });
  });
});
