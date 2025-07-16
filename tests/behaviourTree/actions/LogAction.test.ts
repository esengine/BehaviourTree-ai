/**
 * LogAction 动作节点测试
 * 
 * 测试日志输出动作的行为
 */
import { LogAction } from '../../../behaviourTree/actions/LogAction';
import { TaskStatus } from '../../../behaviourTree/TaskStatus';
import { TestUtils, TestContext } from '../../utils/TestUtils';

describe('LogAction 动作节点测试', () => {
  let context: TestContext;
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    context = TestUtils.createTestContext();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  // 测试基本功能
  describe('基本功能测试', () => {
    test('应该能创建LogAction实例', () => {
      const logAction = new LogAction<TestContext>('测试消息');
      expect(logAction).toBeDefined();
      expect(logAction.status).toBe(TaskStatus.Invalid);
      expect(logAction.text).toBe('测试消息');
      expect(logAction.isError).toBe(false);
    });

    test('应该能输出普通日志', () => {
      const message = '这是一条测试日志';
      const logAction = new LogAction<TestContext>(message);

      const result = logAction.tick(context);

      expect(result).toBe(TaskStatus.Success);
      expect(logAction.status).toBe(TaskStatus.Success);
      expect(consoleSpy).toHaveBeenCalledWith(message);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test('应该能输出错误日志', () => {
      const message = '这是一条错误日志';
      const logAction = new LogAction<TestContext>(message);
      logAction.isError = true;

      const result = logAction.tick(context);

      expect(result).toBe(TaskStatus.Success);
      expect(logAction.status).toBe(TaskStatus.Success);
      expect(consoleErrorSpy).toHaveBeenCalledWith(message);
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    test('应该总是返回成功状态', () => {
      const logAction = new LogAction<TestContext>('测试');

      // 多次执行都应该返回成功
      for (let i = 0; i < 5; i++) {
        logAction.invalidate();
        const result = logAction.tick(context);
        expect(result).toBe(TaskStatus.Success);
        expect(logAction.status).toBe(TaskStatus.Success);
      }
    });
  });

  // 测试属性设置
  describe('属性设置测试', () => {
    test('应该能动态修改文本内容', () => {
      const logAction = new LogAction<TestContext>('初始消息');
      
      // 第一次执行
      logAction.tick(context);
      expect(consoleSpy).toHaveBeenCalledWith('初始消息');

      // 修改文本并再次执行
      logAction.invalidate();
      logAction.text = '修改后的消息';
      logAction.tick(context);
      expect(consoleSpy).toHaveBeenCalledWith('修改后的消息');
    });

    test('应该能动态切换日志类型', () => {
      const message = '测试消息';
      const logAction = new LogAction<TestContext>(message);

      // 普通日志
      logAction.tick(context);
      expect(consoleSpy).toHaveBeenCalledWith(message);
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      // 切换到错误日志
      logAction.invalidate();
      logAction.isError = true;
      logAction.tick(context);
      expect(consoleErrorSpy).toHaveBeenCalledWith(message);

      // 切换回普通日志
      logAction.invalidate();
      logAction.isError = false;
      logAction.tick(context);
      expect(consoleSpy).toHaveBeenCalledWith(message);
    });

    test('默认应该是普通日志', () => {
      const logAction = new LogAction<TestContext>('测试');
      expect(logAction.isError).toBe(false);
    });
  });

  // 测试边界情况
  describe('边界情况测试', () => {
    test('应该能处理空字符串', () => {
      const logAction = new LogAction<TestContext>('');

      const result = logAction.tick(context);

      expect(result).toBe(TaskStatus.Success);
      expect(consoleSpy).toHaveBeenCalledWith('');
    });

    test('应该能处理包含特殊字符的文本', () => {
      const specialText = '特殊字符: \n\t\r"\'\\{}[]()';
      const logAction = new LogAction<TestContext>(specialText);

      const result = logAction.tick(context);

      expect(result).toBe(TaskStatus.Success);
      expect(consoleSpy).toHaveBeenCalledWith(specialText);
    });

    test('应该能处理很长的文本', () => {
      const longText = 'A'.repeat(10000);
      const logAction = new LogAction<TestContext>(longText);

      const result = logAction.tick(context);

      expect(result).toBe(TaskStatus.Success);
      expect(consoleSpy).toHaveBeenCalledWith(longText);
    });

    test('应该能处理包含Unicode字符的文本', () => {
      const unicodeText = '🎮 游戏日志 🚀 测试 ✅';
      const logAction = new LogAction<TestContext>(unicodeText);

      const result = logAction.tick(context);

      expect(result).toBe(TaskStatus.Success);
      expect(consoleSpy).toHaveBeenCalledWith(unicodeText);
    });

    test('应该能处理null上下文', () => {
      const logAction = new LogAction<TestContext>('测试');

      const result = logAction.tick(null as any);

      expect(result).toBe(TaskStatus.Success);
      expect(consoleSpy).toHaveBeenCalledWith('测试');
    });
  });

  // 测试状态管理
  describe('状态管理测试', () => {
    test('多次执行应该保持成功状态', () => {
      const logAction = new LogAction<TestContext>('测试');

      // 第一次执行
      let result = logAction.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(logAction.status).toBe(TaskStatus.Success);

      // 第二次执行（不重置状态）
      result = logAction.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(logAction.status).toBe(TaskStatus.Success);
    });

    test('invalidate应该重置状态', () => {
      const logAction = new LogAction<TestContext>('测试');

      // 执行一次
      logAction.tick(context);
      expect(logAction.status).toBe(TaskStatus.Success);

      // 重置状态
      logAction.invalidate();
      expect(logAction.status).toBe(TaskStatus.Invalid);

      // 再次执行
      const result = logAction.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(logAction.status).toBe(TaskStatus.Success);
    });
  });

  // 测试性能
  describe('性能测试', () => {
    test('大量日志输出应该高效执行', () => {
      const logAction = new LogAction<TestContext>('性能测试日志');
      const iterations = 1000;

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        logAction.invalidate();
        logAction.tick(context);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // 应该在100ms内完成
      expect(consoleSpy).toHaveBeenCalledTimes(iterations);
    });

    test('错误日志和普通日志性能应该相近', () => {
      const normalLogAction = new LogAction<TestContext>('普通日志');
      const errorLogAction = new LogAction<TestContext>('错误日志');
      errorLogAction.isError = true;

      const iterations = 500;

      // 测试普通日志性能
      const startTime1 = performance.now();
      for (let i = 0; i < iterations; i++) {
        normalLogAction.invalidate();
        normalLogAction.tick(context);
      }
      const duration1 = performance.now() - startTime1;

      // 测试错误日志性能
      const startTime2 = performance.now();
      for (let i = 0; i < iterations; i++) {
        errorLogAction.invalidate();
        errorLogAction.tick(context);
      }
      const duration2 = performance.now() - startTime2;

      // 性能差异不应该太大
      expect(Math.abs(duration1 - duration2)).toBeLessThan(50);
    });
  });

  // 测试实际使用场景
  describe('实际使用场景测试', () => {
    test('调试信息输出', () => {
      const debugAction = new LogAction<TestContext>('[DEBUG] 玩家位置: (100, 200)');

      const result = debugAction.tick(context);

      expect(result).toBe(TaskStatus.Success);
      expect(consoleSpy).toHaveBeenCalledWith('[DEBUG] 玩家位置: (100, 200)');
    });

    test('游戏状态日志', () => {
      const stateAction = new LogAction<TestContext>('游戏状态: 战斗中');

      const result = stateAction.tick(context);

      expect(result).toBe(TaskStatus.Success);
      expect(consoleSpy).toHaveBeenCalledWith('游戏状态: 战斗中');
    });

    test('错误报告', () => {
      const errorAction = new LogAction<TestContext>('AI决策失败: 无法找到目标');
      errorAction.isError = true;

      const result = errorAction.tick(context);

      expect(result).toBe(TaskStatus.Success);
      expect(consoleErrorSpy).toHaveBeenCalledWith('AI决策失败: 无法找到目标');
    });

    test('行为树执行跟踪', () => {
      const traceAction = new LogAction<TestContext>('执行节点: AttackSequence');

      const result = traceAction.tick(context);

      expect(result).toBe(TaskStatus.Success);
      expect(consoleSpy).toHaveBeenCalledWith('执行节点: AttackSequence');
    });

    test('性能监控日志', () => {
      const perfAction = new LogAction<TestContext>('行为树执行时间: 2.5ms');

      const result = perfAction.tick(context);

      expect(result).toBe(TaskStatus.Success);
      expect(consoleSpy).toHaveBeenCalledWith('行为树执行时间: 2.5ms');
    });

    test('动态消息生成', () => {
      const logAction = new LogAction<TestContext>('初始消息');

      // 模拟动态更新消息内容
      const messages = [
        '玩家血量: 100%',
        '玩家血量: 75%',
        '玩家血量: 50%',
        '玩家血量: 25%',
        '玩家血量: 0% - 游戏结束'
      ];

      messages.forEach((message, index) => {
        logAction.invalidate();
        logAction.text = message;
        const result = logAction.tick(context);
        
        expect(result).toBe(TaskStatus.Success);
        expect(consoleSpy).toHaveBeenNthCalledWith(index + 1, message);
      });
    });

    test('条件日志输出', () => {
      const logAction = new LogAction<TestContext>('条件满足');

      // 模拟条件检查后的日志输出
      const result = logAction.tick(context);

      expect(result).toBe(TaskStatus.Success);
      expect(consoleSpy).toHaveBeenCalledWith('条件满足');
    });
  });

  // 测试与其他节点的集成
  describe('集成测试', () => {
    test('应该能在行为树中正常工作', () => {
      const logAction = new LogAction<TestContext>('行为树日志测试');

      // 模拟在行为树中的执行
      logAction.onStart();
      const result = logAction.tick(context);
      
      expect(result).toBe(TaskStatus.Success);
      expect(consoleSpy).toHaveBeenCalledWith('行为树日志测试');
    });

    test('应该能与其他动作节点配合', () => {
      const logAction1 = new LogAction<TestContext>('第一个日志');
      const logAction2 = new LogAction<TestContext>('第二个日志');

      // 顺序执行
      logAction1.tick(context);
      logAction2.tick(context);

      expect(consoleSpy).toHaveBeenNthCalledWith(1, '第一个日志');
      expect(consoleSpy).toHaveBeenNthCalledWith(2, '第二个日志');
    });
  });
});
