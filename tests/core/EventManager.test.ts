import { EventManager, EventManagerConfig } from '../../core/EventManager';

describe('EventManager 事件管理器测试', () => {
    let eventManager: EventManager;

    beforeEach(() => {
        eventManager = new EventManager({
            enableAutoCleanup: false, // 在测试中禁用自动清理
            maxListeners: 100
        });
    });

    afterEach(() => {
        eventManager.destroy();
    });

    describe('基本功能测试', () => {
        test('应该能创建EventManager实例', () => {
            expect(eventManager).toBeInstanceOf(EventManager);
            expect(eventManager.getStats().totalListeners).toBe(0);
        });

        test('应该能添加事件监听器', () => {
            const callback = jest.fn();
            const listenerId = eventManager.on('test', callback);
            
            expect(listenerId).toMatch(/^listener_\d+_\d+$/);
            expect(eventManager.hasListeners('test')).toBe(true);
            expect(eventManager.getListenerCount('test')).toBe(1);
        });

        test('应该能触发事件', () => {
            const callback = jest.fn();
            const testData = { value: 123 };
            
            eventManager.on('test', callback);
            const result = eventManager.emit('test', testData);
            
            expect(result).toBe(1);
            expect(callback).toHaveBeenCalledWith(testData);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        test('应该能移除事件监听器', () => {
            const callback = jest.fn();
            const listenerId = eventManager.on('test', callback);
            
            const removed = eventManager.off('test', listenerId);
            
            expect(removed).toBe(true);
            expect(eventManager.hasListeners('test')).toBe(false);
            expect(eventManager.getListenerCount('test')).toBe(0);
        });
    });

    describe('多监听器测试', () => {
        test('应该能添加多个监听器', () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();
            const callback3 = jest.fn();
            
            eventManager.on('test', callback1);
            eventManager.on('test', callback2);
            eventManager.on('test', callback3);
            
            expect(eventManager.getListenerCount('test')).toBe(3);
            
            eventManager.emit('test', 'data');
            
            expect(callback1).toHaveBeenCalledWith('data');
            expect(callback2).toHaveBeenCalledWith('data');
            expect(callback3).toHaveBeenCalledWith('data');
        });

        test('应该能移除所有指定事件的监听器', () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();
            
            eventManager.on('test', callback1);
            eventManager.on('test', callback2);
            eventManager.on('other', callback1);
            
            const removedCount = eventManager.offAll('test');
            
            expect(removedCount).toBe(2);
            expect(eventManager.hasListeners('test')).toBe(false);
            expect(eventManager.hasListeners('other')).toBe(true);
        });
    });

    describe('优先级测试', () => {
        test('应该按优先级顺序执行监听器', () => {
            const executionOrder: number[] = [];
            
            const callback1 = () => executionOrder.push(1);
            const callback2 = () => executionOrder.push(2);
            const callback3 = () => executionOrder.push(3);
            
            // 添加监听器时不按优先级顺序
            eventManager.on('test', callback2, { priority: 2 });
            eventManager.on('test', callback1, { priority: 1 });
            eventManager.on('test', callback3, { priority: 3 });
            
            eventManager.emit('test');
            
            // 应该按优先级从高到低执行 (3, 2, 1)
            expect(executionOrder).toEqual([3, 2, 1]);
        });

        test('相同优先级的监听器应该按添加顺序执行', () => {
            const executionOrder: string[] = [];
            
            const callback1 = () => executionOrder.push('first');
            const callback2 = () => executionOrder.push('second');
            
            eventManager.on('test', callback1, { priority: 1 });
            eventManager.on('test', callback2, { priority: 1 });
            
            eventManager.emit('test');
            
            expect(executionOrder).toEqual(['first', 'second']);
        });
    });

    describe('一次性监听器测试', () => {
        test('once监听器应该只执行一次', () => {
            const callback = jest.fn();
            
            eventManager.once('test', callback);
            
            eventManager.emit('test', 'data1');
            eventManager.emit('test', 'data2');
            
            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith('data1');
            expect(eventManager.hasListeners('test')).toBe(false);
        });

        test('on方法的once选项应该工作', () => {
            const callback = jest.fn();
            
            eventManager.on('test', callback, { once: true });
            
            eventManager.emit('test');
            eventManager.emit('test');
            
            expect(callback).toHaveBeenCalledTimes(1);
        });
    });

    describe('弱引用监听器测试', () => {
        test('应该能添加弱引用监听器', () => {
            const callback = jest.fn();
            const owner = { name: 'test' };
            
            const listenerId = eventManager.onWeak('test', callback, owner);
            
            expect(listenerId).toBeTruthy();
            expect(eventManager.hasListeners('test')).toBe(true);
        });

        test('应该能通过拥有者移除监听器', () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();
            const owner1 = { name: 'owner1' };
            const owner2 = { name: 'owner2' };
            
            eventManager.onWeak('test', callback1, owner1);
            eventManager.onWeak('test', callback2, owner2);
            eventManager.on('test', callback1); // 普通监听器
            
            const removedCount = eventManager.offByOwner(owner1);
            
            expect(removedCount).toBe(1);
            expect(eventManager.getListenerCount('test')).toBe(2);
        });
    });

    describe('错误处理测试', () => {
        test('应该处理监听器执行异常', () => {
            const errorCallback = () => { throw new Error('测试错误'); };
            const normalCallback = jest.fn();
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            eventManager.on('test', errorCallback);
            eventManager.on('test', normalCallback);
            
            const result = eventManager.emit('test');
            
            expect(result).toBe(1); // 只有normalCallback成功执行
            expect(normalCallback).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });

        test('移除不存在的监听器应该返回false', () => {
            const result = eventManager.off('nonexistent', 'invalid-id');
            expect(result).toBe(false);
        });

        test('移除不存在事件的监听器应该返回false', () => {
            const result = eventManager.off('nonexistent', 'some-id');
            expect(result).toBe(false);
        });
    });

    describe('统计信息测试', () => {
        test('应该正确跟踪统计信息', () => {
            const callback = jest.fn();
            
            eventManager.on('test1', callback);
            eventManager.on('test2', callback);
            
            let stats = eventManager.getStats();
            expect(stats.totalListeners).toBe(2);
            expect(stats.activeListeners).toBe(2);
            expect(stats.totalEvents).toBe(0);
            
            eventManager.emit('test1');
            eventManager.emit('test2');
            
            stats = eventManager.getStats();
            expect(stats.totalEvents).toBe(2);
        });

        test('应该能重置统计信息', () => {
            const callback = jest.fn();
            
            eventManager.on('test', callback);
            eventManager.emit('test');
            
            eventManager.resetStats();
            
            const stats = eventManager.getStats();
            expect(stats.totalEvents).toBe(0);
            expect(stats.averageEventTime).toBe(0);
            expect(stats.totalListeners).toBeGreaterThan(0); // 监听器数量不应该被重置
        });
    });

    describe('性能监控测试', () => {
        test('启用性能监控时应该跟踪执行时间', () => {
            const performanceManager = new EventManager({
                enablePerformanceMonitoring: true,
                enableAutoCleanup: false
            });
            
            const callback = () => {
                // 模拟一些处理时间
                const start = performance.now();
                while (performance.now() - start < 1) { /* 忙等1ms */ }
            };
            
            performanceManager.on('test', callback);
            performanceManager.emit('test');
            
            const stats = performanceManager.getStats();
            expect(stats.averageEventTime).toBeGreaterThan(0);
            
            performanceManager.destroy();
        });
    });

    describe('监听器限制测试', () => {
        test('应该限制最大监听器数量', () => {
            const limitedManager = new EventManager({
                maxListeners: 3,
                enableAutoCleanup: false
            });
            
            const callback = jest.fn();
            
            limitedManager.on('test', callback);
            limitedManager.on('test', callback);
            limitedManager.on('test', callback);
            
            expect(() => {
                limitedManager.on('test', callback);
            }).toThrow('无法添加更多事件监听器，已达到上限');
            
            limitedManager.destroy();
        });

        test('达到限制时应该尝试自动清理', () => {
            const limitedManager = new EventManager({
                maxListeners: 2,
                enableAutoCleanup: true // 启用自动清理以触发cleanup调用
            });
            
            const callback = jest.fn();
            const cleanupSpy = jest.spyOn(limitedManager, 'cleanup');
            
            limitedManager.on('test', callback);
            limitedManager.on('test', callback);
            
            try {
                limitedManager.on('test', callback);
            } catch (error) {
                // 预期会抛出错误
            }
            
            expect(cleanupSpy).toHaveBeenCalled();
            
            limitedManager.destroy();
        });
    });

    describe('事件信息查询测试', () => {
        test('应该能获取所有事件名称', () => {
            const callback = jest.fn();
            
            eventManager.on('event1', callback);
            eventManager.on('event2', callback);
            eventManager.on('event3', callback);
            
            const eventNames = eventManager.getEventNames();
            
            expect(eventNames).toContain('event1');
            expect(eventNames).toContain('event2');
            expect(eventNames).toContain('event3');
            expect(eventNames.length).toBe(3);
        });

        test('hasListeners应该正确报告监听器存在状态', () => {
            const callback = jest.fn();
            
            expect(eventManager.hasListeners('test')).toBe(false);
            
            eventManager.on('test', callback);
            expect(eventManager.hasListeners('test')).toBe(true);
            
            eventManager.offAll('test');
            expect(eventManager.hasListeners('test')).toBe(false);
        });
    });

    describe('清理功能测试', () => {
        test('手动清理应该移除过期监听器', () => {
            const shortLivedManager = new EventManager({
                enableAutoCleanup: false,
                listenerExpirationTime: 100 // 100ms过期时间
            });
            
            const callback = jest.fn();
            shortLivedManager.on('test', callback);
            
            // 等待过期时间
            setTimeout(() => {
                const removedCount = shortLivedManager.cleanup();
                expect(removedCount).toBeGreaterThan(0);
                expect(shortLivedManager.hasListeners('test')).toBe(false);
                
                shortLivedManager.destroy();
            }, 150);
        });

        test('强制清理应该移除所有监听器', () => {
            const callback = jest.fn();
            
            eventManager.on('test1', callback);
            eventManager.on('test2', callback);
            
            const removedCount = eventManager.cleanup(true);
            
            expect(removedCount).toBe(2);
            expect(eventManager.getStats().totalListeners).toBe(0);
        });
    });

    describe('实际使用场景测试', () => {
        test('游戏事件系统模拟', () => {
            interface PlayerDeathData {
                playerId: string;
                position: { x: number; y: number };
                killer?: string;
            }
            
            const playerDeathData: PlayerDeathData = {
                playerId: 'player123',
                position: { x: 100, y: 200 },
                killer: 'enemy456'
            };
            
            const uiCallback = jest.fn();
            const statisticsCallback = jest.fn();
            const soundCallback = jest.fn();
            
            // UI系统监听玩家死亡事件（高优先级）
            eventManager.on<PlayerDeathData>('playerDeath', uiCallback, { priority: 10 });
            
            // 统计系统监听（普通优先级）
            eventManager.on<PlayerDeathData>('playerDeath', statisticsCallback, { priority: 5 });
            
            // 音效系统监听（低优先级）
            eventManager.on<PlayerDeathData>('playerDeath', soundCallback, { priority: 1 });
            
            eventManager.emit('playerDeath', playerDeathData);
            
            expect(uiCallback).toHaveBeenCalledWith(playerDeathData);
            expect(statisticsCallback).toHaveBeenCalledWith(playerDeathData);
            expect(soundCallback).toHaveBeenCalledWith(playerDeathData);
        });

        test('临时事件监听', () => {
            const callback = jest.fn();
            
            // 监听加载完成事件，只需要监听一次
            eventManager.once('loadComplete', callback);
            
            eventManager.emit('loadComplete', { success: true });
            eventManager.emit('loadComplete', { success: true }); // 第二次不应该触发
            
            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith({ success: true });
        });

        test('组件生命周期管理', () => {
            class GameComponent {
                private _listenerId: string;
                
                constructor(eventManager: EventManager) {
                    this._listenerId = eventManager.onWeak('update', this.onUpdate.bind(this), this);
                }
                
                onUpdate(deltaTime: number) {
                    // 组件更新逻辑
                }
                
                destroy(eventManager: EventManager) {
                    eventManager.offByOwner(this);
                }
            }
            
            const component1 = new GameComponent(eventManager);
            const component2 = new GameComponent(eventManager);
            
            expect(eventManager.getListenerCount('update')).toBe(2);
            
            component1.destroy(eventManager);
            
            expect(eventManager.getListenerCount('update')).toBe(1);
        });
    });

    describe('边界情况测试', () => {
        test('空事件名称应该能正常处理', () => {
            const callback = jest.fn();
            
            eventManager.on('', callback);
            const result = eventManager.emit('', 'data');
            
            expect(result).toBe(1);
            expect(callback).toHaveBeenCalledWith('data');
        });

        test('undefined数据应该能正常传递', () => {
            const callback = jest.fn();
            
            eventManager.on('test', callback);
            eventManager.emit('test', undefined);
            
            expect(callback).toHaveBeenCalledWith(undefined);
        });

        test('复杂对象数据应该能正常传递', () => {
            const callback = jest.fn();
            const complexData = {
                nested: { value: 123 },
                array: [1, 2, 3],
                func: () => 'test',
                date: new Date()
            };
            
            eventManager.on('test', callback);
            eventManager.emit('test', complexData);
            
            expect(callback).toHaveBeenCalledWith(complexData);
        });
    });
});