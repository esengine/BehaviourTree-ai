/**
 * ObjectPool 性能测试
 * 
 * 测试优化后的ObjectPool性能表现
 */
import { ObjectPool, BehaviorNodePoolManager } from '../../behaviourTree/ObjectPool';
import { ExecuteAction } from '../../behaviourTree/actions/ExecuteAction';
import { TaskStatus } from '../../behaviourTree/TaskStatus';

// 测试用的简单对象
class TestObject {
    public value: number = 0;
    public active: boolean = true;
    
    reset(): void {
        this.value = 0;
        this.active = true;
    }
}

// 复杂对象，用于测试重置开销
class ComplexObject {
    public data: number[] = [];
    public map: Map<string, number> = new Map();
    public nested: { items: string[], count: number } = { items: [], count: 0 };
    
    constructor() {
        this.reset();
    }
    
    reset(): void {
        this.data.length = 0;
        this.map.clear();
        this.nested.items.length = 0;
        this.nested.count = 0;
        
        // 初始化一些数据
        for (let i = 0; i < 10; i++) {
            this.data.push(Math.random());
            this.map.set(`key${i}`, i);
            this.nested.items.push(`item${i}`);
        }
        this.nested.count = 10;
    }
}

describe('ObjectPool 性能测试', () => {
    const PERFORMANCE_THRESHOLD_MS = 50; // 降低阈值，期望更好的性能
    const LARGE_ITERATIONS = 100000;
    const MEDIUM_ITERATIONS = 10000;

    describe('基础性能测试', () => {
        test('优化后ObjectPool基本操作性能', () => {
            const pool = new ObjectPool(
                () => new TestObject(),
                (obj) => obj.reset(),
                1000
            );

            // 预热池
            for (let i = 0; i < 100; i++) {
                pool.release(pool.get());
            }

            const startTime = performance.now();
            for (let i = 0; i < LARGE_ITERATIONS; i++) {
                const obj = pool.get();
                obj.value = i;
                pool.release(obj);
            }
            const endTime = performance.now();
            const duration = endTime - startTime;

            console.log(`优化后ObjectPool ${LARGE_ITERATIONS} 次操作耗时: ${duration.toFixed(2)}ms`);
            expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
        });

        test('无重置函数的对象池性能', () => {
            const pool = new ObjectPool(
                () => new TestObject(),
                undefined, // 无重置函数
                1000
            );

            // 预热池
            for (let i = 0; i < 100; i++) {
                pool.release(pool.get());
            }

            const startTime = performance.now();
            for (let i = 0; i < LARGE_ITERATIONS; i++) {
                const obj = pool.get();
                obj.value = i;
                pool.release(obj);
            }
            const endTime = performance.now();
            const duration = endTime - startTime;

            console.log(`无重置函数ObjectPool ${LARGE_ITERATIONS} 次操作耗时: ${duration.toFixed(2)}ms`);
            expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS * 0.8); // 应该更快
        });
    });

    describe('复杂对象性能测试', () => {
        test('复杂对象池化性能', () => {
            const pool = new ObjectPool(
                () => new ComplexObject(),
                (obj) => obj.reset(),
                500
            );

            const startTime = performance.now();
            
            for (let i = 0; i < MEDIUM_ITERATIONS; i++) {
                const obj = pool.get();
                
                // 模拟使用对象
                obj.data.push(Math.random());
                obj.map.set(`dynamic${i}`, i);
                obj.nested.items.push(`dynamic${i}`);
                obj.nested.count++;
                
                pool.release(obj);
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            console.log(`复杂对象池 ${MEDIUM_ITERATIONS} 次操作耗时: ${duration.toFixed(2)}ms`);
            expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
        });

        test('无池化 vs 池化性能对比', () => {
            const iterations = MEDIUM_ITERATIONS;
            
            // 无池化测试
            const nopoolStart = performance.now();
            for (let i = 0; i < iterations; i++) {
                const obj = new ComplexObject();
                obj.data.push(Math.random());
                obj.map.set(`test${i}`, i);
                // 对象被自动垃圾回收
            }
            const nopoolEnd = performance.now();
            const nopoolDuration = nopoolEnd - nopoolStart;

            // 池化测试
            const pool = new ObjectPool(
                () => new ComplexObject(),
                (obj) => obj.reset(),
                200
            );

            const poolStart = performance.now();
            for (let i = 0; i < iterations; i++) {
                const obj = pool.get();
                obj.data.push(Math.random());
                obj.map.set(`test${i}`, i);
                pool.release(obj);
            }
            const poolEnd = performance.now();
            const poolDuration = poolEnd - poolStart;

            console.log(`无池化创建 ${iterations} 个复杂对象耗时: ${nopoolDuration.toFixed(2)}ms`);
            console.log(`池化操作 ${iterations} 次耗时: ${poolDuration.toFixed(2)}ms`);
            console.log(`池化性能提升: ${((nopoolDuration - poolDuration) / nopoolDuration * 100).toFixed(1)}%`);

            // 在大量对象创建的情况下，池化应该更快
            expect(poolDuration).toBeLessThan(nopoolDuration);
        });
    });

    describe('行为树节点池性能测试', () => {
        test('BehaviorNodePoolManager 性能', () => {
            const poolManager = BehaviorNodePoolManager.getInstance();
            
            // 清理之前的注册
            poolManager.clearAll();
            
            // 注册ExecuteAction池
            poolManager.registerPool(
                'ExecuteAction',
                () => new ExecuteAction(() => TaskStatus.Success),
                (action) => action.invalidate(),
                100
            );

            const startTime = performance.now();
            
            for (let i = 0; i < MEDIUM_ITERATIONS; i++) {
                const action = poolManager.get<ExecuteAction<any>>('ExecuteAction');
                if (action) {
                    // 模拟使用行为节点
                    action.tick({} as any);
                    poolManager.release('ExecuteAction', action);
                }
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            console.log(`行为节点池管理器 ${MEDIUM_ITERATIONS} 次操作耗时: ${duration.toFixed(2)}ms`);
            
            const stats = poolManager.getStats();
            console.log('池统计信息:', stats);
            
            expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
        });

        test('多类型节点池并发性能', () => {
            const poolManager = BehaviorNodePoolManager.getInstance();
            
            // 清理之前的注册
            poolManager.clearAll();
            
            // 注册多种类型的节点池
            const nodeTypes = ['Action1', 'Action2', 'Action3', 'Condition1', 'Decorator1'];
            
            nodeTypes.forEach(type => {
                poolManager.registerPool(
                    type,
                    () => new ExecuteAction(() => TaskStatus.Success),
                    (node) => node.invalidate(),
                    50
                );
            });

            const startTime = performance.now();
            
            for (let i = 0; i < MEDIUM_ITERATIONS; i++) {
                const nodeType = nodeTypes[i % nodeTypes.length]!;
                const node = poolManager.get<ExecuteAction<any>>(nodeType);
                
                if (node) {
                    node.tick({} as any);
                    poolManager.release(nodeType, node);
                }
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            console.log(`多类型节点池 ${MEDIUM_ITERATIONS} 次操作耗时: ${duration.toFixed(2)}ms`);
            expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
        });
    });

    describe('内存使用优化测试', () => {
        test('内存使用效率对比', () => {
            const poolSizes = [10, 50, 100, 500];
            const results: Array<{ size: number; duration: number }> = [];
            
            poolSizes.forEach(size => {
                const pool = new ObjectPool(
                    () => new TestObject(),
                    (obj) => obj.reset(),
                    size
                );

                const startTime = performance.now();
                
                // 执行大量操作
                for (let i = 0; i < MEDIUM_ITERATIONS; i++) {
                    const obj = pool.get();
                    obj.value = i;
                    pool.release(obj);
                }
                
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                results.push({ size, duration });
                
                console.log(`池大小 ${size}: ${duration.toFixed(2)}ms`);
            });

            // 分析结果
            const bestResult = results.reduce((best, current) => 
                current.duration < best.duration ? current : best
            );
            
            console.log(`最佳池大小: ${bestResult.size}, 耗时: ${bestResult.duration.toFixed(2)}ms`);
            
            // 所有配置都应该在合理时间内完成
            results.forEach(result => {
                expect(result.duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
            });
        });

        test('长时间运行内存稳定性', () => {
            const pool = new ObjectPool(
                () => new ComplexObject(),
                (obj) => obj.reset(),
                100
            );

            const longRunIterations = 50000;
            const startTime = performance.now();
            
            for (let i = 0; i < longRunIterations; i++) {
                const obj = pool.get();
                
                // 模拟复杂使用
                obj.data.push(Math.random());
                obj.map.set(`key${i}`, i % 1000);
                obj.nested.items.push(`item${i % 100}`);
                
                pool.release(obj);
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            console.log(`长时间运行 ${longRunIterations} 次操作耗时: ${duration.toFixed(2)}ms`);
            console.log(`最终池大小: ${pool.size}`);
            
            expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS * 4); // 长时间运行允许更多时间
            expect(pool.size).toBeGreaterThan(0); // 池中应该有缓存对象
        });
    });

    describe('边界性能测试', () => {
        test('池容量限制性能', () => {
            const smallPool = new ObjectPool(
                () => new TestObject(),
                (obj) => obj.reset(),
                10 // 很小的池
            );

            const startTime = performance.now();
            
            for (let i = 0; i < MEDIUM_ITERATIONS; i++) {
                const obj = smallPool.get();
                obj.value = i;
                smallPool.release(obj);
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            console.log(`小池容量 ${MEDIUM_ITERATIONS} 次操作耗时: ${duration.toFixed(2)}ms`);
            console.log(`最终池大小: ${smallPool.size}`);
            
            expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
            expect(smallPool.size).toBeLessThanOrEqual(10); // 不应该超过最大容量
        });

        test('null对象处理性能', () => {
            const pool = new ObjectPool(
                () => new TestObject(),
                (obj) => obj.reset(),
                100
            );

            const startTime = performance.now();
            
            for (let i = 0; i < LARGE_ITERATIONS; i++) {
                const obj = pool.get();
                obj.value = i;
                
                // 偶尔release null对象（测试异常处理性能）
                if (i % 1000 === 0) {
                    pool.release(null as any);
                }
                
                pool.release(obj);
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            console.log(`包含null处理的 ${LARGE_ITERATIONS} 次操作耗时: ${duration.toFixed(2)}ms`);
            expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
        });
    });
});