/**
 * WaitAction 动作节点简化测试
 * 
 * 测试等待指定时间的行为节点的核心功能
 */
import { WaitAction } from '../../../behaviourTree/actions/WaitAction';
import { TaskStatus } from '../../../behaviourTree/TaskStatus';
import { TestUtils, TestContext } from '../../utils/TestUtils';

// 扩展测试上下文以支持时间管理
interface TimeTestContext extends TestContext {
  deltaTime: number;
}

describe('WaitAction 动作节点简化测试', () => {
  let context: TestContext;
  let timeContext: TimeTestContext;

  beforeEach(() => {
    context = TestUtils.createTestContext();
    timeContext = {
      ...context,
      deltaTime: 0.016 // 模拟60FPS，每帧约16ms
    };
  });

  // 测试基本功能
  describe('基本功能测试', () => {
    test('应该能创建WaitAction实例', () => {
      const waitAction = new WaitAction<TestContext>(1.0);
      expect(waitAction).toBeDefined();
      expect(waitAction.status).toBe(TaskStatus.Invalid);
      expect(waitAction.waitTime).toBe(1.0);
    });

    test('第一次tick应该返回Running', () => {
      const waitAction = new WaitAction<TestContext>(1.0);

      const result = waitAction.tick(context);

      expect(result).toBe(TaskStatus.Running);
      expect(waitAction.status).toBe(TaskStatus.Running);
    });

    test('等待时间为0应该抛出错误', () => {
      expect(() => {
        new WaitAction<TestContext>(0);
      }).toThrow('等待时间必须大于0');
    });

    test('负数等待时间应该抛出错误', () => {
      expect(() => {
        new WaitAction<TestContext>(-1.0);
      }).toThrow('等待时间必须大于0');
    });

    test('应该能等待很短的时间', async () => {
      const waitTime = 0.05; // 50ms
      const waitAction = new WaitAction<TestContext>(waitTime);

      const startTime = performance.now();
      let result = TaskStatus.Running;

      // 持续tick直到完成
      while (result === TaskStatus.Running) {
        result = waitAction.tick(context);
        await new Promise(resolve => setTimeout(resolve, 5)); // 等待5ms
      }

      const endTime = performance.now();
      const actualDuration = (endTime - startTime) / 1000;

      expect(result).toBe(TaskStatus.Success);
      expect(waitAction.status).toBe(TaskStatus.Success);
      expect(actualDuration).toBeGreaterThanOrEqual(waitTime * 0.8); // 允许20%误差
    });
  });

  // 测试外部时间管理
  describe('外部时间管理测试', () => {
    test('应该能使用外部deltaTime', () => {
      const waitTime = 0.3;
      const waitAction = new WaitAction<TimeTestContext>(waitTime, true);
      
      let tickCount = 0;
      let result = TaskStatus.Running;

      // 模拟固定的deltaTime
      timeContext.deltaTime = 0.1; // 每次100ms

      while (result === TaskStatus.Running && tickCount < 10) {
        result = waitAction.tick(timeContext);
        tickCount++;
      }

      expect(result).toBe(TaskStatus.Success);
      expect(tickCount).toBe(3); // 0.3秒 / 0.1秒 = 3次tick
    });

    test('应该能处理变化的deltaTime', () => {
      const waitTime = 0.6;
      const waitAction = new WaitAction<TimeTestContext>(waitTime, true);
      
      const deltaTimes = [0.1, 0.2, 0.3]; // 总计0.6秒
      let result = TaskStatus.Running;

      for (const deltaTime of deltaTimes) {
        if (result === TaskStatus.Running) {
          timeContext.deltaTime = deltaTime;
          result = waitAction.tick(timeContext);
        }
      }

      expect(result).toBe(TaskStatus.Success);
    });

    test('应该能处理无效的deltaTime', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const waitAction = new WaitAction<TimeTestContext>(0.1, true);

      // 测试负数deltaTime
      timeContext.deltaTime = -0.1;
      let result = waitAction.tick(timeContext);
      expect(result).toBe(TaskStatus.Running);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('无效的deltaTime值')
      );

      consoleSpy.mockRestore();
    });
  });

  // 测试状态管理
  describe('状态管理测试', () => {
    test('invalidate应该重置状态', () => {
      const waitAction = new WaitAction<TestContext>(1.0);

      // 执行一次，应该是Running
      let result = waitAction.tick(context);
      expect(result).toBe(TaskStatus.Running);

      // 重置状态
      waitAction.invalidate();
      expect(waitAction.status).toBe(TaskStatus.Invalid);

      // 再次执行应该重新开始计时
      result = waitAction.tick(context);
      expect(result).toBe(TaskStatus.Running);
    });

    test('多次tick应该累积时间', () => {
      const waitAction = new WaitAction<TimeTestContext>(0.3, true);
      timeContext.deltaTime = 0.1;

      // 第一次tick
      let result = waitAction.tick(timeContext);
      expect(result).toBe(TaskStatus.Running);

      // 第二次tick
      result = waitAction.tick(timeContext);
      expect(result).toBe(TaskStatus.Running);

      // 第三次tick - 应该完成
      result = waitAction.tick(timeContext);
      expect(result).toBe(TaskStatus.Success);
    });

    test('完成后再次tick应该保持Success状态', () => {
      const waitAction = new WaitAction<TimeTestContext>(0.1, true);
      timeContext.deltaTime = 0.2; // 超过等待时间

      // 第一次tick应该完成
      let result = waitAction.tick(timeContext);
      expect(result).toBe(TaskStatus.Success);

      // 再次tick应该保持Success
      result = waitAction.tick(timeContext);
      expect(result).toBe(TaskStatus.Success);
    });
  });

  // 测试进度查询
  describe('进度查询测试', () => {
    test('getProgress应该返回正确的进度', () => {
      const waitAction = new WaitAction<TimeTestContext>(1.0, true);
      timeContext.deltaTime = 0.25;

      expect(waitAction.getProgress()).toBe(0);

      // 第一次tick - 25%
      waitAction.tick(timeContext);
      expect(waitAction.getProgress()).toBeCloseTo(0.25, 2);

      // 第二次tick - 50%
      waitAction.tick(timeContext);
      expect(waitAction.getProgress()).toBeCloseTo(0.5, 2);

      // 第三次tick - 75%
      waitAction.tick(timeContext);
      expect(waitAction.getProgress()).toBeCloseTo(0.75, 2);

      // 第四次tick - 100%
      waitAction.tick(timeContext);
      expect(waitAction.getProgress()).toBe(1.0);
    });

    test('isCompleted应该正确反映完成状态', () => {
      const waitAction = new WaitAction<TimeTestContext>(0.2, true);
      timeContext.deltaTime = 0.1;

      expect(waitAction.isCompleted()).toBe(false);

      // 第一次tick - 未完成
      waitAction.tick(timeContext);
      expect(waitAction.isCompleted()).toBe(false);

      // 第二次tick - 完成
      waitAction.tick(timeContext);
      expect(waitAction.isCompleted()).toBe(true);
    });
  });

  // 测试动态配置
  describe('动态配置测试', () => {
    test('setWaitTime应该能修改等待时间', () => {
      const waitAction = new WaitAction<TestContext>(1.0);

      waitAction.setWaitTime(2.0);
      expect(waitAction.waitTime).toBe(2.0);
    });

    test('setWaitTime应该验证参数有效性', () => {
      const waitAction = new WaitAction<TestContext>(1.0);

      expect(() => {
        waitAction.setWaitTime(0);
      }).toThrow('等待时间必须大于0');

      expect(() => {
        waitAction.setWaitTime(-1);
      }).toThrow('等待时间必须大于0');
    });
  });

  // 测试性能
  describe('性能测试', () => {
    test('大量tick操作应该高效执行', () => {
      const waitAction = new WaitAction<TimeTestContext>(10.0, true);
      timeContext.deltaTime = 0.001; // 1ms每次

      const startTime = performance.now();
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        waitAction.tick(timeContext);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // 应该在100ms内完成
      expect(waitAction.getProgress()).toBeCloseTo(0.1, 1); // 1000 * 0.001 / 10 = 0.1
    });
  });

  // 测试实际使用场景
  describe('实际使用场景测试', () => {
    test('技能冷却时间', () => {
      const cooldownAction = new WaitAction<TimeTestContext>(1.0, true); // 1秒冷却
      timeContext.deltaTime = 0.5; // 每次500ms

      // 第一次tick - 50%
      let result = cooldownAction.tick(timeContext);
      expect(result).toBe(TaskStatus.Running);
      expect(cooldownAction.getProgress()).toBeCloseTo(0.5, 2);

      // 第二次tick - 100%，冷却完成
      result = cooldownAction.tick(timeContext);
      expect(result).toBe(TaskStatus.Success);
      expect(cooldownAction.isCompleted()).toBe(true);
    });

    test('延迟执行', () => {
      const delayAction = new WaitAction<TimeTestContext>(0.3, true); // 300ms延迟
      timeContext.deltaTime = 0.1;

      const results: TaskStatus[] = [];
      for (let i = 0; i < 4; i++) {
        results.push(delayAction.tick(timeContext));
      }

      expect(results).toEqual([
        TaskStatus.Running, // 0.1s
        TaskStatus.Running, // 0.2s
        TaskStatus.Success, // 0.3s - 完成
        TaskStatus.Success  // 保持成功状态
      ]);
    });
  });
});
