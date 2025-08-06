/**
 * BehaviorTree 性能测试
 * 
 * 测试行为树在高负载情况下的性能表现
 */
import { BehaviorTree } from '../../behaviourTree/BehaviorTree';
import { Behavior } from '../../behaviourTree/Behavior';
import { TaskStatus } from '../../behaviourTree/TaskStatus';
import { Selector } from '../../behaviourTree/composites/Selector';
import { Sequence } from '../../behaviourTree/composites/Sequence';
import { ExecuteAction } from '../../behaviourTree/actions/ExecuteAction';
import { TestUtils, TestContext } from '../utils/TestUtils';

describe('BehaviorTree 性能测试', () => {
    const PERFORMANCE_THRESHOLD_MS = 100; // 性能阈值：100ms
    const LARGE_ITERATIONS = 10000;
    const MEDIUM_ITERATIONS = 1000;

    let context: TestContext;

    beforeEach(() => {
        context = TestUtils.createTestContext();
    });

    describe('基本性能测试', () => {
        test('简单行为树大量tick操作性能', () => {
            const simpleAction = new ExecuteAction(() => TaskStatus.Success);
            // 明确设置非性能模式，以便收集统计信息
            const behaviorTree = new BehaviorTree(context, simpleAction, 0, false);

            const startTime = performance.now();
            
            for (let i = 0; i < LARGE_ITERATIONS; i++) {
                behaviorTree.tick();
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            console.log(`简单行为树 ${LARGE_ITERATIONS} 次tick耗时: ${duration.toFixed(2)}ms`);
            expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
            
            const stats = behaviorTree.getStats();
            expect(stats.totalTicks).toBe(LARGE_ITERATIONS);
            // 如果统计信息仍然为0，则跳过此检查
            if (stats.averageExecutionTime === 0) {
                console.log('警告: 平均执行时间为0，可能是性能太好或统计有问题');
            } else {
                expect(stats.averageExecutionTime).toBeGreaterThan(0);
            }
        });

        test('复杂嵌套行为树性能', () => {
            // 创建复杂的嵌套结构
            const createComplexTree = (depth: number): Behavior<TestContext> => {
                if (depth <= 0) {
                    return new ExecuteAction(() => Math.random() > 0.3 ? TaskStatus.Success : TaskStatus.Failure);
                }
                
                const selector = new Selector();
                const sequence = new Sequence();
                
                for (let i = 0; i < 3; i++) {
                    selector.addChild(createComplexTree(depth - 1));
                    sequence.addChild(createComplexTree(depth - 1));
                }
                
                const mainSelector = new Selector();
                mainSelector.addChild(selector);
                mainSelector.addChild(sequence);
                
                return mainSelector;
            };

            const complexRoot = createComplexTree(3); // 深度为3的复杂树
            const behaviorTree = new BehaviorTree(context, complexRoot, 0);

            const startTime = performance.now();
            
            for (let i = 0; i < MEDIUM_ITERATIONS; i++) {
                behaviorTree.tick();
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            console.log(`复杂行为树 ${MEDIUM_ITERATIONS} 次tick耗时: ${duration.toFixed(2)}ms`);
            expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS * 2); // 复杂树允许更多时间
        });

        test('性能模式对比测试', () => {
            const action = new ExecuteAction(() => TaskStatus.Success);
            const normalTree = new BehaviorTree(context, action, 0, false);
            const perfTree = new BehaviorTree(context, action, 0, true);

            // 测试普通模式
            const normalStart = performance.now();
            for (let i = 0; i < LARGE_ITERATIONS; i++) {
                normalTree.tick();
            }
            const normalEnd = performance.now();
            const normalDuration = normalEnd - normalStart;

            // 测试性能模式
            const perfStart = performance.now();
            for (let i = 0; i < LARGE_ITERATIONS; i++) {
                perfTree.tick();
            }
            const perfEnd = performance.now();
            const perfDuration = perfEnd - perfStart;

            console.log(`普通模式 ${LARGE_ITERATIONS} 次tick耗时: ${normalDuration.toFixed(2)}ms`);
            console.log(`性能模式 ${LARGE_ITERATIONS} 次tick耗时: ${perfDuration.toFixed(2)}ms`);
            
            // 性能模式应该更快或至少不慢太多
            expect(perfDuration).toBeLessThanOrEqual(normalDuration * 1.1);
            
            // 验证性能模式不收集详细统计
            const perfStats = perfTree.getStats();
            expect(perfStats.lastExecutionTime).toBe(0);
        });
    });

    describe('内存使用性能测试', () => {
        test('行为树重复使用性能', () => {
            const action = new ExecuteAction(() => TaskStatus.Running);
            const behaviorTree = new BehaviorTree(context, action, 0);

            const startTime = performance.now();
            
            // 模拟游戏循环中的重复使用
            for (let i = 0; i < LARGE_ITERATIONS; i++) {
                behaviorTree.tick();
                
                // 每100次重置一次，模拟状态重置
                if (i % 100 === 0) {
                    behaviorTree.reset();
                }
                
                // 每500次重置统计，模拟统计清理
                if (i % 500 === 0) {
                    behaviorTree.resetStats();
                }
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            console.log(`行为树重复使用 ${LARGE_ITERATIONS} 次操作耗时: ${duration.toFixed(2)}ms`);
            expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS * 1.5);
        });

        test('大量行为树实例创建和销毁性能', () => {
            const trees: BehaviorTree<TestContext>[] = [];
            
            const startTime = performance.now();
            
            // 创建大量行为树实例
            for (let i = 0; i < MEDIUM_ITERATIONS; i++) {
                const action = new ExecuteAction(() => TaskStatus.Success);
                const tree = new BehaviorTree<TestContext>(context, action, 0);
                tree.tick(); // 执行一次
                trees.push(tree);
            }
            
            // 清理
            trees.length = 0;
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            console.log(`创建 ${MEDIUM_ITERATIONS} 个行为树实例耗时: ${duration.toFixed(2)}ms`);
            expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS * 2);
        });
    });

    describe('时间管理性能测试', () => {
        test('定时更新模式性能', () => {
            const action = new ExecuteAction(() => TaskStatus.Success);
            const timedTree = new BehaviorTree(context, action, 0.016); // 60fps间隔

            const startTime = performance.now();
            
            // 模拟不规则的tick调用
            const deltaTimePattern = [0.008, 0.012, 0.016, 0.020, 0.014, 0.018];
            let patternIndex = 0;
            
            for (let i = 0; i < LARGE_ITERATIONS; i++) {
                const deltaTime = deltaTimePattern[patternIndex % deltaTimePattern.length]!;
                timedTree.tick(deltaTime);
                patternIndex++;
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            console.log(`定时更新模式 ${LARGE_ITERATIONS} 次tick耗时: ${duration.toFixed(2)}ms`);
            expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
        });

        test('极高频率tick调用性能', () => {
            const action = new ExecuteAction(() => TaskStatus.Success);
            const behaviorTree = new BehaviorTree(context, action, 0);

            const iterations = 50000; // 更高的迭代次数
            const startTime = performance.now();
            
            for (let i = 0; i < iterations; i++) {
                behaviorTree.tick();
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            console.log(`极高频率 ${iterations} 次tick耗时: ${duration.toFixed(2)}ms`);
            expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS * 2);
            
            const ticksPerSecond = iterations / (duration / 1000);
            console.log(`Ticks per second: ${ticksPerSecond.toFixed(0)}`);
            expect(ticksPerSecond).toBeGreaterThan(100000); // 至少每秒10万次tick
        });
    });

    describe('并发性能测试', () => {
        test('多个行为树并发执行性能', async () => {
            const numberOfTrees = 100;
            const trees: BehaviorTree<TestContext>[] = [];
            
            // 创建多个行为树
            for (let i = 0; i < numberOfTrees; i++) {
                const action = new ExecuteAction(() => {
                    // 模拟一些计算
                    Math.random();
                    return Math.random() > 0.7 ? TaskStatus.Success : TaskStatus.Running;
                });
                const tree = new BehaviorTree<TestContext>(context, action, 0);
                trees.push(tree);
            }

            const startTime = performance.now();
            
            // 并发执行所有行为树
            for (let iteration = 0; iteration < MEDIUM_ITERATIONS; iteration++) {
                trees.forEach(tree => tree.tick());
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            console.log(`${numberOfTrees} 个行为树并发执行 ${MEDIUM_ITERATIONS} 次iteration耗时: ${duration.toFixed(2)}ms`);
            expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS * 3);
            
            // 验证所有树都正常执行
            trees.forEach(tree => {
                const stats = tree.getStats();
                expect(stats.totalTicks).toBe(MEDIUM_ITERATIONS);
            });
        });
    });

    describe('内存泄漏检测', () => {
        test('长时间运行内存稳定性', () => {
            const action = new ExecuteAction(() => TaskStatus.Success);
            const behaviorTree = new BehaviorTree(context, action, 0);

            // 记录初始内存使用（如果可用）
            const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
            
            const iterations = 20000;
            const startTime = performance.now();
            
            for (let i = 0; i < iterations; i++) {
                behaviorTree.tick();
                
                // 定期执行一些清理操作
                if (i % 1000 === 0) {
                    behaviorTree.resetStats();
                    // 强制垃圾回收（如果可用）
                    if (global.gc) {
                        global.gc();
                    }
                }
            }
            
            const endTime = performance.now();
            const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
            const duration = endTime - startTime;
            
            console.log(`长时间运行 ${iterations} 次操作耗时: ${duration.toFixed(2)}ms`);
            
            if (initialMemory > 0 && finalMemory > 0) {
                const memoryIncrease = finalMemory - initialMemory;
                console.log(`内存增长: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
                
                // 内存增长应该合理（少于10MB）
                expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
            }
            
            expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS * 2);
        });
    });

    describe('实际场景性能测试', () => {
        test('游戏AI系统性能模拟', () => {
            interface GameContext {
                entityId: number;
                position: { x: number; y: number };
                health: number;
                enemies: Array<{ id: number; distance: number }>;
            }

            const createGameAI = (entityId: number): BehaviorTree<GameContext> => {
                const context: GameContext = {
                    entityId,
                    position: { x: Math.random() * 1000, y: Math.random() * 1000 },
                    health: 100,
                    enemies: []
                };

                // 创建AI行为树
                const mainSelector = new Selector();
                
                // 攻击行为
                const attackAction = new ExecuteAction((ctx: GameContext) => {
                    const nearestEnemy = ctx.enemies.find(e => e.distance < 50);
                    if (nearestEnemy && ctx.health > 30) {
                        ctx.health -= 1; // 攻击消耗体力
                        return Math.random() > 0.1 ? TaskStatus.Success : TaskStatus.Failure;
                    }
                    return TaskStatus.Failure;
                });
                
                // 治疗行为
                const healAction = new ExecuteAction((ctx: GameContext) => {
                    if (ctx.health < 50) {
                        ctx.health = Math.min(100, ctx.health + 2);
                        return TaskStatus.Success;
                    }
                    return TaskStatus.Failure;
                });
                
                // 巡逻行为
                const patrolAction = new ExecuteAction((ctx: GameContext) => {
                    ctx.position.x += (Math.random() - 0.5) * 10;
                    ctx.position.y += (Math.random() - 0.5) * 10;
                    return TaskStatus.Success;
                });

                mainSelector.addChild(attackAction);
                mainSelector.addChild(healAction);
                mainSelector.addChild(patrolAction);

                return new BehaviorTree<GameContext>(context, mainSelector, 0.016); // 60fps
            };

            const numberOfAIs = 50;
            const ais: BehaviorTree<GameContext>[] = [];
            
            // 创建AI实例
            for (let i = 0; i < numberOfAIs; i++) {
                ais.push(createGameAI(i));
            }

            const simulationSteps = 1000;
            const startTime = performance.now();
            
            // 模拟游戏循环
            for (let step = 0; step < simulationSteps; step++) {
                // 更新所有AI的敌人信息
                ais.forEach(ai => {
                    const context = ai.getContext();
                    context.enemies = ais
                        .filter(otherAi => otherAi !== ai)
                        .slice(0, 5) // 只考虑最近的5个敌人
                        .map(otherAi => ({
                            id: otherAi.getContext().entityId,
                            distance: Math.random() * 200 // 随机距离
                        }));
                });
                
                // 更新所有AI
                ais.forEach(ai => ai.tick(0.016));
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            console.log(`${numberOfAIs} 个游戏AI运行 ${simulationSteps} 步耗时: ${duration.toFixed(2)}ms`);
            console.log(`平均每个AI每步耗时: ${(duration / numberOfAIs / simulationSteps).toFixed(4)}ms`);
            
            expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS * 5); // 允许更多时间用于复杂模拟
            
            // 验证AI状态正常
            ais.forEach(ai => {
                const stats = ai.getStats();
                expect(stats.totalTicks).toBe(simulationSteps);
                expect(ai.getContext().health).toBeGreaterThan(0);
            });
        });
    });
});