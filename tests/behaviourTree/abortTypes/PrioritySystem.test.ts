/**
 * 优先级系统测试
 * 
 * 测试优先级系统的正确性和一致性
 */
import { Selector } from '../../../behaviourTree/composites/Selector';
import { Sequence } from '../../../behaviourTree/composites/Sequence';
import { AbortTypes } from '../../../behaviourTree/composites/AbortTypes';
import { TaskStatus } from '../../../behaviourTree/TaskStatus';
import { TestUtils, TestContext } from '../../utils/TestUtils';

describe('优先级系统测试', () => {
  let context: TestContext;

  beforeEach(() => {
    context = TestUtils.createTestContext();
  });

  // 测试基本优先级概念
  describe('基本优先级概念测试', () => {
    test('Selector应该按子节点顺序确定优先级', () => {
      const selector = new Selector<TestContext>();
      
      // 高优先级：第一个子节点
      const highPriority = TestUtils.createSuccessBehavior<TestContext>('HighPriority');
      // 低优先级：第二个子节点
      const lowPriority = TestUtils.createSuccessBehavior<TestContext>('LowPriority');
      
      selector.addChild(highPriority);
      selector.addChild(lowPriority);
      
      const result = selector.tick(context);
      
      expect(result).toBe(TaskStatus.Success);
      expect(highPriority.updateCallCount).toBe(1);
      expect(lowPriority.updateCallCount).toBe(0); // 不应该执行
    });

    test('Sequence应该按子节点顺序执行', () => {
      const sequence = new Sequence<TestContext>();
      
      const first = TestUtils.createSuccessBehavior<TestContext>('First');
      const second = TestUtils.createSuccessBehavior<TestContext>('Second');
      
      sequence.addChild(first);
      sequence.addChild(second);
      
      // 第一次tick：执行第一个节点
      let result = sequence.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(first.updateCallCount).toBe(1);
      expect(second.updateCallCount).toBe(0);
      
      // 第二次tick：执行第二个节点
      result = sequence.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(second.updateCallCount).toBe(1);
    });

    test('高优先级失败时应该尝试低优先级', () => {
      const selector = new Selector<TestContext>();
      
      const highPriority = TestUtils.createFailureBehavior<TestContext>('HighPriority');
      const lowPriority = TestUtils.createSuccessBehavior<TestContext>('LowPriority');
      
      selector.addChild(highPriority);
      selector.addChild(lowPriority);
      
      // 第一次tick：高优先级失败，返回Running
      let result = selector.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(highPriority.updateCallCount).toBe(1);
      expect(lowPriority.updateCallCount).toBe(0);
      
      // 第二次tick：执行低优先级，成功
      result = selector.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(lowPriority.updateCallCount).toBe(1);
    });
  });

  // 测试中止类型对优先级的影响
  describe('中止类型对优先级的影响测试', () => {
    test('None类型不应该影响正常的优先级执行', () => {
      const selector = new Selector<TestContext>(AbortTypes.None);
      
      const child1 = TestUtils.createSuccessBehavior<TestContext>('Child1');
      const child2 = TestUtils.createSuccessBehavior<TestContext>('Child2');
      
      selector.addChild(child1);
      selector.addChild(child2);
      
      const result = selector.tick(context);
      
      expect(result).toBe(TaskStatus.Success);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(0);
    });

    test('Self类型应该允许自中止', () => {
      const selector = new Selector<TestContext>(AbortTypes.Self);
      
      const child = TestUtils.createSuccessBehavior<TestContext>('Child');
      selector.addChild(child);
      
      const result = selector.tick(context);
      
      expect(result).toBe(TaskStatus.Success);
      expect(child.updateCallCount).toBe(1);
      expect(selector.abortType).toBe(AbortTypes.Self);
    });

    test('LowerPriority类型应该允许低优先级中止', () => {
      const selector = new Selector<TestContext>(AbortTypes.LowerPriority);
      
      const child = TestUtils.createSuccessBehavior<TestContext>('Child');
      selector.addChild(child);
      
      const result = selector.tick(context);
      
      expect(result).toBe(TaskStatus.Success);
      expect(child.updateCallCount).toBe(1);
      expect(selector.abortType).toBe(AbortTypes.LowerPriority);
    });

    test('Both类型应该同时支持Self和LowerPriority', () => {
      const selector = new Selector<TestContext>(AbortTypes.Both);
      
      const child = TestUtils.createSuccessBehavior<TestContext>('Child');
      selector.addChild(child);
      
      const result = selector.tick(context);
      
      expect(result).toBe(TaskStatus.Success);
      expect(child.updateCallCount).toBe(1);
      expect(selector.abortType).toBe(AbortTypes.Both);
    });
  });

  // 测试嵌套优先级
  describe('嵌套优先级测试', () => {
    test('嵌套的Selector应该保持优先级顺序', () => {
      const rootSelector = new Selector<TestContext>();
      const nestedSelector = new Selector<TestContext>();
      
      // 根选择器的高优先级分支
      const highPriority = TestUtils.createSuccessBehavior<TestContext>('HighPriority');
      
      // 嵌套选择器作为低优先级分支
      const nestedChild1 = TestUtils.createFailureBehavior<TestContext>('NestedChild1');
      const nestedChild2 = TestUtils.createSuccessBehavior<TestContext>('NestedChild2');
      
      nestedSelector.addChild(nestedChild1);
      nestedSelector.addChild(nestedChild2);
      
      rootSelector.addChild(highPriority);
      rootSelector.addChild(nestedSelector);
      
      const result = rootSelector.tick(context);
      
      expect(result).toBe(TaskStatus.Success);
      expect(highPriority.updateCallCount).toBe(1);
      expect(nestedChild1.updateCallCount).toBe(0); // 不应该执行
      expect(nestedChild2.updateCallCount).toBe(0); // 不应该执行
    });

    test('嵌套的Sequence应该按顺序执行', () => {
      const rootSequence = new Sequence<TestContext>();
      const nestedSequence = new Sequence<TestContext>();
      
      // 根序列的第一个子节点
      const firstChild = TestUtils.createSuccessBehavior<TestContext>('FirstChild');
      
      // 嵌套序列作为第二个子节点
      const nestedChild1 = TestUtils.createSuccessBehavior<TestContext>('NestedChild1');
      const nestedChild2 = TestUtils.createSuccessBehavior<TestContext>('NestedChild2');
      
      nestedSequence.addChild(nestedChild1);
      nestedSequence.addChild(nestedChild2);
      
      rootSequence.addChild(firstChild);
      rootSequence.addChild(nestedSequence);
      
      // 第一次tick：执行第一个子节点
      let result = rootSequence.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(firstChild.updateCallCount).toBe(1);
      expect(nestedChild1.updateCallCount).toBe(0);
      
      // 第二次tick：开始执行嵌套序列
      result = rootSequence.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(nestedChild1.updateCallCount).toBe(1);
      expect(nestedChild2.updateCallCount).toBe(0);
    });
  });

  // 测试优先级一致性
  describe('优先级一致性测试', () => {
    test('多次执行应该保持相同的优先级顺序', () => {
      const selector = new Selector<TestContext>();
      
      const child1 = TestUtils.createSuccessBehavior<TestContext>('Child1');
      const child2 = TestUtils.createSuccessBehavior<TestContext>('Child2');
      const child3 = TestUtils.createSuccessBehavior<TestContext>('Child3');
      
      selector.addChild(child1);
      selector.addChild(child2);
      selector.addChild(child3);
      
      // 多次执行，应该总是选择第一个子节点
      for (let i = 0; i < 5; i++) {
        selector.invalidate();
        child1.reset();
        child2.reset();
        child3.reset();
        
        const result = selector.tick(context);
        
        expect(result).toBe(TaskStatus.Success);
        expect(child1.updateCallCount).toBe(1);
        expect(child2.updateCallCount).toBe(0);
        expect(child3.updateCallCount).toBe(0);
      }
    });

    test('状态重置后应该重新开始优先级检查', () => {
      const selector = new Selector<TestContext>();
      
      const child1 = TestUtils.createFailureBehavior<TestContext>('Child1');
      const child2 = TestUtils.createSuccessBehavior<TestContext>('Child2');
      
      selector.addChild(child1);
      selector.addChild(child2);
      
      // 第一轮执行
      let result = selector.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(child1.updateCallCount).toBe(1);
      
      result = selector.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(child2.updateCallCount).toBe(1);
      
      // 重置状态
      selector.invalidate();
      child1.reset();
      child2.reset();
      
      // 第二轮执行，应该重新从第一个子节点开始
      result = selector.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(child1.updateCallCount).toBe(1);
      expect(child2.updateCallCount).toBe(0);
    });
  });

  // 测试复杂优先级场景
  describe('复杂优先级场景测试', () => {
    test('混合Selector和Sequence的优先级', () => {
      const rootSelector = new Selector<TestContext>();
      
      // 高优先级：失败的简单节点
      const highPriority = TestUtils.createFailureBehavior<TestContext>('HighPriority');
      
      // 低优先级：成功的序列
      const lowPrioritySequence = new Sequence<TestContext>();
      const seqChild1 = TestUtils.createSuccessBehavior<TestContext>('SeqChild1');
      const seqChild2 = TestUtils.createSuccessBehavior<TestContext>('SeqChild2');
      
      lowPrioritySequence.addChild(seqChild1);
      lowPrioritySequence.addChild(seqChild2);
      
      rootSelector.addChild(highPriority);
      rootSelector.addChild(lowPrioritySequence);
      
      // 第一次tick：高优先级失败，返回Running
      let result = rootSelector.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(highPriority.updateCallCount).toBe(1);
      expect(seqChild1.updateCallCount).toBe(0);
      
      // 第二次tick：开始执行低优先级序列
      result = rootSelector.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(seqChild1.updateCallCount).toBe(1);
      expect(seqChild2.updateCallCount).toBe(0);
    });

    test('深层嵌套的优先级应该正确工作', () => {
      const level1 = new Selector<TestContext>();
      const level2 = new Selector<TestContext>();
      const level3 = new Sequence<TestContext>();
      
      const deepChild = TestUtils.createSuccessBehavior<TestContext>('DeepChild');
      const shallowChild = TestUtils.createSuccessBehavior<TestContext>('ShallowChild');
      
      level3.addChild(deepChild);
      level2.addChild(level3);
      level1.addChild(level2);
      level1.addChild(shallowChild);
      
      const result = level1.tick(context);
      
      expect(result).toBe(TaskStatus.Success);
      expect(deepChild.updateCallCount).toBe(1);
      expect(shallowChild.updateCallCount).toBe(0); // 不应该执行
    });
  });

  // 测试性能
  describe('性能测试', () => {
    test('大量优先级节点应该高效处理', () => {
      const selector = new Selector<TestContext>();
      
      // 添加大量失败的高优先级节点
      for (let i = 0; i < 50; i++) {
        selector.addChild(TestUtils.createFailureBehavior<TestContext>(`FailChild${i}`));
      }
      
      // 最后添加一个成功的节点
      selector.addChild(TestUtils.createSuccessBehavior<TestContext>('SuccessChild'));
      
      const startTime = performance.now();
      
      // 执行直到完成
      let result = TaskStatus.Running;
      let tickCount = 0;
      while (result === TaskStatus.Running && tickCount < 100) {
        result = selector.tick(context);
        tickCount++;
      }
      
      const endTime = performance.now();
      
      expect(result).toBe(TaskStatus.Success);
      expect(endTime - startTime).toBeLessThan(50); // 应该在50ms内完成
      expect(tickCount).toBeLessThanOrEqual(51); // 最多51次tick
    });
  });
});
