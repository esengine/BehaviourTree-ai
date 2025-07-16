/**
 * TaskStatus 枚举测试
 * 
 * 测试行为树节点状态枚举的正确性和完整性
 */
import { TaskStatus } from '../../behaviourTree/TaskStatus';

describe('TaskStatus 枚举测试', () => {
  // 测试枚举值是否正确定义
  test('应该包含所有必要的状态值', () => {
    // 验证枚举包含所有预期的状态
    expect(TaskStatus.Invalid).toBeDefined();
    expect(TaskStatus.Success).toBeDefined();
    expect(TaskStatus.Failure).toBeDefined();
    expect(TaskStatus.Running).toBeDefined();
  });

  // 测试枚举值的顺序和数值
  test('枚举值应该有正确的顺序和数值', () => {
    // 验证枚举值的顺序
    expect(TaskStatus.Invalid).toBe(0);
    expect(TaskStatus.Success).toBe(1);
    expect(TaskStatus.Failure).toBe(2);
    expect(TaskStatus.Running).toBe(3);
  });

  // 测试枚举的完整性
  test('枚举应该只包含4个状态', () => {
    // 获取枚举的所有键
    const keys = Object.keys(TaskStatus).filter(key => isNaN(Number(key)));
    
    // 验证枚举键的数量
    expect(keys.length).toBe(4);
    
    // 验证所有预期的键都存在
    expect(keys).toContain('Invalid');
    expect(keys).toContain('Success');
    expect(keys).toContain('Failure');
    expect(keys).toContain('Running');
  });

  // 测试枚举的使用场景
  test('枚举值应该可以用于条件判断', () => {
    // 验证枚举值
    expect(TaskStatus.Invalid).toBe(0);
    expect(TaskStatus.Success).toBe(1);
    expect(TaskStatus.Failure).toBe(2);
    expect(TaskStatus.Running).toBe(3);

    // 验证switch语句兼容性
    function getStatusName(status: TaskStatus): string {
      switch (status) {
        case TaskStatus.Invalid:
          return 'Invalid';
        case TaskStatus.Success:
          return 'Success';
        case TaskStatus.Failure:
          return 'Failure';
        case TaskStatus.Running:
          return 'Running';
        default:
          return 'Unknown';
      }
    }

    expect(getStatusName(TaskStatus.Running)).toBe('Running');
    expect(getStatusName(TaskStatus.Success)).toBe('Success');
    expect(getStatusName(TaskStatus.Failure)).toBe('Failure');
    expect(getStatusName(TaskStatus.Invalid)).toBe('Invalid');
  });
});
