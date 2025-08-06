/**
 * BehaviorTree 高级功能测试
 * 
 * 测试未被现有测试覆盖的高级功能，提高测试覆盖率
 */
import { BehaviorTree } from '../../behaviourTree/BehaviorTree';
import { Behavior } from '../../behaviourTree/Behavior';
import { TaskStatus } from '../../behaviourTree/TaskStatus';
import { Blackboard, BlackboardValueType } from '../../behaviourTree/Blackboard';
import { TestUtils, TestContext, MockBehavior } from '../utils/TestUtils';

describe('BehaviorTree 高级功能测试', () => {
    let context: TestContext;
    let rootBehavior: MockBehavior<TestContext>;
    let behaviorTree: BehaviorTree<TestContext>;

    beforeEach(() => {
        context = TestUtils.createTestContext();
        rootBehavior = TestUtils.createSuccessBehavior<TestContext>('RootBehavior');
        behaviorTree = new BehaviorTree(context, rootBehavior, 0);
    });

    describe('黑板功能测试', () => {
        test('应该自动创建并注入黑板到上下文', () => {
            expect((context as any).blackboard).toBeInstanceOf(Blackboard);
            expect(behaviorTree.getBlackboard()).toBeInstanceOf(Blackboard);
        });

        test('应该能提供自定义黑板实例', () => {
            const customBlackboard = new Blackboard();
            customBlackboard.defineVariable('customKey', BlackboardValueType.String, '');
            customBlackboard.set('customKey', 'customValue');
            
            const customTree = new BehaviorTree(context, rootBehavior, 0, false, customBlackboard);
            
            expect(customTree.getBlackboard()).toBe(customBlackboard);
            expect(customTree.getBlackboard().get('customKey')).toBe('customValue');
        });

        test('黑板应该在上下文变更时保持注入', () => {
            const originalBlackboard = behaviorTree.getBlackboard();
            originalBlackboard.defineVariable('testKey', BlackboardValueType.String, '');
            originalBlackboard.set('testKey', 'testValue');
            
            const newContext = TestUtils.createTestContext();
            behaviorTree.setContext(newContext);
            
            expect((newContext as any).blackboard).toBe(originalBlackboard);
            expect((newContext as any).blackboard.get('testKey')).toBe('testValue');
        });
    });

    describe('上下文管理测试', () => {
        test('应该能获取当前上下文', () => {
            expect(behaviorTree.getContext()).toBe(context);
        });

        test('应该能设置新的上下文', () => {
            const newContext = TestUtils.createTestContext();
            newContext.testValue = 999;
            
            behaviorTree.setContext(newContext);
            
            expect(behaviorTree.getContext()).toBe(newContext);
            expect(behaviorTree.getContext().testValue).toBe(999);
        });

        test('设置null上下文应该抛出错误', () => {
            expect(() => {
                behaviorTree.setContext(null as any);
            }).toThrow('上下文不能为null或undefined');
        });

        test('设置undefined上下文应该抛出错误', () => {
            expect(() => {
                behaviorTree.setContext(undefined as any);
            }).toThrow('上下文不能为null或undefined');
        });
    });

    describe('根节点管理测试', () => {
        test('应该能获取根节点', () => {
            expect(behaviorTree.getRoot()).toBe(rootBehavior);
        });

        test('应该能设置新的根节点', () => {
            const newRoot = TestUtils.createFailureBehavior<TestContext>('NewRoot');
            
            behaviorTree.setRoot(newRoot);
            
            expect(behaviorTree.getRoot()).toBe(newRoot);
            
            behaviorTree.tick();
            expect(newRoot.updateCallCount).toBe(1);
        });

        test('设置null根节点应该抛出错误', () => {
            expect(() => {
                behaviorTree.setRoot(null as any);
            }).toThrow('根节点不能为null或undefined');
        });

        test('设置undefined根节点应该抛出错误', () => {
            expect(() => {
                behaviorTree.setRoot(undefined as any);
            }).toThrow('根节点不能为null或undefined');
        });
    });

    describe('性能模式测试', () => {
        test('应该能启用性能模式', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            behaviorTree.setPerformanceMode(true);
            
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('行为树性能模式已启用')
            );
            
            consoleSpy.mockRestore();
        });

        test('性能模式应该影响统计信息收集', () => {
            // 先在非性能模式下执行
            behaviorTree.tick();
            let stats = behaviorTree.getStats();
            const normalModeExecutionTime = stats.lastExecutionTime;

            // 启用性能模式
            behaviorTree.setPerformanceMode(true);
            behaviorTree.resetStats();
            behaviorTree.tick();
            
            stats = behaviorTree.getStats();
            expect(stats.lastExecutionTime).toBe(0); // 性能模式下不收集执行时间
        });

        test('应该能用性能模式创建行为树', () => {
            const perfTree = new BehaviorTree(context, rootBehavior, 0, true);
            
            perfTree.tick();
            const stats = perfTree.getStats();
            
            expect(stats.totalTicks).toBe(1);
            expect(stats.lastExecutionTime).toBe(0); // 性能模式下不收集时间
        });
    });

    describe('统计信息测试', () => {
        test('应该跟踪总tick次数', () => {
            behaviorTree.tick();
            behaviorTree.tick();
            behaviorTree.tick();
            
            const stats = behaviorTree.getStats();
            expect(stats.totalTicks).toBe(3);
        });

        test('应该跟踪执行时间统计', () => {
            behaviorTree.tick();
            
            const stats = behaviorTree.getStats();
            expect(stats.totalExecutionTime).toBeGreaterThanOrEqual(0);
            expect(stats.lastExecutionTime).toBeGreaterThanOrEqual(0);
            expect(stats.averageExecutionTime).toBeGreaterThanOrEqual(0);
        });

        test('应该能重置统计信息', () => {
            behaviorTree.tick();
            behaviorTree.tick();
            
            behaviorTree.resetStats();
            
            const stats = behaviorTree.getStats();
            expect(stats.totalTicks).toBe(0);
            expect(stats.totalExecutionTime).toBe(0);
            expect(stats.lastExecutionTime).toBe(0);
            expect(stats.averageExecutionTime).toBe(0);
        });

        test('统计信息应该是只读的', () => {
            const stats = behaviorTree.getStats();
            
            // 修改返回的统计对象不应该影响内部状态
            (stats as any).totalTicks = 999;
            
            const newStats = behaviorTree.getStats();
            expect(newStats.totalTicks).not.toBe(999);
        });
    });

    describe('时间管理测试', () => {
        test('应该能处理外部提供的deltaTime', () => {
            const timedTree = new BehaviorTree(context, rootBehavior, 0.1); // 100ms更新间隔
            
            // 提供足够的deltaTime触发更新
            timedTree.tick(0.15);
            
            expect(rootBehavior.updateCallCount).toBe(1);
        });

        test('应该能处理负数或无效的deltaTime', () => {
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
            const timedTree = new BehaviorTree(context, rootBehavior, 0.1);
            
            // 提供负数deltaTime
            timedTree.tick(-0.1);
            
            // 应该输出警告并跳过更新
            expect(rootBehavior.updateCallCount).toBe(0);
            
            warnSpy.mockRestore();
        });

        test('应该限制过大的deltaTime', () => {
            const timedTree = new BehaviorTree(context, rootBehavior, 0.05); // 50ms间隔
            
            // 提供超大的deltaTime（2秒）
            timedTree.tick(2.0);
            
            // 应该被限制并正常处理
            expect(rootBehavior.updateCallCount).toBe(1);
        });

        test('应该能处理时间累积更新', () => {
            const timedTree = new BehaviorTree(context, rootBehavior, 0.1); // 100ms间隔
            
            // 连续提供小的deltaTime，累积超过更新间隔
            timedTree.tick(0.06); // 60ms
            expect(rootBehavior.updateCallCount).toBe(0);
            
            timedTree.tick(0.05); // 再加50ms，总计110ms
            expect(rootBehavior.updateCallCount).toBe(1);
        });
    });

    describe('重置功能测试', () => {
        test('应该能重置整个行为树', () => {
            rootBehavior.setReturnStatus(TaskStatus.Running);
            behaviorTree.tick();
            
            expect(rootBehavior.status).toBe(TaskStatus.Running);
            
            behaviorTree.reset();
            
            expect(rootBehavior.status).toBe(TaskStatus.Invalid);
        });

        test('重置应该处理根节点异常', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            // 创建一个invalidate方法会抛异常的行为
            const errorBehavior = new (class extends Behavior<TestContext> {
                update(_context: TestContext): TaskStatus {
                    return TaskStatus.Success;
                }
                override invalidate(): void {
                    throw new Error('Invalidate error');
                }
            })();
            
            const errorTree = new BehaviorTree(context, errorBehavior, 0);
            
            // 重置不应该抛出异常
            expect(() => {
                errorTree.reset();
            }).not.toThrow();
            
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('重置行为树时发生错误'),
                expect.any(Error)
            );
            
            consoleSpy.mockRestore();
        });
    });

    describe('活动状态检查测试', () => {
        test('每帧更新模式应该总是活动的', () => {
            const frameTree = new BehaviorTree(context, rootBehavior, 0);
            expect(frameTree.isActive()).toBe(true);
        });

        test('定时更新模式应该根据时间状态判断活动性', () => {
            const timedTree = new BehaviorTree(context, rootBehavior, 0.1);
            
            // 初始状态应该是活动的
            expect(timedTree.isActive()).toBe(true);
            
            // 执行一次tick后，需要等待下次更新时间
            timedTree.tick(0.05); // 不够触发更新的时间
            expect(timedTree.isActive()).toBe(false);
        });

        test('应该能获取到下次更新的剩余时间', () => {
            const timedTree = new BehaviorTree(context, rootBehavior, 0.1);
            
            // 每帧更新模式应该返回0
            const frameTree = new BehaviorTree(context, rootBehavior, 0);
            expect(frameTree.getTimeToNextUpdate()).toBe(0);
            
            // 定时更新模式应该返回剩余时间
            timedTree.tick(0.03); // 消耗30ms，还剩70ms
            const remainingTime = timedTree.getTimeToNextUpdate();
            expect(remainingTime).toBeCloseTo(0.07, 2);
        });
    });

    describe('错误处理测试', () => {
        test('tick过程中的异常应该被捕获', () => {
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            // 创建一个会抛异常的行为
            const errorBehavior = new (class extends Behavior<TestContext> {
                update(_context: TestContext): TaskStatus {
                    throw new Error('Update error');
                }
            })();
            
            const errorTree = new BehaviorTree(context, errorBehavior, 0);
            
            // tick应该不抛出异常
            expect(() => {
                errorTree.tick();
            }).not.toThrow();
            
            warnSpy.mockRestore();
        });

        test('应该处理NaN和Infinity的deltaTime', () => {
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
            const timedTree = new BehaviorTree(context, rootBehavior, 0.1);
            
            timedTree.tick(NaN);
            timedTree.tick(Infinity);
            timedTree.tick(-Infinity);
            
            // 所有无效的deltaTime都应该被警告并跳过
            expect(warnSpy).toHaveBeenCalledTimes(3);
            expect(rootBehavior.updateCallCount).toBe(0);
            
            warnSpy.mockRestore();
        });
    });

    describe('复杂场景测试', () => {
        test('应该能处理快速连续的tick调用', () => {
            const timedTree = new BehaviorTree(context, rootBehavior, 0.016); // ~60fps
            
            // 模拟60fps的游戏循环
            for (let i = 0; i < 60; i++) {
                timedTree.tick(0.016);
            }
            
            const stats = timedTree.getStats();
            expect(stats.totalTicks).toBe(60);
            expect(rootBehavior.updateCallCount).toBe(60);
        });

        test('应该能处理不规则的时间间隔', () => {
            const timedTree = new BehaviorTree(context, rootBehavior, 0.1);
            
            const intervals = [0.05, 0.02, 0.08, 0.03, 0.15, 0.01];
            let expectedTicks = 0;
            
            for (const interval of intervals) {
                timedTree.tick(interval);
                // 手动计算预期的tick次数（简化版本）
                if (interval >= 0.1) expectedTicks++;
            }
            
            // 由于时间累积，实际的tick次数可能会更多
            expect(rootBehavior.updateCallCount).toBeGreaterThanOrEqual(expectedTicks);
        });

        test('应该能处理行为树的动态重配置', () => {
            const firstRoot = TestUtils.createSuccessBehavior<TestContext>('FirstRoot');
            const secondRoot = TestUtils.createFailureBehavior<TestContext>('SecondRoot');
            
            behaviorTree.setRoot(firstRoot);
            behaviorTree.tick();
            expect(firstRoot.status).toBe(TaskStatus.Success);
            
            behaviorTree.setRoot(secondRoot);
            behaviorTree.tick();
            expect(secondRoot.status).toBe(TaskStatus.Failure);
            
            // 验证两个根节点都被正确执行
            expect(firstRoot.updateCallCount).toBe(1);
            expect(secondRoot.updateCallCount).toBe(1);
        });

        test('应该能在不同更新模式间切换', () => {
            // 开始时是每帧更新
            behaviorTree.updatePeriod = 0;
            behaviorTree.tick();
            expect(rootBehavior.updateCallCount).toBe(1);
            
            // 切换到定时更新
            behaviorTree.updatePeriod = 0.1;
            behaviorTree.tick(0.05); // 不够触发更新
            expect(rootBehavior.updateCallCount).toBe(1);
            
            behaviorTree.tick(0.06); // 累积足够触发更新
            expect(rootBehavior.updateCallCount).toBe(2);
        });
    });

    describe('内存和性能测试', () => {
        test('大量tick操作不应该造成内存泄漏', () => {
            const initialStats = behaviorTree.getStats();
            
            // 执行大量操作
            for (let i = 0; i < 10000; i++) {
                behaviorTree.tick();
                if (i % 1000 === 0) {
                    behaviorTree.resetStats();
                }
            }
            
            // 重置后统计信息应该被清理
            const finalStats = behaviorTree.getStats();
            expect(finalStats.totalTicks).toBeLessThan(1000);
        });

        test('黑板引用应该正确管理', () => {
            const originalBlackboard = behaviorTree.getBlackboard();
            
            // 多次设置上下文，黑板引用应该保持一致
            for (let i = 0; i < 100; i++) {
                const newContext = TestUtils.createTestContext();
                behaviorTree.setContext(newContext);
                expect((newContext as any).blackboard).toBe(originalBlackboard);
            }
            
            expect(behaviorTree.getBlackboard()).toBe(originalBlackboard);
        });
    });
});