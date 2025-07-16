import { TaskStatus } from '../../behaviourTree/TaskStatus';
import { Behavior } from '../../behaviourTree/Behavior';
import { Blackboard } from '../../behaviourTree/Blackboard';

/**
 * 测试工具类
 * 提供测试中常用的工具函数和模拟对象
 */
export class TestUtils {
  /**
   * 创建一个简单的测试上下文
   */
  static createTestContext(): TestContext {
    return {
      blackboard: new Blackboard(),
      testValue: 0,
      isConditionMet: false,
      actionExecuted: false,
      executionCount: 0,
      lastExecutionTime: 0,
    };
  }

  /**
   * 创建一个模拟的行为节点
   */
  static createMockBehavior<T>(status: TaskStatus, name?: string): MockBehavior<T> {
    return new MockBehavior<T>(status, name);
  }

  /**
   * 创建一个总是成功的行为节点
   */
  static createSuccessBehavior<T>(name?: string): MockBehavior<T> {
    return new MockBehavior<T>(TaskStatus.Success, name);
  }

  /**
   * 创建一个总是失败的行为节点
   */
  static createFailureBehavior<T>(name?: string): MockBehavior<T> {
    return new MockBehavior<T>(TaskStatus.Failure, name);
  }

  /**
   * 创建一个运行中的行为节点
   */
  static createRunningBehavior<T>(name?: string): MockBehavior<T> {
    return new MockBehavior<T>(TaskStatus.Running, name);
  }

  /**
   * 等待指定时间
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 全局等待函数
   */
  static waitForTime = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 验证节点状态
   */
  static expectStatus(behavior: Behavior<any>, expectedStatus: TaskStatus): void {
    expect(behavior.status).toBe(expectedStatus);
  }

  /**
   * 验证多个节点状态
   */
  static expectStatuses(behaviors: Behavior<any>[], expectedStatuses: TaskStatus[]): void {
    expect(behaviors.length).toBe(expectedStatuses.length);
    behaviors.forEach((behavior, index) => {
      expect(behavior.status).toBe(expectedStatuses[index]);
    });
  }
}

/**
 * 测试上下文接口
 */
export interface TestContext {
  blackboard: Blackboard;
  testValue: number;
  isConditionMet: boolean;
  actionExecuted: boolean;
  executionCount: number;
  lastExecutionTime: number;
}

/**
 * 模拟行为节点类
 */
export class MockBehavior<T> extends Behavior<T> {
  private _returnStatus: TaskStatus;
  private _name: string;
  public updateCallCount: number = 0;
  public lastContext: T | null = null;

  constructor(returnStatus: TaskStatus, name?: string) {
    super();
    this._returnStatus = returnStatus;
    this._name = name || `MockBehavior_${returnStatus}`;
  }

  update(context: T): TaskStatus {
    this.updateCallCount++;
    this.lastContext = context;
    this.status = this._returnStatus;
    return this._returnStatus;
  }

  // 重写tick方法，BehaviorTree会调用此方法
  override tick(context: T): TaskStatus {
    return this.update(context);
  }

  setReturnStatus(status: TaskStatus): void {
    this._returnStatus = status;
  }

  getName(): string {
    return this._name;
  }

  reset(): void {
    this.updateCallCount = 0;
    this.lastContext = null;
    this.invalidate();
  }
}

/**
 * 性能测试工具
 */
export class PerformanceTestUtils {
  /**
   * 测量函数执行时间
   */
  static measureTime<T>(fn: () => T): { result: T; duration: number } {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    return { result, duration };
  }

  /**
   * 测量异步函数执行时间
   */
  static async measureTimeAsync<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    return { result, duration };
  }

  /**
   * 创建大量节点用于性能测试
   */
  static createManyBehaviors<T>(count: number, status: TaskStatus): MockBehavior<T>[] {
    const behaviors: MockBehavior<T>[] = [];
    for (let i = 0; i < count; i++) {
      behaviors.push(new MockBehavior<T>(status, `MockBehavior_${i}`));
    }
    return behaviors;
  }
}

/**
 * 内存测试工具
 */
export class MemoryTestUtils {
  /**
   * 获取当前内存使用情况（Node.js环境）
   */
  static getMemoryUsage(): NodeJS.MemoryUsage | null {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage();
    }
    return null;
  }

  /**
   * 强制垃圾回收（如果可用）
   */
  static forceGC(): void {
    if (typeof global !== 'undefined' && global.gc) {
      global.gc();
    }
  }
}
