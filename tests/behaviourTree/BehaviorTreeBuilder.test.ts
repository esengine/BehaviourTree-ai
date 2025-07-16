/**
 * BehaviorTreeBuilder 类测试
 * 
 * 测试行为树构建器的流畅API和配置加载功能
 */
import { BehaviorTreeBuilder } from '../../behaviourTree/BehaviorTreeBuilder';
import { BehaviorTree } from '../../behaviourTree/BehaviorTree';
import { TaskStatus } from '../../behaviourTree/TaskStatus';
import { AbortTypes } from '../../behaviourTree/composites/AbortTypes';
import { TestUtils, TestContext } from '../utils/TestUtils';

describe('BehaviorTreeBuilder 类测试', () => {
  let context: TestContext;

  beforeEach(() => {
    context = TestUtils.createTestContext();
  });

  // 测试基本构建功能
  describe('基本构建功能测试', () => {
    test('应该能创建简单的行为树', () => {
      const tree = BehaviorTreeBuilder.begin(context)
        .logAction('测试日志')
        .build();

      expect(tree).toBeInstanceOf(BehaviorTree);
    });

    test('应该能创建带有动作节点的行为树', () => {
      let actionExecuted = false;
      
      const tree = BehaviorTreeBuilder.begin(context)
        .executeAction((ctx) => {
          actionExecuted = true;
          return TaskStatus.Success;
        })
        .build();

      tree.tick();
      expect(actionExecuted).toBe(true);
    });

    test('应该能创建带有条件节点的行为树', () => {
      const tree = BehaviorTreeBuilder.begin(context)
        .conditionalDecorator((ctx) => ctx.isConditionMet)
        .logAction('条件满足时执行')
        .endComposite()
        .build();

      expect(tree).toBeInstanceOf(BehaviorTree);
    });

    test('应该能创建等待动作', () => {
      const tree = BehaviorTreeBuilder.begin(context)
        .waitAction(0.1) // 等待100ms
        .build();

      expect(tree).toBeInstanceOf(BehaviorTree);
    });
  });

  // 测试复合节点构建
  describe('复合节点构建测试', () => {
    test('应该能创建Sequence节点', () => {
      const tree = BehaviorTreeBuilder.begin(context)
        .sequence()
          .logAction('第一个动作')
          .logAction('第二个动作')
          .logAction('第三个动作')
        .endComposite()
        .build();

      expect(tree).toBeInstanceOf(BehaviorTree);
    });

    test('应该能创建Selector节点', () => {
      const tree = BehaviorTreeBuilder.begin(context)
        .selector()
          .logAction('选项1')
          .logAction('选项2')
          .logAction('选项3')
        .endComposite()
        .build();

      expect(tree).toBeInstanceOf(BehaviorTree);
    });

    test('应该能创建Parallel节点', () => {
      const tree = BehaviorTreeBuilder.begin(context)
        .parallel()
          .logAction('并行任务1')
          .logAction('并行任务2')
          .logAction('并行任务3')
        .endComposite()
        .build();

      expect(tree).toBeInstanceOf(BehaviorTree);
    });

    test('应该能创建带中止类型的复合节点', () => {
      const tree = BehaviorTreeBuilder.begin(context)
        .selector(AbortTypes.LowerPriority)
          .logAction('高优先级任务')
          .logAction('低优先级任务')
        .endComposite()
        .build();

      expect(tree).toBeInstanceOf(BehaviorTree);
    });

    test('应该能创建嵌套的复合节点', () => {
      const tree = BehaviorTreeBuilder.begin(context)
        .selector()
          .sequence()
            .logAction('序列中的动作1')
            .logAction('序列中的动作2')
          .endComposite()
          .parallel()
            .logAction('并行中的动作1')
            .logAction('并行中的动作2')
          .endComposite()
        .endComposite()
        .build();

      expect(tree).toBeInstanceOf(BehaviorTree);
    });
  });

  // 测试装饰器节点构建
  describe('装饰器节点构建测试', () => {
    test('应该能创建Inverter装饰器', () => {
      const tree = BehaviorTreeBuilder.begin(context)
        .inverter()
          .logAction('被反转的动作')
        .endComposite()
        .build();

      expect(tree).toBeInstanceOf(BehaviorTree);
    });

    test('应该能创建Repeater装饰器', () => {
      const tree = BehaviorTreeBuilder.begin(context)
        .repeater(3)
          .logAction('重复执行的动作')
        .endComposite()
        .build();

      expect(tree).toBeInstanceOf(BehaviorTree);
    });

    test('应该能创建UntilSuccess装饰器', () => {
      const tree = BehaviorTreeBuilder.begin(context)
        .untilSuccess()
          .logAction('直到成功的动作')
        .endComposite()
        .build();

      expect(tree).toBeInstanceOf(BehaviorTree);
    });

    test('应该能创建UntilFail装饰器', () => {
      const tree = BehaviorTreeBuilder.begin(context)
        .untilFail()
          .logAction('直到失败的动作')
        .endComposite()
        .build();

      expect(tree).toBeInstanceOf(BehaviorTree);
    });

    test('应该能创建AlwaysSucceed装饰器', () => {
      const tree = BehaviorTreeBuilder.begin(context)
        .alwaysSucceed()
          .logAction('总是成功的动作')
        .endComposite()
        .build();

      expect(tree).toBeInstanceOf(BehaviorTree);
    });

    test('应该能创建AlwaysFail装饰器', () => {
      const tree = BehaviorTreeBuilder.begin(context)
        .alwaysFail()
          .logAction('总是失败的动作')
        .endComposite()
        .build();

      expect(tree).toBeInstanceOf(BehaviorTree);
    });
  });

  // 测试黑板操作
  describe('黑板操作测试', () => {
    test('应该能创建设置黑板值的动作', () => {
      const tree = BehaviorTreeBuilder.begin(context)
        .setBlackboardValue('testKey', 'testValue')
        .build();

      expect(tree).toBeInstanceOf(BehaviorTree);
    });

    test('应该能创建获取黑板值的条件', () => {
      const tree = BehaviorTreeBuilder.begin(context)
        .conditionalDecorator((ctx) => {
          return ctx.blackboard.getValue('testKey') === 'expectedValue';
        })
        .logAction('条件满足时执行')
        .endComposite()
        .build();

      expect(tree).toBeInstanceOf(BehaviorTree);
    });
  });

  // 测试构建错误处理
  describe('构建错误处理测试', () => {
    test('未调用endComposite应该抛出错误', () => {
      expect(() => {
        BehaviorTreeBuilder.begin(context)
          .sequence()
            .logAction('动作')
          // 缺少 endComposite()
          .build();
      }).toThrow();
    });

    test('多余的endComposite应该抛出错误', () => {
      expect(() => {
        BehaviorTreeBuilder.begin(context)
          .logAction('动作')
          .endComposite() // 多余的endComposite
          .build();
      }).toThrow();
    });

    test('空的行为树应该抛出错误', () => {
      expect(() => {
        BehaviorTreeBuilder.begin(context)
          .build();
      }).toThrow();
    });

    test('装饰器没有子节点应该抛出错误', () => {
      expect(() => {
        BehaviorTreeBuilder.begin(context)
          .inverter()
          .endComposite()
          .build();
      }).toThrow();
    });
  });

  // 测试复杂构建场景
  describe('复杂构建场景测试', () => {
    test('应该能构建复杂的AI行为树', () => {
      let patrolExecuted = false;
      let attackExecuted = false;
      let fleeExecuted = false;

      const tree = BehaviorTreeBuilder.begin(context)
        .selector(AbortTypes.Self)
          // 高优先级：逃跑
          .conditionalDecorator((ctx) => ctx.testValue < 20) // 生命值低于20
          .sequence()
            .executeAction((ctx) => {
              fleeExecuted = true;
              return TaskStatus.Success;
            })
          .endComposite()
          
          // 中优先级：攻击
          .conditionalDecorator((ctx) => ctx.isConditionMet) // 发现敌人
          .sequence()
            .executeAction((ctx) => {
              attackExecuted = true;
              return TaskStatus.Success;
            })
          .endComposite()
          
          // 低优先级：巡逻
          .executeAction((ctx) => {
            patrolExecuted = true;
            return TaskStatus.Success;
          })
        .endComposite()
        .build();

      // 测试默认情况（巡逻）
      tree.tick();
      expect(patrolExecuted).toBe(true);
      expect(attackExecuted).toBe(false);
      expect(fleeExecuted).toBe(false);

      // 重置状态
      patrolExecuted = false;
      attackExecuted = false;
      fleeExecuted = false;

      // 测试攻击情况
      context.isConditionMet = true;
      tree.tick();
      expect(patrolExecuted).toBe(false);
      expect(attackExecuted).toBe(true);
      expect(fleeExecuted).toBe(false);

      // 重置状态
      patrolExecuted = false;
      attackExecuted = false;
      fleeExecuted = false;

      // 测试逃跑情况
      context.testValue = 10; // 生命值低
      tree.tick();
      expect(patrolExecuted).toBe(false);
      expect(attackExecuted).toBe(false);
      expect(fleeExecuted).toBe(true);
    });

    test('应该能构建带有多层嵌套的行为树', () => {
      const tree = BehaviorTreeBuilder.begin(context)
        .sequence()
          .selector()
            .sequence()
              .logAction('深层嵌套动作1')
              .logAction('深层嵌套动作2')
            .endComposite()
            .logAction('选择器备选方案')
          .endComposite()
          .parallel()
            .logAction('并行任务1')
            .logAction('并行任务2')
          .endComposite()
        .endComposite()
        .build();

      expect(tree).toBeInstanceOf(BehaviorTree);
    });
  });
});
