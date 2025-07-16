/**
 * Behavior 基类测试
 * 
 * 测试行为树节点基类的核心功能
 */
import { Behavior } from '../../behaviourTree/Behavior';
import { TaskStatus } from '../../behaviourTree/TaskStatus';
import { TestUtils, TestContext } from '../utils/TestUtils';

// 创建一个具体的Behavior实现用于测试
class TestBehavior extends Behavior<TestContext> {
  private _returnStatus: TaskStatus;
  public updateCallCount: number = 0;

  constructor(returnStatus: TaskStatus = TaskStatus.Success) {
    super();
    this._returnStatus = returnStatus;
  }

  update(context: TestContext): TaskStatus {
    this.updateCallCount++;
    this.status = this._returnStatus;
    return this._returnStatus;
  }

  setReturnStatus(status: TaskStatus): void {
    this._returnStatus = status;
  }
}

describe('Behavior 基类测试', () => {
  let context: TestContext;
  let behavior: TestBehavior;

  beforeEach(() => {
    context = TestUtils.createTestContext();
    behavior = new TestBehavior();
  });

  // 测试初始状态
  describe('初始状态测试', () => {
    test('新创建的行为节点应该有Invalid状态', () => {
      expect(behavior.status).toBe(TaskStatus.Invalid);
    });

    test('update方法调用次数应该为0', () => {
      expect(behavior.updateCallCount).toBe(0);
    });
  });

  // 测试update方法
  describe('update方法测试', () => {
    test('调用update应该返回正确的状态', () => {
      const result = behavior.update(context);
      
      expect(result).toBe(TaskStatus.Success);
      expect(behavior.status).toBe(TaskStatus.Success);
      expect(behavior.updateCallCount).toBe(1);
    });

    test('多次调用update应该正确计数', () => {
      behavior.update(context);
      behavior.update(context);
      behavior.update(context);
      
      expect(behavior.updateCallCount).toBe(3);
    });

    test('update应该能返回不同的状态', () => {
      // 测试Success状态
      behavior.setReturnStatus(TaskStatus.Success);
      let result = behavior.update(context);
      expect(result).toBe(TaskStatus.Success);
      expect(behavior.status).toBe(TaskStatus.Success);

      // 测试Failure状态
      behavior.setReturnStatus(TaskStatus.Failure);
      result = behavior.update(context);
      expect(result).toBe(TaskStatus.Failure);
      expect(behavior.status).toBe(TaskStatus.Failure);

      // 测试Running状态
      behavior.setReturnStatus(TaskStatus.Running);
      result = behavior.update(context);
      expect(result).toBe(TaskStatus.Running);
      expect(behavior.status).toBe(TaskStatus.Running);
    });
  });

  // 测试invalidate方法
  describe('invalidate方法测试', () => {
    test('invalidate应该重置状态为Invalid', () => {
      // 先执行update设置状态
      behavior.update(context);
      expect(behavior.status).toBe(TaskStatus.Success);

      // 调用invalidate
      behavior.invalidate();
      expect(behavior.status).toBe(TaskStatus.Invalid);
    });

    test('invalidate不应该影响update调用次数', () => {
      behavior.update(context);
      const callCount = behavior.updateCallCount;
      
      behavior.invalidate();
      expect(behavior.updateCallCount).toBe(callCount);
    });

    test('invalidate后可以重新执行update', () => {
      // 执行update
      behavior.update(context);
      expect(behavior.status).toBe(TaskStatus.Success);

      // invalidate
      behavior.invalidate();
      expect(behavior.status).toBe(TaskStatus.Invalid);

      // 重新执行update
      const result = behavior.update(context);
      expect(result).toBe(TaskStatus.Success);
      expect(behavior.status).toBe(TaskStatus.Success);
    });
  });

  // 测试状态转换
  describe('状态转换测试', () => {
    test('状态应该能从Invalid转换到其他状态', () => {
      expect(behavior.status).toBe(TaskStatus.Invalid);
      
      behavior.setReturnStatus(TaskStatus.Running);
      behavior.update(context);
      expect(behavior.status).toBe(TaskStatus.Running);
    });

    test('状态应该能在Success和Failure之间转换', () => {
      behavior.setReturnStatus(TaskStatus.Success);
      behavior.update(context);
      expect(behavior.status).toBe(TaskStatus.Success);

      behavior.setReturnStatus(TaskStatus.Failure);
      behavior.update(context);
      expect(behavior.status).toBe(TaskStatus.Failure);
    });

    test('Running状态应该能持续多次update', () => {
      behavior.setReturnStatus(TaskStatus.Running);
      
      for (let i = 0; i < 5; i++) {
        const result = behavior.update(context);
        expect(result).toBe(TaskStatus.Running);
        expect(behavior.status).toBe(TaskStatus.Running);
      }
      
      expect(behavior.updateCallCount).toBe(5);
    });
  });

  // 测试边界情况
  describe('边界情况测试', () => {
    test('应该能处理null上下文（如果实现允许）', () => {
      // 注意：这取决于具体实现是否允许null上下文
      expect(() => {
        behavior.update(null as any);
      }).not.toThrow();
    });

    test('连续调用invalidate应该是安全的', () => {
      behavior.invalidate();
      behavior.invalidate();
      behavior.invalidate();
      
      expect(behavior.status).toBe(TaskStatus.Invalid);
    });
  });
});
