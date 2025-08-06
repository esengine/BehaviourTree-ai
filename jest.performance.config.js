/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/performance'],
  testMatch: ['**/*.performance.test.ts'],
  collectCoverage: false, // 性能测试不需要收集覆盖率
  verbose: true,
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  // 性能测试的特殊配置
  testTimeout: 30000, // 30秒超时
  maxWorkers: 1, // 单线程运行避免资源竞争
  forceExit: true, // 强制退出避免内存泄漏影响结果
};