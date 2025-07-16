/**
 * Sequence 复合节点测试
 * 
 * 测试序列节点的执行逻辑：按顺序执行子节点，直到有一个失败或全部成功
 */
import { Sequence } from '../../../behaviourTree/composites/Sequence';
import { TaskStatus } from '../../../behaviourTree/TaskStatus';
import { AbortTypes } from '../../../behaviourTree/composites/AbortTypes';
import { TestUtils, TestContext, MockBehavior } from '../../utils/TestUtils';

describe('Sequence 复合节点测试', () => {
  let context: TestContext;
  let sequence: Sequence<TestContext>;
  let child1: MockBehavior<TestContext>;
  let child2: MockBehavior<TestContext>;
  let child3: MockBehavior<TestContext>;

  beforeEach(() => {
    context = TestUtils.createTestContext();
    sequence = new Sequence<TestContext>();
    child1 = TestUtils.createSuccessBehavior<TestContext>('Child1');
    child2 = TestUtils.createSuccessBehavior<TestContext>('Child2');
    child3 = TestUtils.createSuccessBehavior<TestContext>('Child3');
  });

  // 测试基本功能
  describe('基本功能测试', () => {
    test('应该能创建Sequence实例', () => {
      expect(sequence).toBeDefined();
      expect(sequence.status).toBe(TaskStatus.Invalid);
    });

    test('没有子节点时应该返回Success', () => {
      const result = sequence.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(sequence.status).toBe(TaskStatus.Success);
    });

    test('单个子节点成功时应该返回Success', () => {
      sequence.addChild(child1);

      const result = sequence.tick(context);

      expect(result).toBe(TaskStatus.Success);
      expect(sequence.status).toBe(TaskStatus.Success);
      expect(child1.updateCallCount).toBe(1);
    });

    test('单个子节点失败时应该返回Failure', () => {
      child1.setReturnStatus(TaskStatus.Failure);
      sequence.addChild(child1);

      const result = sequence.tick(context);

      expect(result).toBe(TaskStatus.Failure);
      expect(sequence.status).toBe(TaskStatus.Failure);
      expect(child1.updateCallCount).toBe(1);
    });

    test('单个子节点运行中时应该返回Running', () => {
      child1.setReturnStatus(TaskStatus.Running);
      sequence.addChild(child1);

      const result = sequence.tick(context);

      expect(result).toBe(TaskStatus.Running);
      expect(sequence.status).toBe(TaskStatus.Running);
      expect(child1.updateCallCount).toBe(1);
    });
  });

  // 测试多子节点执行逻辑
  describe('多子节点执行逻辑测试', () => {
    beforeEach(() => {
      sequence.addChild(child1);
      sequence.addChild(child2);
      sequence.addChild(child3);
    });

    test('所有子节点成功时应该返回Success', () => {
      // 第一次tick执行第一个子节点
      let result = sequence.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(0);
      expect(child3.updateCallCount).toBe(0);

      // 第二次tick执行第二个子节点
      result = sequence.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(1);
      expect(child3.updateCallCount).toBe(0);

      // 第三次tick执行第三个子节点，序列完成
      result = sequence.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(sequence.status).toBe(TaskStatus.Success);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(1);
      expect(child3.updateCallCount).toBe(1);
    });

    test('第一个子节点失败时应该立即返回Failure', () => {
      child1.setReturnStatus(TaskStatus.Failure);
      
      const result = sequence.tick(context);
      
      expect(result).toBe(TaskStatus.Failure);
      expect(sequence.status).toBe(TaskStatus.Failure);
      
      // 验证只有第一个子节点被执行
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(0);
      expect(child3.updateCallCount).toBe(0);
    });

    test('中间子节点失败时应该立即返回Failure', () => {
      child2.setReturnStatus(TaskStatus.Failure);

      // 第一次tick执行第一个子节点（成功）
      let result = sequence.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(0);
      expect(child3.updateCallCount).toBe(0);

      // 第二次tick执行第二个子节点（失败）
      result = sequence.tick(context);
      expect(result).toBe(TaskStatus.Failure);
      expect(sequence.status).toBe(TaskStatus.Failure);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(1);
      expect(child3.updateCallCount).toBe(0);
    });

    test('第一个子节点运行中时应该返回Running', () => {
      child1.setReturnStatus(TaskStatus.Running);
      
      const result = sequence.tick(context);
      
      expect(result).toBe(TaskStatus.Running);
      expect(sequence.status).toBe(TaskStatus.Running);
      
      // 验证只有第一个子节点被执行
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(0);
      expect(child3.updateCallCount).toBe(0);
    });

    test('中间子节点运行中时应该返回Running', () => {
      child2.setReturnStatus(TaskStatus.Running);

      // 第一次tick执行第一个子节点（成功）
      let result = sequence.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(0);
      expect(child3.updateCallCount).toBe(0);

      // 第二次tick执行第二个子节点（运行中）
      result = sequence.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(sequence.status).toBe(TaskStatus.Running);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(1);
      expect(child3.updateCallCount).toBe(0);
    });
  });

  // 测试状态持续性
  describe('状态持续性测试', () => {
    beforeEach(() => {
      sequence.addChild(child1);
      sequence.addChild(child2);
      sequence.addChild(child3);
    });

    test('Running状态下再次update应该从当前位置继续', () => {
      child2.setReturnStatus(TaskStatus.Running);

      // 第一次tick执行child1（成功）
      let result = sequence.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(0);
      expect(child3.updateCallCount).toBe(0);

      // 第二次tick执行child2（运行中）
      result = sequence.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(1);
      expect(child3.updateCallCount).toBe(0);

      // 第三次tick，应该从child2继续
      result = sequence.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(child1.updateCallCount).toBe(1); // 不应该再次执行
      expect(child2.updateCallCount).toBe(2); // 应该再次执行
      expect(child3.updateCallCount).toBe(0);

      // child2完成后，应该继续执行child3
      child2.setReturnStatus(TaskStatus.Success);
      result = sequence.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(3);
      expect(child3.updateCallCount).toBe(0);

      // 最后执行child3
      result = sequence.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(3);
      expect(child3.updateCallCount).toBe(1);
    });

    test('invalidate后应该重新开始执行', () => {
      child2.setReturnStatus(TaskStatus.Running);

      // 第一次tick执行child1
      sequence.tick(context);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(0);

      // 第二次tick执行child2
      sequence.tick(context);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(1);

      // invalidate
      sequence.invalidate();

      // 再次tick应该从头开始
      const result = sequence.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(child1.updateCallCount).toBe(2); // 应该再次执行
      expect(child2.updateCallCount).toBe(1); // 还没有执行到
    });
  });

  // 测试中止类型
  describe('中止类型测试', () => {
    test('应该能设置中止类型', () => {
      const sequenceWithAbort = new Sequence<TestContext>(AbortTypes.LowerPriority);
      expect(sequenceWithAbort.abortType).toBe(AbortTypes.LowerPriority);
    });

    test('默认中止类型应该是None', () => {
      expect(sequence.abortType).toBe(AbortTypes.None);
    });
  });

  // 测试边界情况
  describe('边界情况测试', () => {
    test('子节点返回Invalid状态时应该能处理', () => {
      const invalidChild = TestUtils.createMockBehavior<TestContext>(TaskStatus.Invalid, 'InvalidChild');
      sequence.addChild(invalidChild);

      // 当子节点返回Invalid状态时，Sequence会将其传递出去
      const result = sequence.tick(context);

      // Invalid状态会被直接返回
      expect(result).toBe(TaskStatus.Invalid);
      expect(sequence.status).toBe(TaskStatus.Invalid);
    });

    test('添加null子节点应该能处理', () => {
      expect(() => {
        sequence.addChild(null as any);
      }).not.toThrow();
    });

    test('子节点数量变化后应该正常工作', () => {
      // 测试动态添加子节点
      sequence.addChild(child1);
      let result = sequence.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(child1.updateCallCount).toBe(1);

      // 重置状态并添加更多子节点
      sequence.invalidate();
      child1.reset();
      sequence.addChild(child2);

      // 现在有两个子节点，第一次tick执行child1
      result = sequence.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(0);

      // 第二次tick执行child2
      result = sequence.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(1);
    });
  });

  // 测试性能
  describe('性能测试', () => {
    test('大量子节点应该能正常执行', () => {
      // 添加10个成功的子节点（减少数量以加快测试速度）
      const children: MockBehavior<TestContext>[] = [];
      for (let i = 0; i < 10; i++) {
        const child = TestUtils.createSuccessBehavior<TestContext>(`Child${i}`);
        children.push(child);
        sequence.addChild(child);
      }

      const startTime = performance.now();

      // 执行所有子节点
      let result: TaskStatus = TaskStatus.Running;
      let tickCount = 0;

      while (result !== TaskStatus.Success && tickCount < 20) {
        result = sequence.tick(context);
        tickCount++;
      }

      const endTime = performance.now();

      expect(result).toBe(TaskStatus.Success);
      expect(endTime - startTime).toBeLessThan(50); // 应该在50ms内完成
      expect(tickCount).toBe(10); // 应该执行10次tick

      // 验证所有子节点都被执行
      children.forEach(child => {
        expect(child.updateCallCount).toBe(1);
      });
    });
  });
});
