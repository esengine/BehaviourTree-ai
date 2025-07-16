/**
 * 简单中止测试
 * 
 * 测试最基本的中止功能
 */
import { Selector } from '../../../behaviourTree/composites/Selector';
import { Sequence } from '../../../behaviourTree/composites/Sequence';
import { AbortTypes } from '../../../behaviourTree/composites/AbortTypes';
import { TaskStatus } from '../../../behaviourTree/TaskStatus';
import { TestUtils, TestContext } from '../../utils/TestUtils';

describe('简单中止测试', () => {
  let context: TestContext;

  beforeEach(() => {
    context = TestUtils.createTestContext();
  });

  // 测试TaskStatus枚举值
  describe('TaskStatus枚举值测试', () => {
    test('应该有正确的枚举值', () => {
      expect(TaskStatus.Invalid).toBe(0);
      expect(TaskStatus.Success).toBe(1);
      expect(TaskStatus.Failure).toBe(2);
      expect(TaskStatus.Running).toBe(3);
    });
  });

  // 测试基本的中止类型设置
  describe('中止类型设置测试', () => {
    test('Selector应该能设置中止类型', () => {
      const selector = new Selector<TestContext>(AbortTypes.Self);
      expect(selector.abortType).toBe(AbortTypes.Self);
      
      selector.abortType = AbortTypes.LowerPriority;
      expect(selector.abortType).toBe(AbortTypes.LowerPriority);
      
      selector.abortType = AbortTypes.Both;
      expect(selector.abortType).toBe(AbortTypes.Both);
      
      selector.abortType = AbortTypes.None;
      expect(selector.abortType).toBe(AbortTypes.None);
    });

    test('Sequence应该能设置中止类型', () => {
      const sequence = new Sequence<TestContext>(AbortTypes.LowerPriority);
      expect(sequence.abortType).toBe(AbortTypes.LowerPriority);
      
      sequence.abortType = AbortTypes.Self;
      expect(sequence.abortType).toBe(AbortTypes.Self);
      
      sequence.abortType = AbortTypes.Both;
      expect(sequence.abortType).toBe(AbortTypes.Both);
      
      sequence.abortType = AbortTypes.None;
      expect(sequence.abortType).toBe(AbortTypes.None);
    });

    test('默认中止类型应该是None', () => {
      const selector = new Selector<TestContext>();
      const sequence = new Sequence<TestContext>();
      
      expect(selector.abortType).toBe(AbortTypes.None);
      expect(sequence.abortType).toBe(AbortTypes.None);
    });
  });

  // 测试基本的Selector行为
  describe('Selector基本行为测试', () => {
    test('Selector应该执行第一个成功的子节点', () => {
      const selector = new Selector<TestContext>();
      
      const child1 = TestUtils.createSuccessBehavior<TestContext>('Child1');
      const child2 = TestUtils.createSuccessBehavior<TestContext>('Child2');
      
      selector.addChild(child1);
      selector.addChild(child2);
      
      const result = selector.tick(context);
      
      expect(result).toBe(TaskStatus.Success);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(0); // 不应该执行
    });

    test('Selector应该在第一个子节点失败时执行第二个', () => {
      const selector = new Selector<TestContext>();

      const child1 = TestUtils.createFailureBehavior<TestContext>('Child1');
      const child2 = TestUtils.createSuccessBehavior<TestContext>('Child2');

      selector.addChild(child1);
      selector.addChild(child2);

      // 第一次tick：执行第一个子节点，失败后返回Running
      let result = selector.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(0);

      // 第二次tick：执行第二个子节点，成功
      result = selector.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(child2.updateCallCount).toBe(1);
    });

    test('Selector在子节点运行中时应该返回运行中', () => {
      const selector = new Selector<TestContext>();
      
      const child1 = TestUtils.createMockBehavior<TestContext>(TaskStatus.Running, 'Child1');
      const child2 = TestUtils.createSuccessBehavior<TestContext>('Child2');
      
      selector.addChild(child1);
      selector.addChild(child2);
      
      const result = selector.tick(context);
      
      expect(result).toBe(TaskStatus.Running);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(0); // 不应该执行
    });

    test('Selector在所有子节点失败时应该返回失败', () => {
      const selector = new Selector<TestContext>();

      const child1 = TestUtils.createFailureBehavior<TestContext>('Child1');
      const child2 = TestUtils.createFailureBehavior<TestContext>('Child2');

      selector.addChild(child1);
      selector.addChild(child2);

      // 第一次tick：执行第一个子节点，失败后返回Running
      let result = selector.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(0);

      // 第二次tick：执行第二个子节点，失败后返回Failure
      result = selector.tick(context);
      expect(result).toBe(TaskStatus.Failure);
      expect(child2.updateCallCount).toBe(1);
    });
  });

  // 测试基本的Sequence行为
  describe('Sequence基本行为测试', () => {
    test('Sequence应该执行所有成功的子节点', () => {
      const sequence = new Sequence<TestContext>();

      const child1 = TestUtils.createSuccessBehavior<TestContext>('Child1');
      const child2 = TestUtils.createSuccessBehavior<TestContext>('Child2');

      sequence.addChild(child1);
      sequence.addChild(child2);

      // 第一次tick：执行第一个子节点，成功后返回Running
      let result = sequence.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(0);

      // 第二次tick：执行第二个子节点，成功后返回Success
      result = sequence.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(child2.updateCallCount).toBe(1);
    });

    test('Sequence应该在第一个子节点失败时停止', () => {
      const sequence = new Sequence<TestContext>();
      
      const child1 = TestUtils.createFailureBehavior<TestContext>('Child1');
      const child2 = TestUtils.createSuccessBehavior<TestContext>('Child2');
      
      sequence.addChild(child1);
      sequence.addChild(child2);
      
      const result = sequence.tick(context);
      
      expect(result).toBe(TaskStatus.Failure);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(0); // 不应该执行
    });

    test('Sequence在子节点运行中时应该返回运行中', () => {
      const sequence = new Sequence<TestContext>();

      const child1 = TestUtils.createSuccessBehavior<TestContext>('Child1');
      const child2 = TestUtils.createMockBehavior<TestContext>(TaskStatus.Running, 'Child2');
      const child3 = TestUtils.createSuccessBehavior<TestContext>('Child3');

      sequence.addChild(child1);
      sequence.addChild(child2);
      sequence.addChild(child3);

      // 第一次tick：执行第一个子节点，成功后返回Running
      let result = sequence.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(0);

      // 第二次tick：执行第二个子节点，运行中时返回Running
      result = sequence.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(child2.updateCallCount).toBe(1);
      expect(child3.updateCallCount).toBe(0); // 不应该执行
    });
  });

  // 测试状态管理
  describe('状态管理测试', () => {
    test('invalidate应该重置复合节点状态', () => {
      const selector = new Selector<TestContext>();
      const child = TestUtils.createSuccessBehavior<TestContext>('Child');

      selector.addChild(child);

      // 执行一次
      selector.tick(context);
      expect(selector.status).toBe(TaskStatus.Success);
      // 注意：子节点的状态可能不会立即更新，这取决于实现

      // 重置状态
      selector.invalidate();
      expect(selector.status).toBe(TaskStatus.Invalid);
      expect(child.status).toBe(TaskStatus.Invalid);
    });

    test('复合节点应该在重新执行时重置状态', () => {
      const selector = new Selector<TestContext>();
      const child = TestUtils.createSuccessBehavior<TestContext>('Child');
      
      selector.addChild(child);
      
      // 第一次执行
      let result = selector.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(child.updateCallCount).toBe(1);
      
      // 重置并再次执行
      selector.invalidate();
      child.reset();

      result = selector.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(child.updateCallCount).toBe(1);
    });
  });

  // 测试边界情况
  describe('边界情况测试', () => {
    test('空的Selector应该返回失败', () => {
      const selector = new Selector<TestContext>();
      const result = selector.tick(context);
      expect(result).toBe(TaskStatus.Failure);
    });

    test('空的Sequence应该返回成功', () => {
      const sequence = new Sequence<TestContext>();
      const result = sequence.tick(context);
      expect(result).toBe(TaskStatus.Success);
    });

    test('单个子节点的复合节点应该返回子节点的状态', () => {
      // 测试Selector的成功子节点
      const selector1 = new Selector<TestContext>();
      const successChild = TestUtils.createSuccessBehavior<TestContext>('SuccessChild');
      selector1.addChild(successChild);
      expect(selector1.tick(context)).toBe(TaskStatus.Success);
      
      // 测试Selector的失败子节点
      const selector2 = new Selector<TestContext>();
      const failureChild = TestUtils.createFailureBehavior<TestContext>('FailureChild');
      selector2.addChild(failureChild);
      expect(selector2.tick(context)).toBe(TaskStatus.Failure);
      
      // 测试Sequence的运行中子节点
      const sequence = new Sequence<TestContext>();
      const runningChild = TestUtils.createMockBehavior<TestContext>(TaskStatus.Running, 'RunningChild');
      sequence.addChild(runningChild);
      expect(sequence.tick(context)).toBe(TaskStatus.Running);
    });

    test('应该能处理null上下文', () => {
      const selector = new Selector<TestContext>();
      const child = TestUtils.createSuccessBehavior<TestContext>('Child');
      
      selector.addChild(child);
      
      // 使用null上下文应该不会崩溃
      const result = selector.tick(null as any);
      expect(result).toBe(TaskStatus.Success);
    });
  });

  // 测试性能
  describe('性能测试', () => {
    test('复合节点应该高效执行', () => {
      const selector = new Selector<TestContext>();

      // 只添加一个成功的子节点来简化测试
      selector.addChild(TestUtils.createSuccessBehavior<TestContext>('SuccessChild'));

      const startTime = performance.now();

      // 执行多次来测试性能
      for (let i = 0; i < 1000; i++) {
        selector.invalidate();
        selector.tick(context);
      }

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // 应该在100ms内完成1000次执行
    });
  });
});
