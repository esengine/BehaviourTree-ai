/**
 * 微基准测试 - 精确定位性能瓶颈
 */
import { ObjectPool } from '../../behaviourTree/ObjectPool';

// 简单测试对象
class SimpleObject {
    public value: number = 0;
    reset(): void {
        this.value = 0;
    }
}

describe('微基准性能测试', () => {
    const ITERATIONS = 100000;

    describe('对象池核心操作分析', () => {
        test('原生数组操作性能基准', () => {
            const array: SimpleObject[] = [];
            
            const startTime = performance.now();
            
            for (let i = 0; i < ITERATIONS; i++) {
                if (array.length > 0) {
                    const obj = array.pop()!;
                    obj.value = i;
                    array.push(obj);
                } else {
                    const obj = new SimpleObject();
                    obj.value = i;
                    array.push(obj);
                }
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            console.log(`原生数组操作 ${ITERATIONS} 次耗时: ${duration.toFixed(2)}ms`);
            expect(duration).toBeLessThan(50);
        });

        test('WeakSet vs Array.includes 性能对比', () => {
            const objects: SimpleObject[] = [];
            const weakSet = new WeakSet<SimpleObject>();
            
            // 创建测试对象
            for (let i = 0; i < 1000; i++) {
                const obj = new SimpleObject();
                objects.push(obj);
                weakSet.add(obj);
            }

            // 测试 Array.includes
            const includesStart = performance.now();
            for (let i = 0; i < ITERATIONS; i++) {
                const obj = objects[i % objects.length]!;
                objects.includes(obj);
            }
            const includesEnd = performance.now();
            const includesDuration = includesEnd - includesStart;

            // 测试 WeakSet.has
            const weakSetStart = performance.now();
            for (let i = 0; i < ITERATIONS; i++) {
                const obj = objects[i % objects.length]!;
                weakSet.has(obj);
            }
            const weakSetEnd = performance.now();
            const weakSetDuration = weakSetEnd - weakSetStart;

            console.log(`Array.includes ${ITERATIONS} 次耗时: ${includesDuration.toFixed(2)}ms`);
            console.log(`WeakSet.has ${ITERATIONS} 次耗时: ${weakSetDuration.toFixed(2)}ms`);
            console.log(`WeakSet性能提升: ${((includesDuration - weakSetDuration) / includesDuration * 100).toFixed(1)}%`);

            expect(weakSetDuration).toBeLessThan(includesDuration);
        });

        test('统计信息更新开销分析', () => {
            let stats = {
                totalGets: 0,
                totalReleases: 0,
                totalCreations: 0,
                hitRate: 0,
                currentSize: 0,
                utilization: 0
            };

            // 测试无统计更新
            const noStatsStart = performance.now();
            for (let i = 0; i < ITERATIONS; i++) {
                // 只做基本操作，无统计更新
                const value = Math.random();
            }
            const noStatsEnd = performance.now();
            const noStatsDuration = noStatsEnd - noStatsStart;

            // 测试包含统计更新
            const withStatsStart = performance.now();
            for (let i = 0; i < ITERATIONS; i++) {
                const value = Math.random();
                // 模拟统计更新
                stats.totalGets++;
                stats.currentSize = 100;
                stats.hitRate = stats.totalGets > 0 ? 
                    (stats.totalGets - stats.totalCreations) / stats.totalGets : 0;
                stats.utilization = stats.currentSize / 1000;
            }
            const withStatsEnd = performance.now();
            const withStatsDuration = withStatsEnd - withStatsStart;

            console.log(`无统计更新 ${ITERATIONS} 次耗时: ${noStatsDuration.toFixed(2)}ms`);
            console.log(`包含统计更新 ${ITERATIONS} 次耗时: ${withStatsDuration.toFixed(2)}ms`);
            console.log(`统计更新开销: ${(withStatsDuration - noStatsDuration).toFixed(2)}ms`);

            const overhead = (withStatsDuration - noStatsDuration) / withStatsDuration * 100;
            console.log(`统计开销占比: ${overhead.toFixed(1)}%`);
        });

        test('对象验证器开销分析', () => {
            const objects: SimpleObject[] = [];
            for (let i = 0; i < 1000; i++) {
                objects.push(new SimpleObject());
            }

            // 无验证器
            const noValidatorStart = performance.now();
            for (let i = 0; i < ITERATIONS; i++) {
                const obj = objects[i % objects.length]!;
                // 无验证操作
            }
            const noValidatorEnd = performance.now();
            const noValidatorDuration = noValidatorEnd - noValidatorStart;

            // 简单验证器
            const simpleValidator = (obj: any) => obj != null;
            const simpleValidatorStart = performance.now();
            for (let i = 0; i < ITERATIONS; i++) {
                const obj = objects[i % objects.length]!;
                simpleValidator(obj);
            }
            const simpleValidatorEnd = performance.now();
            const simpleValidatorDuration = simpleValidatorEnd - simpleValidatorStart;

            // 复杂验证器
            const complexValidator = (obj: any) => {
                return obj != null && typeof obj === 'object' && 'value' in obj;
            };
            const complexValidatorStart = performance.now();
            for (let i = 0; i < ITERATIONS; i++) {
                const obj = objects[i % objects.length]!;
                complexValidator(obj);
            }
            const complexValidatorEnd = performance.now();
            const complexValidatorDuration = complexValidatorEnd - complexValidatorStart;

            console.log(`无验证器 ${ITERATIONS} 次耗时: ${noValidatorDuration.toFixed(2)}ms`);
            console.log(`简单验证器 ${ITERATIONS} 次耗时: ${simpleValidatorDuration.toFixed(2)}ms`);
            console.log(`复杂验证器 ${ITERATIONS} 次耗时: ${complexValidatorDuration.toFixed(2)}ms`);

            const simpleOverhead = (simpleValidatorDuration - noValidatorDuration).toFixed(2);
            const complexOverhead = (complexValidatorDuration - noValidatorDuration).toFixed(2);
            console.log(`简单验证器开销: ${simpleOverhead}ms`);
            console.log(`复杂验证器开销: ${complexOverhead}ms`);
        });
    });

    describe('优化后ObjectPool性能', () => {
        test('优化后ObjectPool性能测试', () => {
            const pool = new ObjectPool(
                () => new SimpleObject(),
                (obj) => obj.reset(),
                1000
            );

            // 预热池
            for (let i = 0; i < 100; i++) {
                pool.release(pool.get());
            }

            const startTime = performance.now();
            
            for (let i = 0; i < ITERATIONS; i++) {
                const obj = pool.get();
                obj.value = i;
                pool.release(obj);
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            console.log(`优化后ObjectPool ${ITERATIONS} 次操作耗时: ${duration.toFixed(2)}ms`);
            expect(duration).toBeLessThan(10); // 应该比原来更快
        });
    });

    describe('控制台输出开销分析', () => {
        test('console.warn开销测试', () => {
            const mockWarn = jest.fn();
            const originalWarn = console.warn;

            // 测试无console调用
            const noConsoleStart = performance.now();
            for (let i = 0; i < ITERATIONS; i++) {
                // 无操作
            }
            const noConsoleEnd = performance.now();
            const noConsoleDuration = noConsoleEnd - noConsoleStart;

            // 测试mock console
            console.warn = mockWarn;
            const mockConsoleStart = performance.now();
            for (let i = 0; i < ITERATIONS; i++) {
                console.warn('测试警告');
            }
            const mockConsoleEnd = performance.now();
            const mockConsoleDuration = mockConsoleEnd - mockConsoleStart;

            // 测试真实console（可能被Jest拦截）
            console.warn = originalWarn;
            const realConsoleStart = performance.now();
            for (let i = 0; i < ITERATIONS; i++) {
                if (i % 10000 === 0) { // 减少真实console调用频率
                    console.warn('测试警告');
                }
            }
            const realConsoleEnd = performance.now();
            const realConsoleDuration = realConsoleEnd - realConsoleStart;

            console.log(`无console ${ITERATIONS} 次: ${noConsoleDuration.toFixed(2)}ms`);
            console.log(`mock console ${ITERATIONS} 次: ${mockConsoleDuration.toFixed(2)}ms`);
            console.log(`真实console ${ITERATIONS/10000} 次: ${realConsoleDuration.toFixed(2)}ms`);

            console.warn = originalWarn; // 恢复
        });
    });

    describe('内存分配模式分析', () => {
        test('对象创建 vs 对象复用性能', () => {
            // 测试直接创建对象
            const createStart = performance.now();
            for (let i = 0; i < ITERATIONS; i++) {
                const obj = new SimpleObject();
                obj.value = i;
                // 对象会被GC回收
            }
            const createEnd = performance.now();
            const createDuration = createEnd - createStart;

            // 测试对象复用
            const pool: SimpleObject[] = [];
            const reuseStart = performance.now();
            for (let i = 0; i < ITERATIONS; i++) {
                let obj: SimpleObject;
                if (pool.length > 0) {
                    obj = pool.pop()!;
                    obj.reset();
                } else {
                    obj = new SimpleObject();
                }
                obj.value = i;
                pool.push(obj);
            }
            const reuseEnd = performance.now();
            const reuseDuration = reuseEnd - reuseStart;

            console.log(`直接创建 ${ITERATIONS} 个对象: ${createDuration.toFixed(2)}ms`);
            console.log(`对象复用 ${ITERATIONS} 次操作: ${reuseDuration.toFixed(2)}ms`);
            
            const improvement = ((createDuration - reuseDuration) / createDuration * 100).toFixed(1);
            console.log(`复用性能提升: ${improvement}%`);

            console.log(`最终池大小: ${pool.length}`);
        });
    });
});