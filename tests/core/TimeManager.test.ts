import { TimeManager, TimeManagerConfig } from '../../core/TimeManager';

describe('TimeManager 时间管理器测试', () => {
    beforeEach(() => {
        TimeManager.reset();
    });

    afterEach(() => {
        TimeManager.reset();
    });

    describe('基本功能测试', () => {
        test('应该能正确初始化', () => {
            TimeManager.initialize();
            
            expect(TimeManager.getCurrentTime()).toBe(0);
            expect(TimeManager.getDeltaTime()).toBe(0);
            expect(TimeManager.getFrameCount()).toBe(0);
        });

        test('应该能更新帧时间', () => {
            TimeManager.initialize();
            
            TimeManager.updateFrame(0.016); // 模拟60fps
            
            expect(TimeManager.getFrameCount()).toBe(1);
            expect(TimeManager.getDeltaTime()).toBeCloseTo(0.016, 3);
            expect(TimeManager.getCurrentTime()).toBeCloseTo(0.016, 3);
        });

        test('应该能处理多次帧更新', () => {
            TimeManager.initialize();
            
            TimeManager.updateFrame(0.016);
            TimeManager.updateFrame(0.020);
            TimeManager.updateFrame(0.014);
            
            expect(TimeManager.getFrameCount()).toBe(3);
            expect(TimeManager.getCurrentTime()).toBeCloseTo(0.050, 3);
        });
    });

    describe('配置测试', () => {
        test('应该能设置最大时间差', () => {
            const config: TimeManagerConfig = {
                maxDeltaTime: 0.05
            };
            TimeManager.configure(config);
            TimeManager.initialize();
            
            // 测试大时间差被限制
            TimeManager.updateFrame(0.200); // 超过0.05的时间差
            
            expect(TimeManager.getDeltaTime()).toBeLessThanOrEqual(0.05);
        });

        test('应该能设置时间缩放', () => {
            const config: TimeManagerConfig = {
                timeScale: 0.5
            };
            TimeManager.configure(config);
            TimeManager.initialize();
            
            TimeManager.updateFrame(0.020);
            
            expect(TimeManager.getDeltaTime()).toBeCloseTo(0.010, 3); // 0.020 * 0.5
            expect(TimeManager.getUnscaledDeltaTime()).toBeCloseTo(0.020, 3);
        });

        test('应该能动态设置时间缩放', () => {
            TimeManager.initialize();
            TimeManager.setTimeScale(2.0);
            
            TimeManager.updateFrame(0.016);
            
            expect(TimeManager.getDeltaTime()).toBeCloseTo(0.032, 3); // 0.016 * 2.0
            expect(TimeManager.getTimeScale()).toBe(2.0);
        });

        test('时间缩放不应该小于0', () => {
            TimeManager.setTimeScale(-1.0);
            expect(TimeManager.getTimeScale()).toBe(0);
        });
    });

    describe('帧率计算测试', () => {
        test('应该能计算当前帧率', () => {
            TimeManager.initialize();
            
            TimeManager.updateFrame(0.016); // 60 fps
            
            const fps = TimeManager.getCurrentFPS();
            expect(fps).toBeCloseTo(62.5, 1); // 1/0.016 ≈ 62.5
        });

        test('应该能计算平均帧率', () => {
            TimeManager.initialize();
            
            TimeManager.updateFrame(0.016); // 60 fps
            TimeManager.updateFrame(0.020); // 50 fps
            
            const avgFps = TimeManager.getAverageFPS();
            expect(avgFps).toBeGreaterThan(0);
            expect(avgFps).toBeLessThan(100);
        });

        test('时间差为0时帧率应该为0', () => {
            TimeManager.initialize();
            
            TimeManager.updateFrame(0); // 零时间差
            
            expect(TimeManager.getCurrentFPS()).toBe(0);
        });
    });

    describe('回调系统测试', () => {
        test('应该能添加和触发时间更新回调', () => {
            const callback = jest.fn();
            TimeManager.addUpdateCallback(callback);
            TimeManager.initialize();
            
            TimeManager.updateFrame(0.016);
            
            expect(callback).toHaveBeenCalledWith(0.016);
        });

        test('应该能移除回调', () => {
            const callback = jest.fn();
            TimeManager.addUpdateCallback(callback);
            TimeManager.removeUpdateCallback(callback);
            TimeManager.initialize();
            
            TimeManager.updateFrame(0.016);
            
            expect(callback).not.toHaveBeenCalled();
        });

        test('应该能清除所有回调', () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();
            TimeManager.addUpdateCallback(callback1);
            TimeManager.addUpdateCallback(callback2);
            TimeManager.clearUpdateCallbacks();
            TimeManager.initialize();
            
            TimeManager.updateFrame(0.016);
            
            expect(callback1).not.toHaveBeenCalled();
            expect(callback2).not.toHaveBeenCalled();
        });

        test('应该处理回调异常', () => {
            const errorCallback = () => { throw new Error('测试错误'); };
            const normalCallback = jest.fn();
            
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            TimeManager.addUpdateCallback(errorCallback);
            TimeManager.addUpdateCallback(normalCallback);
            TimeManager.initialize();
            
            TimeManager.updateFrame(0.016);
            
            expect(consoleSpy).toHaveBeenCalled();
            expect(normalCallback).toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });

        test('不应该重复添加相同的回调', () => {
            const callback = jest.fn();
            TimeManager.addUpdateCallback(callback);
            TimeManager.addUpdateCallback(callback); // 重复添加
            TimeManager.initialize();
            
            TimeManager.updateFrame(0.016);
            
            expect(callback).toHaveBeenCalledTimes(1);
        });
    });

    describe('统计信息测试', () => {
        test('应该能获取完整的统计信息', () => {
            TimeManager.initialize();
            TimeManager.updateFrame(0.016);
            
            const stats = TimeManager.getStats();
            
            expect(stats).toHaveProperty('currentTime');
            expect(stats).toHaveProperty('deltaTime');
            expect(stats).toHaveProperty('unscaledDeltaTime');
            expect(stats).toHaveProperty('timeScale');
            expect(stats).toHaveProperty('frameCount');
            expect(stats).toHaveProperty('averageFPS');
            expect(stats).toHaveProperty('currentFPS');
            expect(stats).toHaveProperty('maxDeltaTime');
            expect(stats).toHaveProperty('useHighPrecision');
            
            expect(stats.frameCount).toBe(1);
            expect(stats.deltaTime).toBeCloseTo(0.016, 3);
        });
    });

    describe('边界情况测试', () => {
        test('应该能处理负时间差', () => {
            TimeManager.initialize();
            
            TimeManager.updateFrame(-0.016);
            
            expect(TimeManager.getDeltaTime()).toBe(0);
            expect(TimeManager.getCurrentTime()).toBe(0);
        });

        test('应该能处理第一帧的特殊情况', () => {
            TimeManager.initialize();
            
            // 第一帧不应该有时间差
            TimeManager.updateFrame(); // 不提供外部时间差
            
            expect(TimeManager.getDeltaTime()).toBe(0);
            expect(TimeManager.getFrameCount()).toBe(1);
        });

        test('重置应该清除所有状态', () => {
            TimeManager.initialize();
            TimeManager.updateFrame(0.016);
            const callback = jest.fn();
            TimeManager.addUpdateCallback(callback);
            
            TimeManager.reset();
            
            expect(TimeManager.getCurrentTime()).toBe(0);
            expect(TimeManager.getFrameCount()).toBe(0);
            expect(TimeManager.getDeltaTime()).toBe(0);
            
            // 重新初始化后回调应该被清除
            TimeManager.initialize();
            TimeManager.updateFrame(0.016);
            expect(callback).not.toHaveBeenCalled();
        });

        test('配置验证应该处理无效值', () => {
            const config: TimeManagerConfig = {
                maxDeltaTime: -1, // 无效值
                timeScale: -1      // 无效值
            };
            
            TimeManager.configure(config);
            
            // 配置方法内部应该修正无效值
            const stats = TimeManager.getStats();
            expect(stats.maxDeltaTime).toBeGreaterThan(0);
            expect(stats.timeScale).toBeGreaterThanOrEqual(0);
        });
    });

    describe('性能测试', () => {
        test('大量帧更新应该高效执行', () => {
            TimeManager.initialize();
            
            const startTime = performance.now();
            
            for (let i = 0; i < 1000; i++) {
                TimeManager.updateFrame(0.016);
            }
            
            const endTime = performance.now();
            const executionTime = endTime - startTime;
            
            expect(executionTime).toBeLessThan(100); // 应该在100ms内完成
            expect(TimeManager.getFrameCount()).toBe(1000);
        });

        test('大量回调应该高效执行', () => {
            const callbacks: (() => void)[] = [];
            
            // 添加100个回调
            for (let i = 0; i < 100; i++) {
                const callback = jest.fn();
                callbacks.push(callback);
                TimeManager.addUpdateCallback(callback);
            }
            
            TimeManager.initialize();
            
            const startTime = performance.now();
            TimeManager.updateFrame(0.016);
            const endTime = performance.now();
            
            const executionTime = endTime - startTime;
            expect(executionTime).toBeLessThan(50); // 应该在50ms内完成
            
            // 验证所有回调都被调用
            callbacks.forEach(callback => {
                expect(callback).toHaveBeenCalledWith(0.016);
            });
        });
    });

    describe('实际使用场景测试', () => {
        test('游戏循环模拟', () => {
            TimeManager.initialize();
            
            let totalGameTime = 0;
            const gameCallback = (deltaTime: number) => {
                totalGameTime += deltaTime;
            };
            
            TimeManager.addUpdateCallback(gameCallback);
            
            // 模拟60fps游戏循环
            for (let i = 0; i < 60; i++) {
                TimeManager.updateFrame(1/60); // 1秒钟60帧
            }
            
            expect(TimeManager.getFrameCount()).toBe(60);
            expect(totalGameTime).toBeCloseTo(1.0, 2); // 1秒钟
            expect(TimeManager.getCurrentTime()).toBeCloseTo(1.0, 2);
        });

        test('慢动作效果', () => {
            TimeManager.initialize();
            TimeManager.setTimeScale(0.1); // 10倍慢动作
            
            TimeManager.updateFrame(0.016);
            
            expect(TimeManager.getDeltaTime()).toBeCloseTo(0.0016, 4);
            expect(TimeManager.getUnscaledDeltaTime()).toBeCloseTo(0.016, 4);
        });

        test('暂停游戏', () => {
            TimeManager.initialize();
            TimeManager.setTimeScale(0); // 暂停
            
            const initialTime = TimeManager.getCurrentTime();
            TimeManager.updateFrame(0.016);
            
            expect(TimeManager.getCurrentTime()).toBe(initialTime);
            expect(TimeManager.getDeltaTime()).toBe(0);
        });
    });
});