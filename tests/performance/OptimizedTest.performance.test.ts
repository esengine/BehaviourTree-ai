/**
 * 优化的测试策略验证
 * 
 * 测试如何减少断言数量来提升测试套件性能
 */
import { ObjectPool } from '../../behaviourTree/ObjectPool';

describe('优化测试策略验证', () => {
    const ITERATIONS = 10000;

    describe('断言优化策略', () => {
        test('批量断言 vs 单个断言性能对比', () => {
            const pool = new ObjectPool(
                () => ({ value: 0, active: true }),
                (obj) => { obj.value = 0; obj.active = true; },
                100
            );

            // 策略1: 每次操作都断言 (低效)
            const singleAssertStart = performance.now();
            for (let i = 0; i < 1000; i++) { // 减少迭代次数避免测试超时
                const obj = pool.get();
                expect(obj).toBeDefined(); // 断言1
                expect(typeof obj.value).toBe('number'); // 断言2
                expect(typeof obj.active).toBe('boolean'); // 断言3
                obj.value = i;
                pool.release(obj);
            }
            const singleAssertEnd = performance.now();
            const singleAssertDuration = singleAssertEnd - singleAssertStart;

            // 策略2: 批量验证，最后断言 (高效)
            const batchAssertStart = performance.now();
            const results = [];
            for (let i = 0; i < 1000; i++) {
                const obj = pool.get();
                results.push({
                    isDefined: obj !== null && obj !== undefined,
                    valueType: typeof obj.value,
                    activeType: typeof obj.active
                });
                obj.value = i;
                pool.release(obj);
            }
            
            // 批量验证
            const allDefined = results.every(r => r.isDefined);
            const allValueNumber = results.every(r => r.valueType === 'number');
            const allActiveBoolean = results.every(r => r.activeType === 'boolean');
            
            expect(allDefined).toBe(true);
            expect(allValueNumber).toBe(true);
            expect(allActiveBoolean).toBe(true);
            
            const batchAssertEnd = performance.now();
            const batchAssertDuration = batchAssertEnd - batchAssertStart;

            console.log(`单个断言策略 1000次操作耗时: ${singleAssertDuration.toFixed(2)}ms`);
            console.log(`批量断言策略 1000次操作耗时: ${batchAssertDuration.toFixed(2)}ms`);
            console.log(`批量断言性能提升: ${((singleAssertDuration - batchAssertDuration) / singleAssertDuration * 100).toFixed(1)}%`);

            expect(batchAssertDuration).toBeLessThan(singleAssertDuration);
        });

        test('统计验证 vs 逐个验证', () => {
            const pool = new ObjectPool(
                () => ({ id: Math.random(), timestamp: Date.now() }),
                (obj) => { obj.id = Math.random(); obj.timestamp = Date.now(); }, // 重置为新的随机值
                50
            );

            // 策略1: 逐个验证对象属性
            const individualStart = performance.now();
            let individualCount = 0;
            for (let i = 0; i < 1000; i++) {
                const obj = pool.get();
                if (obj.id > 0 && obj.timestamp > 0) {
                    individualCount++;
                }
                pool.release(obj);
            }
            const individualEnd = performance.now();
            const individualDuration = individualEnd - individualStart;

            // 策略2: 统计验证
            const statsStart = performance.now();
            const stats = { validIds: 0, validTimestamps: 0, total: 0 };
            for (let i = 0; i < 1000; i++) {
                const obj = pool.get();
                stats.total++;
                if (obj.id > 0) stats.validIds++;
                if (obj.timestamp > 0) stats.validTimestamps++;
                pool.release(obj);
            }
            const statsEnd = performance.now();
            const statsDuration = statsEnd - statsStart;

            // 只在最后做断言
            expect(stats.validIds).toBe(stats.total);
            expect(stats.validTimestamps).toBe(stats.total);
            expect(individualCount).toBe(1000);

            console.log(`逐个验证耗时: ${individualDuration.toFixed(2)}ms`);
            console.log(`统计验证耗时: ${statsDuration.toFixed(2)}ms`);
            console.log(`统计验证性能提升: ${((individualDuration - statsDuration) / individualDuration * 100).toFixed(1)}%`);
        });
    });

    describe('测试结构优化', () => {
        test('单个综合测试 vs 多个小测试', () => {
            const pool = new ObjectPool(
                () => ({ data: new Array(100).fill(0) }),
                (obj) => obj.data.fill(0),
                10
            );

            // 模拟综合测试（一次验证多个功能）
            const comprehensiveStart = performance.now();
            
            // 功能1: 基本操作
            const obj1 = pool.get();
            const basicOpsValid = obj1 && obj1.data && obj1.data.length === 100;
            
            // 功能2: 数据修改  
            obj1.data[0] = 999;
            const modifyValid = obj1.data[0] === 999;
            
            // 功能3: 对象复用
            pool.release(obj1);
            const obj2 = pool.get();
            const reuseValid = obj2 === obj1 && obj2.data[0] === 0; // 重置后应该是0
            
            pool.release(obj2);
            
            const comprehensiveEnd = performance.now();
            const comprehensiveDuration = comprehensiveEnd - comprehensiveStart;

            // 单次断言验证所有功能
            expect(basicOpsValid && modifyValid && reuseValid).toBe(true);

            console.log(`综合测试耗时: ${comprehensiveDuration.toFixed(4)}ms`);
            console.log(`综合测试覆盖: 基本操作 + 数据修改 + 对象复用`);

            expect(comprehensiveDuration).toBeLessThan(1); // 应该极快
        });
    });

    describe('性能基准建立', () => {
        test('建立ObjectPool性能基准', () => {
            const pool = new ObjectPool(
                () => ({ value: 0 }),
                (obj) => obj.value = 0,
                100
            );

            const iterations = 10000;
            const results = {
                getTime: 0,
                releaseTime: 0,
                totalTime: 0,
                operations: 0
            };

            const totalStart = performance.now();
            
            for (let i = 0; i < iterations; i++) {
                // 测量get操作
                const getStart = performance.now();
                const obj = pool.get();
                const getEnd = performance.now();
                results.getTime += (getEnd - getStart);
                
                // 使用对象
                obj.value = i;
                
                // 测量release操作
                const releaseStart = performance.now();
                pool.release(obj);
                const releaseEnd = performance.now();
                results.releaseTime += (releaseEnd - releaseStart);
                
                results.operations++;
            }
            
            const totalEnd = performance.now();
            results.totalTime = totalEnd - totalStart;

            // 计算统计信息
            const avgGetTime = results.getTime / results.operations * 1000; // μs
            const avgReleaseTime = results.releaseTime / results.operations * 1000; // μs
            const avgTotalTime = results.totalTime / results.operations * 1000; // μs
            const operationsPerSecond = results.operations / (results.totalTime / 1000);

            console.log(`ObjectPool性能基准 (${iterations}次操作):`);
            console.log(`  平均get时间: ${avgGetTime.toFixed(3)}μs`);
            console.log(`  平均release时间: ${avgReleaseTime.toFixed(3)}μs`);
            console.log(`  平均总时间: ${avgTotalTime.toFixed(3)}μs`);
            console.log(`  操作/秒: ${operationsPerSecond.toFixed(0)}`);
            console.log(`  总耗时: ${results.totalTime.toFixed(2)}ms`);

            // 性能目标
            expect(avgTotalTime).toBeLessThan(1); // 每次操作应该少于1μs
            expect(operationsPerSecond).toBeGreaterThan(100000); // 每秒至少10万次操作
            expect(results.totalTime).toBeLessThan(50); // 1万次操作应该在50ms内

            // 单次断言验证所有性能指标
            const performanceGood = avgTotalTime < 1 && 
                                   operationsPerSecond > 100000 && 
                                   results.totalTime < 50;
            expect(performanceGood).toBe(true);
        });
    });

    describe('内存效率验证', () => {
        test('内存使用模式分析', () => {
            const smallPool = new ObjectPool(() => ({}), undefined, 5);
            const largePool = new ObjectPool(() => ({}), undefined, 100);

            const testPattern = (pool: ObjectPool<any>, name: string) => {
                const startTime = performance.now();
                const objects = [];
                
                // 获取大量对象
                for (let i = 0; i < 200; i++) {
                    objects.push(pool.get());
                }
                
                // 归还所有对象
                objects.forEach(obj => pool.release(obj));
                
                const endTime = performance.now();
                return {
                    name,
                    duration: endTime - startTime,
                    finalSize: pool.size,
                    maxSize: pool.maxSize
                };
            };

            const smallResult = testPattern(smallPool, 'SmallPool');
            const largeResult = testPattern(largePool, 'LargePool');

            console.log(`${smallResult.name}: ${smallResult.duration.toFixed(2)}ms, 最终大小: ${smallResult.finalSize}/${smallResult.maxSize}`);
            console.log(`${largeResult.name}: ${largeResult.duration.toFixed(2)}ms, 最终大小: ${largeResult.finalSize}/${largeResult.maxSize}`);

            // 验证内存效率
            const smallEfficient = smallResult.finalSize <= smallResult.maxSize;
            const largeEfficient = largeResult.finalSize <= largeResult.maxSize;
            const performanceReasonable = smallResult.duration < 50 && largeResult.duration < 50;

            expect(smallEfficient && largeEfficient && performanceReasonable).toBe(true);
        });
    });
});