/**
 * Repeater 装饰器测试
 * 
 * 测试重复装饰器的各种重复模式和控制逻辑
 */
import { Repeater } from '../../../behaviourTree/decorators/Repeater';
import { TaskStatus } from '../../../behaviourTree/TaskStatus';
import { TestUtils, TestContext, MockBehavior } from '../../utils/TestUtils';

describe('Repeater 装饰器测试', () => {
  let context: TestContext;
  let childBehavior: MockBehavior<TestContext>;

  beforeEach(() => {
    context = TestUtils.createTestContext();
    childBehavior = TestUtils.createSuccessBehavior<TestContext>('TestChild');
  });

  // 测试基本功能
  describe('基本功能测试', () => {
    test('应该能创建Repeater实例', () => {
      const repeater = new Repeater<TestContext>(3);
      expect(repeater).toBeDefined();
      expect(repeater.status).toBe(TaskStatus.Invalid);
      expect(repeater.count).toBe(3);
      expect(repeater.endOnFailure).toBe(false);
      expect(repeater.endOnSuccess).toBe(false);
    });

    test('构造函数参数验证', () => {
      // 有效参数
      expect(() => new Repeater<TestContext>(1)).not.toThrow();
      expect(() => new Repeater<TestContext>(-1)).not.toThrow();
      expect(() => new Repeater<TestContext>(5, true, false)).not.toThrow();
      
      // 无效参数
      expect(() => new Repeater<TestContext>(0)).toThrow('重复次数必须是正整数或-1（无限重复）');
      expect(() => new Repeater<TestContext>(-2)).toThrow('重复次数必须是正整数或-1（无限重复）');
      expect(() => new Repeater<TestContext>(1.5)).toThrow('重复次数必须是正整数或-1（无限重复）');
    });

    test('重复指定次数后应该返回成功', () => {
      const repeater = new Repeater<TestContext>(3);
      repeater.child = childBehavior;
      
      // 第一次执行
      let result = repeater.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(repeater.getIterationCount()).toBe(1);
      expect(childBehavior.updateCallCount).toBe(1);
      
      // 第二次执行
      result = repeater.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(repeater.getIterationCount()).toBe(2);
      expect(childBehavior.updateCallCount).toBe(2);
      
      // 第三次执行，完成
      result = repeater.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(repeater.getIterationCount()).toBe(3);
      expect(childBehavior.updateCallCount).toBe(3);
    });

    test('子节点运行中时应该等待', () => {
      const repeater = new Repeater<TestContext>(2);
      childBehavior.setReturnStatus(TaskStatus.Running);
      repeater.child = childBehavior;
      
      // 第一次tick，子节点运行中
      let result = repeater.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(repeater.getIterationCount()).toBe(0); // 还没完成一次迭代
      expect(childBehavior.updateCallCount).toBe(1);
      
      // 第二次tick，子节点仍在运行
      result = repeater.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(repeater.getIterationCount()).toBe(0);
      expect(childBehavior.updateCallCount).toBe(2);
      
      // 子节点完成
      childBehavior.setReturnStatus(TaskStatus.Success);
      result = repeater.tick(context);
      expect(result).toBe(TaskStatus.Running); // 还需要再执行一次
      expect(repeater.getIterationCount()).toBe(1);
    });
  });

  // 测试无限重复
  describe('无限重复测试', () => {
    test('repeatForever属性应该正确工作', () => {
      const repeater = new Repeater<TestContext>(-1);
      expect(repeater.repeatForever).toBe(true);
      
      repeater.repeatForever = false;
      expect(repeater.count).toBeGreaterThan(0);
      expect(repeater.repeatForever).toBe(false);
      
      repeater.repeatForever = true;
      expect(repeater.count).toBe(-1);
      expect(repeater.repeatForever).toBe(true);
    });

    test('无限重复应该持续执行', () => {
      const repeater = new Repeater<TestContext>(-1);
      repeater.child = childBehavior;
      
      // 执行多次，应该一直返回Running
      for (let i = 1; i <= 10; i++) {
        const result = repeater.tick(context);
        expect(result).toBe(TaskStatus.Running);
        expect(repeater.getIterationCount()).toBe(i);
        expect(repeater.getRemainingCount()).toBe(-1);
        expect(repeater.getProgress()).toBe(-1);
      }
    });
  });

  // 测试停止条件
  describe('停止条件测试', () => {
    test('endOnFailure应该在子节点失败时停止', () => {
      const repeater = new Repeater<TestContext>(10, true, false);
      childBehavior.setReturnStatus(TaskStatus.Failure);
      repeater.child = childBehavior;
      
      const result = repeater.tick(context);
      
      expect(result).toBe(TaskStatus.Success);
      expect(repeater.getIterationCount()).toBe(1);
      expect(repeater.getLastChildStatus()).toBe(TaskStatus.Failure);
    });

    test('endOnSuccess应该在子节点成功时停止', () => {
      const repeater = new Repeater<TestContext>(10, false, true);
      childBehavior.setReturnStatus(TaskStatus.Success);
      repeater.child = childBehavior;
      
      const result = repeater.tick(context);
      
      expect(result).toBe(TaskStatus.Success);
      expect(repeater.getIterationCount()).toBe(1);
      expect(repeater.getLastChildStatus()).toBe(TaskStatus.Success);
    });

    test('同时设置endOnFailure和endOnSuccess', () => {
      const repeater = new Repeater<TestContext>(10, true, true);
      repeater.child = childBehavior;
      
      // 成功时停止
      childBehavior.setReturnStatus(TaskStatus.Success);
      let result = repeater.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(repeater.getIterationCount()).toBe(1);
      
      // 重置并测试失败时停止
      repeater.reset();
      childBehavior.reset();
      childBehavior.setReturnStatus(TaskStatus.Failure);
      result = repeater.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(repeater.getIterationCount()).toBe(1);
    });
  });

  // 测试静态工厂方法
  describe('静态工厂方法测试', () => {
    test('createUntilSuccess应该创建正确的实例', () => {
      const repeater = Repeater.createUntilSuccess<TestContext>();
      expect(repeater.count).toBe(-1);
      expect(repeater.endOnFailure).toBe(false);
      expect(repeater.endOnSuccess).toBe(true);
      
      const limitedRepeater = Repeater.createUntilSuccess<TestContext>(5);
      expect(limitedRepeater.count).toBe(5);
      expect(limitedRepeater.endOnSuccess).toBe(true);
    });

    test('createUntilFailure应该创建正确的实例', () => {
      const repeater = Repeater.createUntilFailure<TestContext>();
      expect(repeater.count).toBe(-1);
      expect(repeater.endOnFailure).toBe(true);
      expect(repeater.endOnSuccess).toBe(false);
    });

    test('createInfinite应该创建正确的实例', () => {
      const repeater = Repeater.createInfinite<TestContext>();
      expect(repeater.count).toBe(-1);
      expect(repeater.endOnFailure).toBe(false);
      expect(repeater.endOnSuccess).toBe(false);
    });

    test('untilSuccess实际使用场景', () => {
      const repeater = Repeater.createUntilSuccess<TestContext>(3);
      childBehavior.setReturnStatus(TaskStatus.Failure);
      repeater.child = childBehavior;
      
      // 前两次失败
      let result = repeater.tick(context);
      expect(result).toBe(TaskStatus.Running);
      result = repeater.tick(context);
      expect(result).toBe(TaskStatus.Running);
      
      // 第三次成功，应该停止
      childBehavior.setReturnStatus(TaskStatus.Success);
      result = repeater.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(repeater.getIterationCount()).toBe(3);
    });
  });

  // 测试状态查询方法
  describe('状态查询方法测试', () => {
    test('getIterationCount应该返回正确的执行次数', () => {
      const repeater = new Repeater<TestContext>(3);
      repeater.child = childBehavior;
      
      expect(repeater.getIterationCount()).toBe(0);
      
      repeater.tick(context);
      expect(repeater.getIterationCount()).toBe(1);
      
      repeater.tick(context);
      expect(repeater.getIterationCount()).toBe(2);
    });

    test('getRemainingCount应该返回正确的剩余次数', () => {
      const repeater = new Repeater<TestContext>(3);
      repeater.child = childBehavior;
      
      expect(repeater.getRemainingCount()).toBe(3);
      
      repeater.tick(context);
      expect(repeater.getRemainingCount()).toBe(2);
      
      repeater.tick(context);
      expect(repeater.getRemainingCount()).toBe(1);
      
      repeater.tick(context);
      expect(repeater.getRemainingCount()).toBe(0);
    });

    test('getProgress应该返回正确的进度', () => {
      const repeater = new Repeater<TestContext>(4);
      repeater.child = childBehavior;
      
      expect(repeater.getProgress()).toBe(0);
      
      repeater.tick(context);
      expect(repeater.getProgress()).toBe(0.25);
      
      repeater.tick(context);
      expect(repeater.getProgress()).toBe(0.5);
      
      repeater.tick(context);
      expect(repeater.getProgress()).toBe(0.75);
      
      repeater.tick(context);
      expect(repeater.getProgress()).toBe(1.0);
    });

    test('getLastChildStatus应该返回最后的子节点状态', () => {
      const repeater = new Repeater<TestContext>(2);
      repeater.child = childBehavior;
      
      expect(repeater.getLastChildStatus()).toBe(TaskStatus.Invalid);
      
      childBehavior.setReturnStatus(TaskStatus.Success);
      repeater.tick(context);
      expect(repeater.getLastChildStatus()).toBe(TaskStatus.Success);
      
      childBehavior.setReturnStatus(TaskStatus.Failure);
      repeater.tick(context);
      expect(repeater.getLastChildStatus()).toBe(TaskStatus.Failure);
    });
  });

  // 测试重置功能
  describe('重置功能测试', () => {
    test('reset应该重置所有状态', () => {
      const repeater = new Repeater<TestContext>(3);
      repeater.child = childBehavior;

      // 执行几次
      repeater.tick(context);
      repeater.tick(context);

      expect(repeater.getIterationCount()).toBe(2);
      expect(repeater.getLastChildStatus()).toBe(TaskStatus.Success);

      // 重置
      repeater.reset();

      expect(repeater.getIterationCount()).toBe(0);
      expect(repeater.getLastChildStatus()).toBe(TaskStatus.Invalid);
      expect(childBehavior.status).toBe(TaskStatus.Invalid);
    });

    test('invalidate应该调用onStart重置状态', () => {
      const repeater = new Repeater<TestContext>(3);
      repeater.child = childBehavior;

      // 执行几次
      repeater.tick(context);
      repeater.tick(context);

      expect(repeater.getIterationCount()).toBe(2);

      // invalidate应该重置状态
      repeater.invalidate();

      // 下次tick应该从头开始
      const result = repeater.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(repeater.getIterationCount()).toBe(1);
    });
  });

  // 测试边界情况
  describe('边界情况测试', () => {
    test('没有子节点时应该抛出错误', () => {
      const repeater = new Repeater<TestContext>(3);

      expect(() => {
        repeater.tick(context);
      }).toThrow('子节点不能为空');
    });

    test('子节点为null时应该抛出错误', () => {
      const repeater = new Repeater<TestContext>(3);
      repeater.child = null as any;

      expect(() => {
        repeater.tick(context);
      }).toThrow('子节点不能为空');
    });

    test('重复次数为1时应该正常工作', () => {
      const repeater = new Repeater<TestContext>(1);
      repeater.child = childBehavior;

      const result = repeater.tick(context);

      expect(result).toBe(TaskStatus.Success);
      expect(repeater.getIterationCount()).toBe(1);
      expect(childBehavior.updateCallCount).toBe(1);
    });

    test('子节点返回Invalid状态时应该能处理', () => {
      const repeater = new Repeater<TestContext>(2);
      childBehavior.setReturnStatus(TaskStatus.Invalid);
      repeater.child = childBehavior;

      // Invalid状态被视为完成状态，会继续下一次迭代
      const result = repeater.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(repeater.getIterationCount()).toBe(1);
      expect(repeater.getLastChildStatus()).toBe(TaskStatus.Invalid);
    });
  });

  // 测试性能
  describe('性能测试', () => {
    test('大量重复应该高效执行', () => {
      const repeater = new Repeater<TestContext>(100);
      repeater.child = childBehavior;

      const startTime = performance.now();

      let result: TaskStatus = TaskStatus.Running;
      let tickCount = 0;

      while (result !== TaskStatus.Success && tickCount < 200) {
        result = repeater.tick(context);
        tickCount++;
      }

      const endTime = performance.now();

      expect(result).toBe(TaskStatus.Success);
      expect(repeater.getIterationCount()).toBe(100);
      expect(endTime - startTime).toBeLessThan(100); // 应该在100ms内完成
    });

    test('无限重复的性能测试', () => {
      const repeater = new Repeater<TestContext>(-1);
      repeater.child = childBehavior;

      const startTime = performance.now();

      // 执行1000次迭代
      for (let i = 0; i < 1000; i++) {
        const result = repeater.tick(context);
        expect(result).toBe(TaskStatus.Running);
      }

      const endTime = performance.now();

      expect(repeater.getIterationCount()).toBe(1000);
      expect(endTime - startTime).toBeLessThan(200); // 应该在200ms内完成
    });
  });

  // 测试错误处理
  describe('错误处理测试', () => {
    test('子节点抛出异常时应该能处理', () => {
      const repeater = new Repeater<TestContext>(3);
      const errorChild = TestUtils.createMockBehavior<TestContext>(TaskStatus.Success, 'ErrorChild');
      errorChild.tick = () => {
        throw new Error('子节点执行错误');
      };
      repeater.child = errorChild;

      expect(() => {
        repeater.tick(context);
      }).toThrow('子节点执行错误');
    });

    test('上下文为null时应该能处理', () => {
      const repeater = new Repeater<TestContext>(2);
      repeater.child = childBehavior;

      const result = repeater.tick(null as any);

      expect(result).toBe(TaskStatus.Running);
      expect(repeater.getIterationCount()).toBe(1);
    });
  });

  // 测试实际使用场景
  describe('实际使用场景测试', () => {
    test('重复攻击直到敌人死亡', () => {
      const repeater = Repeater.createUntilSuccess<TestContext>(10);
      const attackAction = TestUtils.createMockBehavior<TestContext>(TaskStatus.Failure, 'AttackAction');
      repeater.child = attackAction;

      // 前几次攻击失败
      let result = repeater.tick(context);
      expect(result).toBe(TaskStatus.Running);
      result = repeater.tick(context);
      expect(result).toBe(TaskStatus.Running);
      result = repeater.tick(context);
      expect(result).toBe(TaskStatus.Running);

      // 最后一次攻击成功，敌人死亡
      attackAction.setReturnStatus(TaskStatus.Success);
      result = repeater.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(repeater.getIterationCount()).toBe(4);
    });

    test('巡逻路径重复', () => {
      const repeater = Repeater.createInfinite<TestContext>();
      const patrolAction = TestUtils.createMockBehavior<TestContext>(TaskStatus.Success, 'PatrolAction');
      repeater.child = patrolAction;

      // 应该能够无限巡逻
      for (let i = 1; i <= 50; i++) {
        const result = repeater.tick(context);
        expect(result).toBe(TaskStatus.Running);
        expect(repeater.getIterationCount()).toBe(i);
      }
    });

    test('尝试连接服务器直到成功', () => {
      const repeater = Repeater.createUntilSuccess<TestContext>(5);
      const connectAction = TestUtils.createMockBehavior<TestContext>(TaskStatus.Failure, 'ConnectAction');
      repeater.child = connectAction;

      // 前4次连接失败
      for (let i = 1; i <= 4; i++) {
        const result = repeater.tick(context);
        expect(result).toBe(TaskStatus.Running);
        expect(repeater.getIterationCount()).toBe(i);
      }

      // 第5次连接成功
      connectAction.setReturnStatus(TaskStatus.Success);
      const result = repeater.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(repeater.getIterationCount()).toBe(5);
    });

    test('收集资源直到背包满', () => {
      const repeater = new Repeater<TestContext>(10, false, true); // 成功时停止
      const collectAction = TestUtils.createMockBehavior<TestContext>(TaskStatus.Failure, 'CollectAction');
      repeater.child = collectAction;

      // 前几次收集失败（没有资源）
      let result = repeater.tick(context);
      expect(result).toBe(TaskStatus.Running);
      result = repeater.tick(context);
      expect(result).toBe(TaskStatus.Running);

      // 收集成功（背包满了）
      collectAction.setReturnStatus(TaskStatus.Success);
      result = repeater.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(repeater.getIterationCount()).toBe(3);
    });
  });
});
