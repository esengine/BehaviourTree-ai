/**
 * Parallel 复合节点测试
 *
 * 测试并行节点的执行逻辑：同时执行所有子节点
 */
import { Parallel } from '../../../behaviourTree/composites/Parallel';
import { TaskStatus } from '../../../behaviourTree/TaskStatus';
import { AbortTypes } from '../../../behaviourTree/composites/AbortTypes';
import { TestUtils, TestContext, MockBehavior } from '../../utils/TestUtils';

describe('Parallel 复合节点测试', () => {
  let context: TestContext;
  let parallel: Parallel<TestContext>;
  let child1: MockBehavior<TestContext>;
  let child2: MockBehavior<TestContext>;
  let child3: MockBehavior<TestContext>;

  beforeEach(() => {
    context = TestUtils.createTestContext();
    parallel = new Parallel<TestContext>();
    child1 = TestUtils.createSuccessBehavior<TestContext>('Child1');
    child2 = TestUtils.createSuccessBehavior<TestContext>('Child2');
    child3 = TestUtils.createSuccessBehavior<TestContext>('Child3');
  });

  // 测试基本功能
  describe('基本功能测试', () => {
    test('应该能创建Parallel实例', () => {
      expect(parallel).toBeDefined();
      expect(parallel.status).toBe(TaskStatus.Invalid);
    });

    test('没有子节点时应该返回Success', () => {
      const result = parallel.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(parallel.status).toBe(TaskStatus.Success);
    });

    test('单个子节点成功时应该返回Success', () => {
      parallel.addChild(child1);

      const result = parallel.tick(context);

      expect(result).toBe(TaskStatus.Success);
      expect(parallel.status).toBe(TaskStatus.Success);
      expect(child1.updateCallCount).toBe(1);
    });

    test('单个子节点失败时应该返回Failure', () => {
      child1.setReturnStatus(TaskStatus.Failure);
      parallel.addChild(child1);

      const result = parallel.tick(context);

      expect(result).toBe(TaskStatus.Failure);
      expect(parallel.status).toBe(TaskStatus.Failure);
      expect(child1.updateCallCount).toBe(1);
    });

    test('单个子节点运行中时应该返回Running', () => {
      child1.setReturnStatus(TaskStatus.Running);
      parallel.addChild(child1);

      const result = parallel.tick(context);

      expect(result).toBe(TaskStatus.Running);
      expect(parallel.status).toBe(TaskStatus.Running);
      expect(child1.updateCallCount).toBe(1);
    });
  });

  // 测试多子节点并行执行逻辑
  describe('多子节点并行执行逻辑测试', () => {
    beforeEach(() => {
      parallel.addChild(child1);
      parallel.addChild(child2);
      parallel.addChild(child3);
    });

    test('所有子节点成功时应该返回Success', () => {
      const result = parallel.tick(context);

      expect(result).toBe(TaskStatus.Success);
      expect(parallel.status).toBe(TaskStatus.Success);

      // 验证所有子节点都被执行
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(1);
      expect(child3.updateCallCount).toBe(1);
    });

    test('任何一个子节点失败时应该返回Failure', () => {
      child2.setReturnStatus(TaskStatus.Failure);

      const result = parallel.tick(context);

      expect(result).toBe(TaskStatus.Failure);
      expect(parallel.status).toBe(TaskStatus.Failure);

      // 验证失败节点之前的子节点被执行，失败节点也被执行，但后续节点不会执行
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(1);
      expect(child3.updateCallCount).toBe(0); // 由于提前退出，child3不会被执行
    });

    test('任何一个子节点运行中时应该返回Running', () => {
      child2.setReturnStatus(TaskStatus.Running);

      const result = parallel.tick(context);

      expect(result).toBe(TaskStatus.Running);
      expect(parallel.status).toBe(TaskStatus.Running);

      // 验证所有子节点都被执行
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(1);
      expect(child3.updateCallCount).toBe(1);
    });

    test('失败优先于运行中状态', () => {
      child1.setReturnStatus(TaskStatus.Running);
      child2.setReturnStatus(TaskStatus.Failure);
      child3.setReturnStatus(TaskStatus.Running);

      const result = parallel.tick(context);

      expect(result).toBe(TaskStatus.Failure);
      expect(parallel.status).toBe(TaskStatus.Failure);
    });
  });

  // 测试中止类型
  describe('中止类型测试', () => {
    test('默认中止类型应该是None', () => {
      expect(parallel.abortType).toBe(AbortTypes.None);
    });

    test('应该能设置中止类型', () => {
      parallel.abortType = AbortTypes.LowerPriority;
      expect(parallel.abortType).toBe(AbortTypes.LowerPriority);
    });
  });

  // 测试边界情况
  describe('边界情况测试', () => {
    test('子节点返回Invalid状态时应该能处理', () => {
      const invalidChild = TestUtils.createMockBehavior<TestContext>(TaskStatus.Invalid, 'InvalidChild');
      parallel.addChild(invalidChild);
      parallel.addChild(child1);

      const result = parallel.tick(context);

      // Invalid状态被视为Running状态（不是Success也不是Failure）
      expect(result).toBe(TaskStatus.Running);
      expect(parallel.status).toBe(TaskStatus.Running);
    });

    test('添加null子节点应该能处理', () => {
      expect(() => {
        parallel.addChild(null as any);
      }).not.toThrow();
    });

    test('子节点数量变化后应该正常工作', () => {
      // 测试动态添加子节点
      parallel.addChild(child1);
      let result = parallel.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(child1.updateCallCount).toBe(1);

      // 重置状态并添加失败的子节点
      parallel.invalidate();
      child1.reset();
      child2.setReturnStatus(TaskStatus.Failure);
      parallel.addChild(child2);

      result = parallel.tick(context);
      expect(result).toBe(TaskStatus.Failure);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(1);
    });
  });

  // 测试状态持续性
  describe('状态持续性测试', () => {
    beforeEach(() => {
      parallel.addChild(child1);
      parallel.addChild(child2);
      parallel.addChild(child3);
    });

    test('Running状态下再次tick应该继续执行所有子节点', () => {
      child1.setReturnStatus(TaskStatus.Success);
      child2.setReturnStatus(TaskStatus.Running);
      child3.setReturnStatus(TaskStatus.Running);

      // 第一次tick
      let result = parallel.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(1);
      expect(child3.updateCallCount).toBe(1);

      // 第二次tick，所有子节点都会再次执行（Parallel不会跳过已完成的节点）
      result = parallel.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(child1.updateCallCount).toBe(2); // 会再次执行
      expect(child2.updateCallCount).toBe(2); // 继续执行
      expect(child3.updateCallCount).toBe(2); // 继续执行

      // child2完成后，只有child3还在运行
      child2.setReturnStatus(TaskStatus.Success);
      result = parallel.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(child1.updateCallCount).toBe(3);
      expect(child2.updateCallCount).toBe(3);
      expect(child3.updateCallCount).toBe(3);

      // 所有子节点完成
      child3.setReturnStatus(TaskStatus.Success);
      result = parallel.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(child1.updateCallCount).toBe(4);
      expect(child2.updateCallCount).toBe(4);
      expect(child3.updateCallCount).toBe(4);
    });

    test('invalidate后应该重新开始执行', () => {
      child2.setReturnStatus(TaskStatus.Running);

      // 第一次tick
      parallel.tick(context);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(1);
      expect(child3.updateCallCount).toBe(1);

      // invalidate
      parallel.invalidate();

      // 再次tick应该重新执行所有子节点
      const result = parallel.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(child1.updateCallCount).toBe(2); // 应该再次执行
      expect(child2.updateCallCount).toBe(2); // 应该再次执行
      expect(child3.updateCallCount).toBe(2); // 应该再次执行
    });
  });

  // 测试性能
  describe('性能测试', () => {
    test('大量子节点应该能正常执行', () => {
      // 添加100个成功的子节点
      const children: MockBehavior<TestContext>[] = [];
      for (let i = 0; i < 100; i++) {
        const child = TestUtils.createSuccessBehavior<TestContext>(`Child${i}`);
        children.push(child);
        parallel.addChild(child);
      }

      const startTime = performance.now();
      const result = parallel.tick(context);
      const endTime = performance.now();

      expect(result).toBe(TaskStatus.Success);
      expect(endTime - startTime).toBeLessThan(50); // 应该在50ms内完成

      // 验证所有子节点都被执行
      children.forEach(child => {
        expect(child.updateCallCount).toBe(1);
      });
    });
  });
});