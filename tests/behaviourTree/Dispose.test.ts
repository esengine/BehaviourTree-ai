/**
 * Dispose 功能测试
 *
 * 测试行为树节点和BehaviorTree的资源释放功能
 */
import { BehaviorTree } from '../../behaviourTree/BehaviorTree';
import { Behavior } from '../../behaviourTree/Behavior';
import { TaskStatus } from '../../behaviourTree/TaskStatus';
import { Sequence } from '../../behaviourTree/composites/Sequence';
import { Selector } from '../../behaviourTree/composites/Selector';
import { Inverter } from '../../behaviourTree/decorators/Inverter';
import { Blackboard, BlackboardValueType } from '../../behaviourTree/Blackboard';
import { TestUtils, TestContext, MockBehavior } from '../utils/TestUtils';

describe('Dispose 功能测试', () => {
  let context: TestContext;

  beforeEach(() => {
    context = TestUtils.createTestContext();
  });

  describe('Behavior基类dispose测试', () => {
    test('dispose后状态应该变为Invalid', () => {
      const behavior = TestUtils.createSuccessBehavior<TestContext>();
      behavior.tick(context);
      expect(behavior.status).toBe(TaskStatus.Success);

      behavior.dispose();
      expect(behavior.status).toBe(TaskStatus.Invalid);
    });
  });

  describe('Composite dispose测试', () => {
    test('Sequence dispose应该递归释放所有子节点', () => {
      const sequence = new Sequence<TestContext>();
      const child1 = TestUtils.createSuccessBehavior<TestContext>();
      const child2 = TestUtils.createSuccessBehavior<TestContext>();
      const child3 = TestUtils.createSuccessBehavior<TestContext>();

      sequence.addChild(child1);
      sequence.addChild(child2);
      sequence.addChild(child3);

      // 执行一次
      sequence.tick(context);

      // dispose
      sequence.dispose();

      // 验证所有节点状态为Invalid
      expect(sequence.status).toBe(TaskStatus.Invalid);
      expect(child1.status).toBe(TaskStatus.Invalid);
      expect(child2.status).toBe(TaskStatus.Invalid);
      expect(child3.status).toBe(TaskStatus.Invalid);
    });

    test('Selector dispose应该递归释放所有子节点', () => {
      const selector = new Selector<TestContext>();
      const child1 = TestUtils.createFailureBehavior<TestContext>();
      const child2 = TestUtils.createSuccessBehavior<TestContext>();

      selector.addChild(child1);
      selector.addChild(child2);

      selector.tick(context);
      selector.dispose();

      expect(selector.status).toBe(TaskStatus.Invalid);
      expect(child1.status).toBe(TaskStatus.Invalid);
      expect(child2.status).toBe(TaskStatus.Invalid);
    });

    test('嵌套Composite dispose应该递归释放所有层级', () => {
      const root = new Sequence<TestContext>();
      const childSequence = new Sequence<TestContext>();
      const leaf1 = TestUtils.createSuccessBehavior<TestContext>();
      const leaf2 = TestUtils.createSuccessBehavior<TestContext>();

      childSequence.addChild(leaf1);
      childSequence.addChild(leaf2);
      root.addChild(childSequence);

      root.tick(context);
      root.dispose();

      expect(root.status).toBe(TaskStatus.Invalid);
      expect(childSequence.status).toBe(TaskStatus.Invalid);
      expect(leaf1.status).toBe(TaskStatus.Invalid);
      expect(leaf2.status).toBe(TaskStatus.Invalid);
    });
  });

  describe('Decorator dispose测试', () => {
    test('Decorator dispose应该释放子节点', () => {
      const child = TestUtils.createFailureBehavior<TestContext>();
      const inverter = new Inverter<TestContext>();
      inverter.child = child;

      inverter.tick(context);
      expect(inverter.status).toBe(TaskStatus.Success);

      inverter.dispose();

      expect(inverter.status).toBe(TaskStatus.Invalid);
      expect(child.status).toBe(TaskStatus.Invalid);
    });

    test('嵌套Decorator dispose应该递归释放', () => {
      const leaf = TestUtils.createFailureBehavior<TestContext>();
      const innerInverter = new Inverter<TestContext>();
      innerInverter.child = leaf;
      const outerInverter = new Inverter<TestContext>();
      outerInverter.child = innerInverter;

      outerInverter.tick(context);
      outerInverter.dispose();

      expect(outerInverter.status).toBe(TaskStatus.Invalid);
      expect(innerInverter.status).toBe(TaskStatus.Invalid);
      expect(leaf.status).toBe(TaskStatus.Invalid);
    });
  });

  describe('BehaviorTree dispose测试', () => {
    test('BehaviorTree dispose应该释放根节点', () => {
      const root = TestUtils.createSuccessBehavior<TestContext>();
      const tree = new BehaviorTree(context, root, 0);

      tree.tick();
      tree.dispose();

      expect(root.status).toBe(TaskStatus.Invalid);
      expect(tree.getRoot()).toBeNull();
      expect(tree.getBlackboard()).toBeNull();
    });

    test('BehaviorTree dispose应该清空黑板变量', () => {
      const root = TestUtils.createSuccessBehavior<TestContext>();
      const blackboard = new Blackboard();
      blackboard.defineVariable('testVar', BlackboardValueType.Number, 100);

      const tree = new BehaviorTree(context, root, 0, false, blackboard);

      expect(blackboard.hasVariable('testVar')).toBe(true);

      tree.dispose();

      // 黑板引用被置空，原始blackboard对象的变量已被移除
      expect(blackboard.hasVariable('testVar')).toBe(false);
    });

    test('BehaviorTree dispose应该递归释放整个树结构', () => {
      const sequence = new Sequence<TestContext>();
      const child1 = TestUtils.createSuccessBehavior<TestContext>();
      const inverter = new Inverter<TestContext>();
      inverter.child = TestUtils.createFailureBehavior<TestContext>();

      sequence.addChild(child1);
      sequence.addChild(inverter);

      const tree = new BehaviorTree(context, sequence, 0);
      tree.tick();
      tree.dispose();

      expect(sequence.status).toBe(TaskStatus.Invalid);
      expect(child1.status).toBe(TaskStatus.Invalid);
      expect(inverter.status).toBe(TaskStatus.Invalid);
    });

    test('dispose后context应该被置空', () => {
      const root = TestUtils.createSuccessBehavior<TestContext>();
      const tree = new BehaviorTree(context, root, 0);

      tree.dispose();

      expect(tree.getContext()).toBeNull();
    });
  });

  describe('多次dispose调用测试', () => {
    test('多次调用dispose不应该抛出错误', () => {
      const behavior = TestUtils.createSuccessBehavior<TestContext>();

      expect(() => {
        behavior.dispose();
        behavior.dispose();
        behavior.dispose();
      }).not.toThrow();
    });

    test('BehaviorTree多次dispose不应该抛出错误', () => {
      const root = TestUtils.createSuccessBehavior<TestContext>();
      const tree = new BehaviorTree(context, root, 0);

      expect(() => {
        tree.dispose();
        tree.dispose();
        tree.dispose();
      }).not.toThrow();
    });
  });
});
