/**
 * Jest 测试全局设置文件
 *
 * 此文件在每个测试文件执行前运行，用于设置全局测试环境
 */

// 设置测试超时时间（毫秒）
jest.setTimeout(10000);

// 禁用控制台输出（可选，取消注释以启用）
// global.console = {
//   ...console,
//   log: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// 清理所有模拟函数
afterEach(() => {
  jest.clearAllMocks();
});

// 导出空对象以使此文件成为模块
export {};
