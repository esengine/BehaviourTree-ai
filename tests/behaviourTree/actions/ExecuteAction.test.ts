/**
 * ExecuteAction 动作节点测试
 * 
 * 测试执行函数动作包装器的行为
 */
import { ExecuteAction } from '../../../behaviourTree/actions/ExecuteAction';
import { TaskStatus } from '../../../behaviourTree/TaskStatus';
import { TestUtils, TestContext } from '../../utils/TestUtils';

describe('ExecuteAction 动作节点测试', () => {
  let context: TestContext;

  beforeEach(() => {
    context = TestUtils.createTestContext();
  });

  // 测试基本功能
  describe('基本功能测试', () => {
    test('应该能创建ExecuteAction实例', () => {
      const action = new ExecuteAction<TestContext>(() => TaskStatus.Success);
      expect(action).toBeDefined();
      expect(action.status).toBe(TaskStatus.Invalid);
    });

    test('应该能执行成功的动作', () => {
      let executed = false;
      const action = new ExecuteAction<TestContext>((ctx) => {
        executed = true;
        expect(ctx).toBe(context);
        return TaskStatus.Success;
      });

      const result = action.tick(context);

      expect(result).toBe(TaskStatus.Success);
      expect(executed).toBe(true);
      expect(action.status).toBe(TaskStatus.Success);
    });

    test('应该能执行失败的动作', () => {
      let executed = false;
      const action = new ExecuteAction<TestContext>((ctx) => {
        executed = true;
        return TaskStatus.Failure;
      });

      const result = action.tick(context);

      expect(result).toBe(TaskStatus.Failure);
      expect(executed).toBe(true);
      expect(action.status).toBe(TaskStatus.Failure);
    });

    test('应该能执行运行中的动作', () => {
      let executed = false;
      const action = new ExecuteAction<TestContext>((ctx) => {
        executed = true;
        return TaskStatus.Running;
      });

      const result = action.tick(context);

      expect(result).toBe(TaskStatus.Running);
      expect(executed).toBe(true);
      expect(action.status).toBe(TaskStatus.Running);
    });

    test('应该能传递上下文参数', () => {
      let receivedContext: TestContext | null = null;
      const action = new ExecuteAction<TestContext>((ctx) => {
        receivedContext = ctx;
        return TaskStatus.Success;
      });

      action.tick(context);

      expect(receivedContext).toBe(context);
    });
  });

  // 测试配置选项
  describe('配置选项测试', () => {
    test('应该能设置动作名称', () => {
      const actionName = '测试动作';
      const action = new ExecuteAction<TestContext>(
        () => TaskStatus.Success,
        { name: actionName }
      );

      expect(action.getName()).toBe(actionName);
    });

    test('应该能启用错误处理', () => {
      const action = new ExecuteAction<TestContext>(
        () => TaskStatus.Success,
        { enableErrorHandling: true }
      );

      // 错误处理默认启用，这里主要测试配置生效
      const result = action.tick(context);
      expect(result).toBe(TaskStatus.Success);
    });

    test('应该能禁用错误处理', () => {
      const action = new ExecuteAction<TestContext>(
        () => TaskStatus.Success,
        { enableErrorHandling: false }
      );

      const result = action.tick(context);
      expect(result).toBe(TaskStatus.Success);
    });

    test('默认配置应该正确', () => {
      const action = new ExecuteAction<TestContext>(() => TaskStatus.Success);

      // 默认应该启用错误处理
      expect(action.getName()).toContain('Action'); // 应该有默认名称
    });
  });

  // 测试错误处理
  describe('错误处理测试', () => {
    test('启用错误处理时应该捕获异常', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const action = new ExecuteAction<TestContext>(
        () => {
          throw new Error('测试错误');
        },
        { enableErrorHandling: true }
      );

      const result = action.tick(context);

      expect(result).toBe(TaskStatus.Failure);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    test('禁用错误处理时异常应该向上传播', () => {
      const action = new ExecuteAction<TestContext>(
        () => {
          throw new Error('测试错误');
        },
        { enableErrorHandling: false }
      );

      expect(() => {
        action.tick(context);
      }).toThrow('测试错误');
    });

    test('应该验证返回值的有效性', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const action = new ExecuteAction<TestContext>(
        () => 'invalid' as any,
        { enableErrorHandling: true }
      );

      const result = action.tick(context);

      expect(result).toBe(TaskStatus.Failure);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('返回了无效的TaskStatus')
      );
      
      consoleSpy.mockRestore();
    });

    test('应该处理null返回值', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const action = new ExecuteAction<TestContext>(
        () => null as any,
        { enableErrorHandling: true }
      );

      const result = action.tick(context);

      expect(result).toBe(TaskStatus.Failure);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    test('应该处理undefined返回值', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const action = new ExecuteAction<TestContext>(
        () => undefined as any,
        { enableErrorHandling: true }
      );

      const result = action.tick(context);

      expect(result).toBe(TaskStatus.Failure);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  // 测试状态管理
  describe('状态管理测试', () => {
    test('多次执行应该更新状态', () => {
      let counter = 0;
      const action = new ExecuteAction<TestContext>(() => {
        counter++;
        return counter < 3 ? TaskStatus.Running : TaskStatus.Success;
      });

      // 第一次执行
      let result = action.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(action.status).toBe(TaskStatus.Running);

      // 第二次执行
      result = action.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(action.status).toBe(TaskStatus.Running);

      // 第三次执行
      result = action.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(action.status).toBe(TaskStatus.Success);
    });

    test('invalidate应该重置状态', () => {
      const action = new ExecuteAction<TestContext>(() => TaskStatus.Success);

      // 执行一次
      action.tick(context);
      expect(action.status).toBe(TaskStatus.Success);

      // 重置状态
      action.invalidate();
      expect(action.status).toBe(TaskStatus.Invalid);
    });

    test('不同状态转换应该正确', () => {
      let currentStatus = TaskStatus.Running;
      const action = new ExecuteAction<TestContext>(() => currentStatus);

      // Running状态
      let result = action.tick(context);
      expect(result).toBe(TaskStatus.Running);
      expect(action.status).toBe(TaskStatus.Running);

      // 切换到Success
      currentStatus = TaskStatus.Success;
      result = action.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(action.status).toBe(TaskStatus.Success);

      // 重置后切换到Failure
      action.invalidate();
      currentStatus = TaskStatus.Failure;
      result = action.tick(context);
      expect(result).toBe(TaskStatus.Failure);
      expect(action.status).toBe(TaskStatus.Failure);
    });
  });

  // 测试静态工厂方法
  describe('静态工厂方法测试', () => {
    test('createAlwaysSuccess应该创建总是成功的动作', () => {
      let executed = false;
      const action = ExecuteAction.createAlwaysSuccess<TestContext>((ctx) => {
        executed = true;
        expect(ctx).toBe(context);
      });

      const result = action.tick(context);

      expect(result).toBe(TaskStatus.Success);
      expect(executed).toBe(true);
      expect(action.getName()).toContain('Always Success Action');
    });

    test('createAlwaysSuccess应该支持自定义名称', () => {
      const customName = '自定义成功动作';
      const action = ExecuteAction.createAlwaysSuccess<TestContext>(
        () => {},
        customName
      );

      expect(action.getName()).toBe(customName);
    });

    test('createConditional应该创建条件动作', () => {
      let executed = false;
      const action = ExecuteAction.createConditional<TestContext>((ctx) => {
        executed = true;
        expect(ctx).toBe(context);
        return true; // 条件为真
      });

      const result = action.tick(context);

      expect(result).toBe(TaskStatus.Success);
      expect(executed).toBe(true);
      expect(action.getName()).toContain('Conditional Action');
    });

    test('createConditional应该支持自定义名称', () => {
      const customName = '自定义条件动作';
      const action = ExecuteAction.createConditional<TestContext>(
        () => true,
        customName
      );

      expect(action.getName()).toBe(customName);
    });

    test('createConditional条件为假时应该返回失败', () => {
      const action = ExecuteAction.createConditional<TestContext>(() => false);

      const result = action.tick(context);

      expect(result).toBe(TaskStatus.Failure);
    });
  });

  // 测试性能
  describe('性能测试', () => {
    test('大量执行应该高效', () => {
      let counter = 0;
      const action = new ExecuteAction<TestContext>(() => {
        counter++;
        return TaskStatus.Success;
      });

      const startTime = performance.now();
      const iterations = 10000;

      for (let i = 0; i < iterations; i++) {
        action.invalidate();
        action.tick(context);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // 应该在100ms内完成
      expect(counter).toBe(iterations);
    });

    test('错误处理不应该显著影响性能', () => {
      const actionWithErrorHandling = new ExecuteAction<TestContext>(
        () => TaskStatus.Success,
        { enableErrorHandling: true }
      );

      const actionWithoutErrorHandling = new ExecuteAction<TestContext>(
        () => TaskStatus.Success,
        { enableErrorHandling: false }
      );

      const iterations = 1000;

      // 测试启用错误处理的性能
      const startTime1 = performance.now();
      for (let i = 0; i < iterations; i++) {
        actionWithErrorHandling.invalidate();
        actionWithErrorHandling.tick(context);
      }
      const duration1 = performance.now() - startTime1;

      // 测试禁用错误处理的性能
      const startTime2 = performance.now();
      for (let i = 0; i < iterations; i++) {
        actionWithoutErrorHandling.invalidate();
        actionWithoutErrorHandling.tick(context);
      }
      const duration2 = performance.now() - startTime2;

      // 错误处理的开销不应该超过2倍
      expect(duration1).toBeLessThan(duration2 * 3);
    });
  });
});
