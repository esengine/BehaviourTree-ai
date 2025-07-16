/**
 * Selector 复合节点测试
 *
 * 测试选择器节点的执行逻辑：按顺序尝试子节点直到一个成功
 */
import { Selector } from '../../../behaviourTree/composites/Selector';
import { TaskStatus } from '../../../behaviourTree/TaskStatus';
import { AbortTypes } from '../../../behaviourTree/composites/AbortTypes';
import { TestUtils, TestContext, MockBehavior } from '../../utils/TestUtils';

describe('Selector 复合节点测试', () => {
  let context: TestContext;
  let selector: Selector<TestContext>;
  let child1: MockBehavior<TestContext>;
  let child2: MockBehavior<TestContext>;
  let child3: MockBehavior<TestContext>;

  beforeEach(() => {
    context = TestUtils.createTestContext();
    selector = new Selector<TestContext>();
    child1 = TestUtils.createFailureBehavior<TestContext>('Child1');
    child2 = TestUtils.createFailureBehavior<TestContext>('Child2');
    child3 = TestUtils.createFailureBehavior<TestContext>('Child3');
  });

  // 测试基本功能
  describe('基本功能测试', () => {
    test('应该能创建Selector实例', () => {
      expect(selector).toBeDefined();
      expect(selector.status).toBe(TaskStatus.Invalid);
    });

    test('没有子节点时应该返回Failure', () => {
      const result = selector.tick(context);
      expect(result).toBe(TaskStatus.Failure);
      expect(selector.status).toBe(TaskStatus.Failure);
    });

    test('单个子节点成功时应该返回Success', () => {
      child1.setReturnStatus(TaskStatus.Success);
      selector.addChild(child1);

      const result = selector.tick(context);

      expect(result).toBe(TaskStatus.Success);
      expect(selector.status).toBe(TaskStatus.Success);
      expect(child1.updateCallCount).toBe(1);
    });

    test('单个子节点失败时应该返回Failure', () => {
      selector.addChild(child1);

      const result = selector.tick(context);

      expect(result).toBe(TaskStatus.Failure);
      expect(selector.status).toBe(TaskStatus.Failure);
      expect(child1.updateCallCount).toBe(1);
    });

    test('单个子节点运行中时应该返回Running', () => {
      child1.setReturnStatus(TaskStatus.Running);
      selector.addChild(child1);

      const result = selector.tick(context);

      expect(result).toBe(TaskStatus.Running);
      expect(selector.status).toBe(TaskStatus.Running);
      expect(child1.updateCallCount).toBe(1);
    });
  });

  // 测试多子节点执行逻辑
  describe('多子节点执行逻辑测试', () => {
    beforeEach(() => {
      selector.addChild(child1);
      selector.addChild(child2);
      selector.addChild(child3);
    });

    test('所有子节点失败时应该返回Failure', () => {
      // 第一次tick执行第一个子节点
      let result = selector.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(0);
      expect(child3.updateCallCount).toBe(0);

      // 第二次tick执行第二个子节点
      result = selector.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(1);
      expect(child3.updateCallCount).toBe(0);

      // 第三次tick执行第三个子节点，所有节点都失败
      result = selector.tick(context);
      expect(result).toBe(TaskStatus.Failure);
      expect(selector.status).toBe(TaskStatus.Failure);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(1);
      expect(child3.updateCallCount).toBe(1);
    });

    test('第一个子节点成功时应该立即返回Success', () => {
      child1.setReturnStatus(TaskStatus.Success);

      const result = selector.tick(context);

      expect(result).toBe(TaskStatus.Success);
      expect(selector.status).toBe(TaskStatus.Success);

      // 验证只有第一个子节点被执行
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(0);
      expect(child3.updateCallCount).toBe(0);
    });

    test('中间子节点成功时应该立即返回Success', () => {
      child2.setReturnStatus(TaskStatus.Success);

      // 第一次tick执行第一个子节点（失败）
      let result = selector.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(0);
      expect(child3.updateCallCount).toBe(0);

      // 第二次tick执行第二个子节点（成功）
      result = selector.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(selector.status).toBe(TaskStatus.Success);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(1);
      expect(child3.updateCallCount).toBe(0);
    });

    test('第一个子节点运行中时应该返回Running', () => {
      child1.setReturnStatus(TaskStatus.Running);

      const result = selector.tick(context);

      expect(result).toBe(TaskStatus.Running);
      expect(selector.status).toBe(TaskStatus.Running);

      // 验证只有第一个子节点被执行
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(0);
      expect(child3.updateCallCount).toBe(0);
    });

    test('中间子节点运行中时应该返回Running', () => {
      child2.setReturnStatus(TaskStatus.Running);

      // 第一次tick执行第一个子节点（失败）
      let result = selector.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(0);
      expect(child3.updateCallCount).toBe(0);

      // 第二次tick执行第二个子节点（运行中）
      result = selector.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(selector.status).toBe(TaskStatus.Running);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(1);
      expect(child3.updateCallCount).toBe(0);
    });
  });
});