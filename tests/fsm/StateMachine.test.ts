import { StateMachine } from '../../fsm/StateMachine';
import { State } from '../../fsm/State';

// 测试上下文接口
interface TestContext {
    value: number;
    message: string;
}

// 测试状态实现
class IdleState extends State<TestContext> {
    public beginCalled = false;
    public updateCalled = false;
    public endCalled = false;
    public updateCount = 0;

    override begin(): void {
        this.beginCalled = true;
    }

    override update(deltaTime: number): void {
        this.updateCalled = true;
        this.updateCount++;
        this._context.value += deltaTime;
    }

    override end(): void {
        this.endCalled = true;
    }
}

class AttackState extends State<TestContext> {
    public beginCalled = false;
    public updateCalled = false;
    public endCalled = false;
    public updateCount = 0;

    override begin(): void {
        this.beginCalled = true;
        this._context.message = 'attacking';
    }

    override update(deltaTime: number): void {
        this.updateCalled = true;
        this.updateCount++;
        this._context.value += deltaTime * 2; // 攻击状态值增长更快
    }

    override end(): void {
        this.endCalled = true;
    }
}

class DefendState extends State<TestContext> {
    public beginCalled = false;
    public updateCalled = false;
    public endCalled = false;
    public transitionRequested = false;

    override begin(): void {
        this.beginCalled = true;
        this._context.message = 'defending';
    }

    override update(deltaTime: number): void {
        this.updateCalled = true;
        this._context.value += deltaTime * 0.5; // 防御状态值增长较慢
        
        // 自动转换到空闲状态的条件
        if (this._context.value > 10 && !this.transitionRequested) {
            this.transitionRequested = true;
            this._machine.changeState(IdleState);
        }
    }

    override end(): void {
        this.endCalled = true;
    }
}

