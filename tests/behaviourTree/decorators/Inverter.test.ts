/**
 * Inverter 装饰器测试
 * 
 * 测试反转装饰器的状态反转逻辑
 */
import { Inverter } from '../../../behaviourTree/decorators/Inverter';
import { TaskStatus } from '../../../behaviourTree/TaskStatus';
import { TestUtils, TestContext, MockBehavior } from '../../utils/TestUtils';

describe('Inverter 装饰器测试', () => {
  let context: TestContext;
  let inverter: Inverter<TestContext>;
  let childBehavior: MockBehavior<TestContext>;

  beforeEach(() => {
    context = TestUtils.createTestContext();
    inverter = new Inverter<TestContext>();
    childBehavior = TestUtils.createSuccessBehavior<TestContext>('TestChild');
    inverter.child = childBehavior;
  });

  // 测试基本功能
  describe('基本功能测试', () => {
    test('应该能创建Inverter实例', () => {
      expect(inverter).toBeDefined();
      expect(inverter.status).toBe(TaskStatus.Invalid);
    });

    test('子节点成功时应该返回失败', () => {
      childBehavior.setReturnStatus(TaskStatus.Success);
      
      const result = inverter.tick(context);
      
      expect(result).toBe(TaskStatus.Failure);
      expect(inverter.status).toBe(TaskStatus.Failure);
      expect(childBehavior.updateCallCount).toBe(1);
    });

    test('子节点失败时应该返回成功', () => {
      childBehavior.setReturnStatus(TaskStatus.Failure);
      
      const result = inverter.tick(context);
      
      expect(result).toBe(TaskStatus.Success);
      expect(inverter.status).toBe(TaskStatus.Success);
      expect(childBehavior.updateCallCount).toBe(1);
    });

    test('子节点运行中时应该返回运行中', () => {
      childBehavior.setReturnStatus(TaskStatus.Running);
      
      const result = inverter.tick(context);
      
      expect(result).toBe(TaskStatus.Running);
      expect(inverter.status).toBe(TaskStatus.Running);
      expect(childBehavior.updateCallCount).toBe(1);
    });

    test('子节点返回Invalid时应该返回Running', () => {
      childBehavior.setReturnStatus(TaskStatus.Invalid);
      
      const result = inverter.tick(context);
      
      expect(result).toBe(TaskStatus.Running);
      expect(inverter.status).toBe(TaskStatus.Running);
      expect(childBehavior.updateCallCount).toBe(1);
    });
  });

  // 测试状态持续性
  describe('状态持续性测试', () => {
    test('Running状态下再次tick应该继续执行子节点', () => {
      childBehavior.setReturnStatus(TaskStatus.Running);
      
      // 第一次tick
      let result = inverter.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(childBehavior.updateCallCount).toBe(1);
      
      // 第二次tick，子节点应该继续执行
      result = inverter.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(childBehavior.updateCallCount).toBe(2);
      
      // 子节点完成后，状态应该被反转
      childBehavior.setReturnStatus(TaskStatus.Success);
      result = inverter.tick(context);
      expect(result).toBe(TaskStatus.Failure);
      expect(childBehavior.updateCallCount).toBe(3);
    });

    test('invalidate后应该重新开始执行', () => {
      childBehavior.setReturnStatus(TaskStatus.Running);
      
      // 第一次tick
      inverter.tick(context);
      expect(childBehavior.updateCallCount).toBe(1);
      
      // invalidate
      inverter.invalidate();
      expect(inverter.status).toBe(TaskStatus.Invalid);
      expect(childBehavior.status).toBe(TaskStatus.Invalid);
      
      // 再次tick应该重新开始
      const result = inverter.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(childBehavior.updateCallCount).toBe(2);
    });
  });

  // 测试边界情况
  describe('边界情况测试', () => {
    test('没有子节点时应该抛出错误', () => {
      const emptyInverter = new Inverter<TestContext>();
      
      expect(() => {
        emptyInverter.tick(context);
      }).toThrow('child必须不能为空');
    });

    test('子节点为null时应该抛出错误', () => {
      inverter.child = null as any;
      
      expect(() => {
        inverter.tick(context);
      }).toThrow('child必须不能为空');
    });

    test('多次状态变化应该正确反转', () => {
      // 成功 -> 失败
      childBehavior.setReturnStatus(TaskStatus.Success);
      let result = inverter.tick(context);
      expect(result).toBe(TaskStatus.Failure);
      
      // 重置状态
      inverter.invalidate();
      childBehavior.reset();
      
      // 失败 -> 成功
      childBehavior.setReturnStatus(TaskStatus.Failure);
      result = inverter.tick(context);
      expect(result).toBe(TaskStatus.Success);
      
      // 重置状态
      inverter.invalidate();
      childBehavior.reset();
      
      // 运行中 -> 运行中
      childBehavior.setReturnStatus(TaskStatus.Running);
      result = inverter.tick(context);
      expect(result).toBe(TaskStatus.Running);
    });
  });

  // 测试生命周期
  describe('生命周期测试', () => {
    test('应该正确调用子节点的生命周期方法', () => {
      const mockChild = TestUtils.createMockBehavior<TestContext>(TaskStatus.Success, 'MockChild');
      inverter.child = mockChild;
      
      // 第一次tick会调用onStart
      inverter.tick(context);
      
      // 验证子节点的tick被调用
      expect(mockChild.updateCallCount).toBe(1);
    });

    test('invalidate应该传播到子节点', () => {
      const mockChild = TestUtils.createMockBehavior<TestContext>(TaskStatus.Running, 'MockChild');
      inverter.child = mockChild;
      
      // 执行一次
      inverter.tick(context);
      expect(mockChild.status).toBe(TaskStatus.Running);
      
      // invalidate应该传播
      inverter.invalidate();
      expect(inverter.status).toBe(TaskStatus.Invalid);
      expect(mockChild.status).toBe(TaskStatus.Invalid);
    });
  });

  // 测试性能
  describe('性能测试', () => {
    test('大量反转操作应该高效执行', () => {
      const iterations = 1000;
      childBehavior.setReturnStatus(TaskStatus.Success);

      const startTime = performance.now();
      let totalCalls = 0;

      for (let i = 0; i < iterations; i++) {
        inverter.invalidate();
        childBehavior.reset();
        const result = inverter.tick(context);
        expect(result).toBe(TaskStatus.Failure);
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
        TaskStatus.Failure,
        TaskStatus.Running,
        TaskStatus.Success,
        TaskStatus.Failure
      ];
      
      const expectedResults = [
        TaskStatus.Failure,
        TaskStatus.Success,
        TaskStatus.Running,
        TaskStatus.Failure,
        TaskStatus.Success
      ];
      
      const startTime = performance.now();
      
      for (let i = 0; i < statuses.length; i++) {
        inverter.invalidate();
        childBehavior.reset();
        childBehavior.setReturnStatus(statuses[i]);
        
        const result = inverter.tick(context);
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
      inverter.child = errorChild;
      
      expect(() => {
        inverter.tick(context);
      }).toThrow('子节点执行错误');
    });

    test('上下文为null时应该能处理', () => {
      childBehavior.setReturnStatus(TaskStatus.Success);
      
      const result = inverter.tick(null as any);
      
      expect(result).toBe(TaskStatus.Failure);
      expect(childBehavior.updateCallCount).toBe(1);
    });
  });
});