describe('StateMachine 状态机测试', () => {
    let context: TestContext;
    let stateMachine: StateMachine<TestContext>;
    let idleState: IdleState;

    beforeEach(() => {
        context = { value: 0, message: '' };
        idleState = new IdleState();
        stateMachine = new StateMachine(context, idleState);
    });

    describe('构造函数测试', () => {
        test('应该能创建状态机实例', () => {
            expect(stateMachine).toBeInstanceOf(StateMachine);
            expect(stateMachine.currentState).toBe(idleState);
            expect(stateMachine.elapsedTimeInState).toBe(0);
        });

        test('构造时应该调用初始状态的begin方法', () => {
            expect(idleState.beginCalled).toBe(true);
        });

        test('null上下文应该抛出错误', () => {
            expect(() => {
                new StateMachine(null as any, idleState);
            }).toThrow('上下文不能为null或undefined');
        });

        test('null初始状态应该抛出错误', () => {
            expect(() => {
                new StateMachine(context, null as any);
            }).toThrow('初始状态不能为null或undefined');
        });
    });

    describe('状态添加测试', () => {
        test('应该能添加新状态', () => {
            const attackState = new AttackState();
            
            expect(() => {
                stateMachine.addState(attackState);
            }).not.toThrow();
            
            expect(attackState.machine).toBe(stateMachine);
            expect(attackState.context).toBe(context);
        });

        test('重复添加相同类型的状态应该抛出错误', () => {
            const anotherIdleState = new IdleState();
            
            expect(() => {
                stateMachine.addState(anotherIdleState);
            }).toThrow('状态 IdleState 已经存在');
        });

        test('添加null状态应该抛出错误', () => {
            expect(() => {
                stateMachine.addState(null as any);
            }).toThrow('状态不能为null或undefined');
        });
    });

    describe('状态更新测试', () => {
        test('应该能更新当前状态', () => {
            const deltaTime = 0.016;
            
            stateMachine.update(deltaTime);
            
            expect(idleState.updateCalled).toBe(true);
            expect(idleState.updateCount).toBe(1);
            expect(context.value).toBeCloseTo(deltaTime, 3);
            expect(stateMachine.elapsedTimeInState).toBeCloseTo(deltaTime, 3);
        });

        test('多次更新应该累积时间', () => {
            stateMachine.update(0.016);
            stateMachine.update(0.020);
            stateMachine.update(0.014);
            
            expect(idleState.updateCount).toBe(3);
            expect(context.value).toBeCloseTo(0.050, 3);
            expect(stateMachine.elapsedTimeInState).toBeCloseTo(0.050, 3);
        });

        test('负数或零deltaTime应该被正确处理', () => {
            const initialValue = context.value;
            const initialTime = stateMachine.elapsedTimeInState;
            
            stateMachine.update(-0.016);
            stateMachine.update(0);
            
            // 状态仍然应该被更新，但时间不应该变化
            expect(idleState.updateCount).toBe(2);
            expect(stateMachine.elapsedTimeInState).toBe(initialTime);
        });
    });

    describe('状态切换测试', () => {
        test('应该能切换到已添加的状态', () => {
            const attackState = new AttackState();
            stateMachine.addState(attackState);
            
            stateMachine.changeState(AttackState);
            
            expect(idleState.endCalled).toBe(true);
            expect(attackState.beginCalled).toBe(true);
            expect(stateMachine.currentState).toBe(attackState);
            expect(stateMachine.previousState).toBe(idleState);
            expect(stateMachine.elapsedTimeInState).toBe(0);
        });

        test('切换到未添加的状态应该抛出错误', () => {
            expect(() => {
                stateMachine.changeState(AttackState);
            }).toThrow('状态 AttackState 不存在');
        });

        test('切换到当前状态应该重新开始', () => {
            stateMachine.update(0.1); // 让状态运行一段时间
            
            const beforeTime = stateMachine.elapsedTimeInState;
            expect(beforeTime).toBeGreaterThan(0);
            
            stateMachine.changeState(IdleState);
            
            expect(idleState.endCalled).toBe(true);
            expect(idleState.beginCalled).toBe(true); // 应该重新调用begin
            expect(stateMachine.elapsedTimeInState).toBe(0);
        });

        test('状态切换应该触发回调', () => {
            const callback = jest.fn();
            stateMachine.onStateChanged = callback;
            
            const attackState = new AttackState();
            stateMachine.addState(attackState);
            
            stateMachine.changeState(AttackState);
            
            expect(callback).toHaveBeenCalledTimes(1);
        });
    });

    describe('状态恢复测试', () => {
        test('应该能恢复到前一个状态', () => {
            const attackState = new AttackState();
            stateMachine.addState(attackState);
            
            // 切换到攻击状态
            stateMachine.changeState(AttackState);
            expect(stateMachine.currentState).toBe(attackState);
            expect(stateMachine.previousState).toBe(idleState);
            
            // 恢复到前一个状态
            stateMachine.revertToPreviousState();
            
            expect(stateMachine.currentState).toBe(idleState);
            expect(attackState.endCalled).toBe(true);
            expect(stateMachine.elapsedTimeInState).toBe(0);
        });

        test('没有前一个状态时恢复应该没有效果', () => {
            const currentState = stateMachine.currentState;
            
            stateMachine.revertToPreviousState();
            
            expect(stateMachine.currentState).toBe(currentState);
            expect(stateMachine.previousState).toBeUndefined();
        });
    });

    describe('状态查询测试', () => {
        test('应该能检查是否在指定状态', () => {
            expect(stateMachine.isInState(IdleState)).toBe(true);
            expect(stateMachine.isInState(AttackState)).toBe(false);
            
            const attackState = new AttackState();
            stateMachine.addState(attackState);
            stateMachine.changeState(AttackState);
            
            expect(stateMachine.isInState(IdleState)).toBe(false);
            expect(stateMachine.isInState(AttackState)).toBe(true);
        });

        test('应该能获取状态实例', () => {
            const attackState = new AttackState();
            stateMachine.addState(attackState);
            
            expect(stateMachine.getState(AttackState)).toBe(attackState);
            expect(stateMachine.getState(IdleState)).toBe(idleState);
        });

        test('获取不存在的状态应该返回null', () => {
            expect(stateMachine.getState(AttackState)).toBeNull();
        });
    });

    describe('上下文管理测试', () => {
        test('应该能更新上下文', () => {
            const newContext: TestContext = { value: 100, message: 'new' };
            
            stateMachine.setContext(newContext);
            
            expect(idleState.context).toBe(newContext);
            
            // 添加新状态时也应该使用新上下文
            const attackState = new AttackState();
            stateMachine.addState(attackState);
            expect(attackState.context).toBe(newContext);
        });

        test('设置null上下文应该抛出错误', () => {
            expect(() => {
                stateMachine.setContext(null as any);
            }).toThrow('上下文不能为null或undefined');
        });
    });

    describe('复杂状态切换测试', () => {
        test('状态应该能在update中请求状态切换', () => {
            const defendState = new DefendState();
            stateMachine.addState(defendState);
            
            // 切换到防御状态
            stateMachine.changeState(DefendState);
            
            // 更新直到满足转换条件
            while (context.value <= 10) {
                stateMachine.update(1.0);
            }
            
            // 应该自动切换回空闲状态
            expect(stateMachine.currentState).toBe(idleState);
            expect(defendState.endCalled).toBe(true);
        });

        test('应该能处理连续的状态切换', () => {
            const attackState = new AttackState();
            const defendState = new DefendState();
            
            stateMachine.addState(attackState);
            stateMachine.addState(defendState);
            
            // 连续切换状态
            stateMachine.changeState(AttackState);
            expect(stateMachine.currentState).toBe(attackState);
            expect(context.message).toBe('attacking');
            
            stateMachine.changeState(DefendState);
            expect(stateMachine.currentState).toBe(defendState);
            expect(context.message).toBe('defending');
            expect(attackState.endCalled).toBe(true);
            
            stateMachine.changeState(IdleState);
            expect(stateMachine.currentState).toBe(idleState);
            expect(defendState.endCalled).toBe(true);
        });
    });

    describe('错误处理测试', () => {
        test('状态抛出异常时应该被处理', () => {
            class ErrorState extends State<TestContext> {
                update(_deltaTime: number): void {
                    throw new Error('状态更新错误');
                }
            }
            
            const errorState = new ErrorState();
            stateMachine.addState(errorState);
            stateMachine.changeState(ErrorState);
            
            // 更新不应该导致未捕获的异常
            expect(() => {
                stateMachine.update(0.016);
            }).not.toThrow();
        });

        test('状态begin方法抛出异常时应该被处理', () => {
            class ErrorBeginState extends State<TestContext> {
                begin(): void {
                    throw new Error('状态开始错误');
                }
            }
            
            const errorState = new ErrorBeginState();
            stateMachine.addState(errorState);
            
            expect(() => {
                stateMachine.changeState(ErrorBeginState);
            }).not.toThrow();
        });
    });

    describe('性能测试', () => {
        test('大量状态更新应该高效执行', () => {
            const startTime = performance.now();
            
            for (let i = 0; i < 10000; i++) {
                stateMachine.update(0.001);
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            expect(duration).toBeLessThan(100); // 应该在100ms内完成
            expect(idleState.updateCount).toBe(10000);
        });

        test('频繁状态切换应该高效执行', () => {
            const attackState = new AttackState();
            stateMachine.addState(attackState);
            
            const startTime = performance.now();
            
            for (let i = 0; i < 1000; i++) {
                if (i % 2 === 0) {
                    stateMachine.changeState(AttackState);
                } else {
                    stateMachine.changeState(IdleState);
                }
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            expect(duration).toBeLessThan(50); // 应该在50ms内完成
        });
    });

    describe('实际使用场景测试', () => {
        test('游戏AI状态机模拟', () => {
            interface AIContext {
                health: number;
                enemyDistance: number;
                hasWeapon: boolean;
            }
            
            class AIIdleState extends State<AIContext> {
                update(_deltaTime: number): void {
                    if (this.context.enemyDistance < 5) {
                        if (this.context.hasWeapon) {
                            this.machine.changeState(AIAttackState);
                        } else {
                            this.machine.changeState(AIFleeState);
                        }
                    }
                }
            }
            
            class AIAttackState extends State<AIContext> {
                update(_deltaTime: number): void {
                    if (this.context.health < 20) {
                        this.machine.changeState(AIFleeState);
                    } else if (this.context.enemyDistance > 10) {
                        this.machine.changeState(AIIdleState);
                    }
                }
            }
            
            class AIFleeState extends State<AIContext> {
                update(_deltaTime: number): void {
                    if (this.context.enemyDistance > 15) {
                        this.machine.changeState(AIIdleState);
                    }
                }
            }
            
            const aiContext: AIContext = {
                health: 100,
                enemyDistance: 10,
                hasWeapon: true
            };
            
            const aiMachine = new StateMachine(aiContext, new AIIdleState());
            aiMachine.addState(new AIAttackState());
            aiMachine.addState(new AIFleeState());
            
            // 模拟游戏循环
            aiMachine.update(0.016);
            expect(aiMachine.isInState(AIIdleState)).toBe(true);
            
            // 敌人接近
            aiContext.enemyDistance = 3;
            aiMachine.update(0.016);
            expect(aiMachine.isInState(AIAttackState)).toBe(true);
            
            // 血量过低
            aiContext.health = 10;
            aiMachine.update(0.016);
            expect(aiMachine.isInState(AIFleeState)).toBe(true);
            
            // 逃脱成功
            aiContext.enemyDistance = 20;
            aiMachine.update(0.016);
            expect(aiMachine.isInState(AIIdleState)).toBe(true);
        });
    });
});