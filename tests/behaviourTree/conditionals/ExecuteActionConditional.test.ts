/**
 * ExecuteActionConditional 条件节点测试
 * 
 * 测试执行动作条件包装器的行为
 */
import { ExecuteActionConditional } from '../../../behaviourTree/conditionals/ExecuteActionConditional';
import { TaskStatus } from '../../../behaviourTree/TaskStatus';
import { TestUtils, TestContext } from '../../utils/TestUtils';

describe('ExecuteActionConditional 条件节点测试', () => {
  let context: TestContext;

  beforeEach(() => {
    context = TestUtils.createTestContext();
  });

  // 测试基本功能
  describe('基本功能测试', () => {
    test('应该能创建ExecuteActionConditional实例', () => {
      const conditional = new ExecuteActionConditional<TestContext>(() => TaskStatus.Success);
      expect(conditional).toBeDefined();
      expect(conditional.status).toBe(TaskStatus.Invalid);
      expect(conditional.discriminator).toBe('IConditional');
    });

    test('应该能执行成功的条件', () => {
      let executed = false;
      const conditional = new ExecuteActionConditional<TestContext>((ctx) => {
        executed = true;
        expect(ctx).toBe(context);
        return TaskStatus.Success;
      });

      const result = conditional.tick(context);

      expect(result).toBe(TaskStatus.Success);
      expect(executed).toBe(true);
      expect(conditional.status).toBe(TaskStatus.Success);
    });

    test('应该能执行失败的条件', () => {
      let executed = false;
      const conditional = new ExecuteActionConditional<TestContext>((ctx) => {
        executed = true;
        return TaskStatus.Failure;
      });

      const result = conditional.tick(context);

      expect(result).toBe(TaskStatus.Failure);
      expect(executed).toBe(true);
      expect(conditional.status).toBe(TaskStatus.Failure);
    });

    test('条件不应该返回Running状态', () => {
      const conditional = new ExecuteActionConditional<TestContext>(() => TaskStatus.Running);

      const result = conditional.tick(context);

      // 条件节点通常不应该返回Running，但如果返回了也应该正确处理
      expect(result).toBe(TaskStatus.Running);
      expect(conditional.status).toBe(TaskStatus.Running);
    });

    test('应该能传递上下文参数', () => {
      let receivedContext: TestContext | null = null;
      const conditional = new ExecuteActionConditional<TestContext>((ctx) => {
        receivedContext = ctx;
        return TaskStatus.Success;
      });

      conditional.tick(context);

      expect(receivedContext).toBe(context);
    });
  });

  // 测试配置选项
  describe('配置选项测试', () => {
    test('应该能设置条件名称', () => {
      const conditionName = '测试条件';
      const conditional = new ExecuteActionConditional<TestContext>(
        () => TaskStatus.Success,
        { name: conditionName }
      );

      expect(conditional.getName()).toBe(conditionName);
    });

    test('应该能启用错误处理', () => {
      const conditional = new ExecuteActionConditional<TestContext>(
        () => TaskStatus.Success,
        { enableErrorHandling: true }
      );

      const result = conditional.tick(context);
      expect(result).toBe(TaskStatus.Success);
    });

    test('应该能禁用错误处理', () => {
      const conditional = new ExecuteActionConditional<TestContext>(
        () => TaskStatus.Success,
        { enableErrorHandling: false }
      );

      const result = conditional.tick(context);
      expect(result).toBe(TaskStatus.Success);
    });
  });

  // 测试静态工厂方法
  describe('静态工厂方法测试', () => {
    test('createPredicate应该创建基于布尔值的条件', () => {
      let executed = false;
      const conditional = ExecuteActionConditional.createPredicate<TestContext>((ctx) => {
        executed = true;
        expect(ctx).toBe(context);
        return true; // 条件为真
      });

      const result = conditional.tick(context);

      expect(result).toBe(TaskStatus.Success);
      expect(executed).toBe(true);
      expect(conditional.getName()).toContain('Predicate Condition');
    });

    test('createPredicate条件为假时应该返回失败', () => {
      const conditional = ExecuteActionConditional.createPredicate<TestContext>(() => false);

      const result = conditional.tick(context);

      expect(result).toBe(TaskStatus.Failure);
    });

    test('createPredicate应该支持自定义名称', () => {
      const customName = '自定义谓词条件';
      const conditional = ExecuteActionConditional.createPredicate<TestContext>(
        () => true,
        customName
      );

      expect(conditional.getName()).toBe(customName);
    });

    test('createNumericComparison应该创建数值比较条件', () => {
      const getValue = (ctx: TestContext) => 75;
      const threshold = 50;
      
      // 测试大于比较
      const greaterCondition = ExecuteActionConditional.createNumericComparison<TestContext>(
        getValue,
        threshold,
        'greater'
      );

      let result = greaterCondition.tick(context);
      expect(result).toBe(TaskStatus.Success); // 75 > 50

      // 测试小于比较
      const lessCondition = ExecuteActionConditional.createNumericComparison<TestContext>(
        getValue,
        threshold,
        'less'
      );

      result = lessCondition.tick(context);
      expect(result).toBe(TaskStatus.Failure); // 75 < 50 为假
    });

    test('createNumericComparison应该处理所有比较类型', () => {
      const testCases = [
        { value: 75, threshold: 50, comparison: 'greater' as const, expected: TaskStatus.Success },
        { value: 25, threshold: 50, comparison: 'less' as const, expected: TaskStatus.Success },
        { value: 50, threshold: 50, comparison: 'equal' as const, expected: TaskStatus.Success },
        { value: 75, threshold: 50, comparison: 'greaterEqual' as const, expected: TaskStatus.Success },
        { value: 50, threshold: 50, comparison: 'greaterEqual' as const, expected: TaskStatus.Success },
        { value: 25, threshold: 50, comparison: 'lessEqual' as const, expected: TaskStatus.Success },
        { value: 50, threshold: 50, comparison: 'lessEqual' as const, expected: TaskStatus.Success }
      ];

      testCases.forEach(({ value, threshold, comparison, expected }) => {
        const conditional = ExecuteActionConditional.createNumericComparison<TestContext>(
          () => value,
          threshold,
          comparison
        );

        const result = conditional.tick(context);
        expect(result).toBe(expected);
      });
    });

    test('createNumericComparison应该处理无效数值', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const conditional = ExecuteActionConditional.createNumericComparison<TestContext>(
        () => 'invalid' as any,
        50,
        'greater'
      );

      const result = conditional.tick(context);

      expect(result).toBe(TaskStatus.Failure);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('getValue返回了无效的数值')
      );
      
      consoleSpy.mockRestore();
    });

    test('createNumericComparison应该处理获取数值时的异常', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const conditional = ExecuteActionConditional.createNumericComparison<TestContext>(
        () => {
          throw new Error('获取数值失败');
        },
        50,
        'greater'
      );

      const result = conditional.tick(context);

      expect(result).toBe(TaskStatus.Failure);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('获取数值时发生错误'),
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    test('createPropertyExists应该创建属性存在检查条件', () => {
      const conditional = ExecuteActionConditional.createPropertyExists<TestContext>(
        (ctx) => (ctx as any).someProperty
      );

      // 设置属性存在
      (context as any).someProperty = 'exists';
      let result = conditional.tick(context);
      expect(result).toBe(TaskStatus.Success);

      // 设置属性为null
      (context as any).someProperty = null;
      result = conditional.tick(context);
      expect(result).toBe(TaskStatus.Failure);

      // 删除属性
      delete (context as any).someProperty;
      result = conditional.tick(context);
      expect(result).toBe(TaskStatus.Failure);
    });

    test('createPropertyExists应该处理获取属性时的异常', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const conditional = ExecuteActionConditional.createPropertyExists<TestContext>(
        () => {
          throw new Error('获取属性失败');
        }
      );

      const result = conditional.tick(context);

      expect(result).toBe(TaskStatus.Failure);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('检查属性时发生错误'),
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  // 测试错误处理
  describe('错误处理测试', () => {
    test('启用错误处理时应该捕获异常', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const conditional = new ExecuteActionConditional<TestContext>(
        () => {
          throw new Error('测试错误');
        },
        { enableErrorHandling: true }
      );

      const result = conditional.tick(context);

      expect(result).toBe(TaskStatus.Failure);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    test('禁用错误处理时异常应该向上传播', () => {
      const conditional = new ExecuteActionConditional<TestContext>(
        () => {
          throw new Error('测试错误');
        },
        { enableErrorHandling: false }
      );

      expect(() => {
        conditional.tick(context);
      }).toThrow('测试错误');
    });
  });

  // 测试状态管理
  describe('状态管理测试', () => {
    test('多次执行应该更新状态', () => {
      let counter = 0;
      const conditional = new ExecuteActionConditional<TestContext>(() => {
        counter++;
        return counter % 2 === 0 ? TaskStatus.Success : TaskStatus.Failure;
      });

      // 第一次执行 - 失败
      let result = conditional.tick(context);
      expect(result).toBe(TaskStatus.Failure);
      expect(conditional.status).toBe(TaskStatus.Failure);

      // 第二次执行 - 成功
      result = conditional.tick(context);
      expect(result).toBe(TaskStatus.Success);
      expect(conditional.status).toBe(TaskStatus.Success);
    });

    test('invalidate应该重置状态', () => {
      const conditional = new ExecuteActionConditional<TestContext>(() => TaskStatus.Success);

      // 执行一次
      conditional.tick(context);
      expect(conditional.status).toBe(TaskStatus.Success);

      // 重置状态
      conditional.invalidate();
      expect(conditional.status).toBe(TaskStatus.Invalid);
    });
  });

  // 测试性能
  describe('性能测试', () => {
    test('大量执行应该高效', () => {
      let counter = 0;
      const conditional = new ExecuteActionConditional<TestContext>(() => {
        counter++;
        return TaskStatus.Success;
      });

      const startTime = performance.now();
      const iterations = 10000;

      for (let i = 0; i < iterations; i++) {
        conditional.invalidate();
        conditional.tick(context);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // 应该在100ms内完成
      expect(counter).toBe(iterations);
    });
  });

  // 测试实际使用场景
  describe('实际使用场景测试', () => {
    test('玩家血量检查', () => {
      interface GameContext extends TestContext {
        player: { health: number };
      }

      const gameContext: GameContext = {
        ...context,
        player: { health: 75 }
      };

      const healthCheck = ExecuteActionConditional.createNumericComparison<GameContext>(
        (ctx) => ctx.player.health,
        50,
        'greater',
        'HealthCheck'
      );

      let result = healthCheck.tick(gameContext);
      expect(result).toBe(TaskStatus.Success); // 75 > 50

      // 血量降低
      gameContext.player.health = 25;
      result = healthCheck.tick(gameContext);
      expect(result).toBe(TaskStatus.Failure); // 25 > 50 为假
    });

    test('敌人距离检查', () => {
      interface GameContext extends TestContext {
        getClosestEnemy(): { distance: number } | null;
      }

      const gameContext: GameContext = {
        ...context,
        getClosestEnemy: () => ({ distance: 8 })
      };

      const enemyInRange = ExecuteActionConditional.createPredicate<GameContext>(
        (ctx) => {
          const enemy = ctx.getClosestEnemy();
          return enemy ? enemy.distance < 10 : false;
        },
        'EnemyInRange'
      );

      let result = enemyInRange.tick(gameContext);
      expect(result).toBe(TaskStatus.Success); // 8 < 10

      // 敌人远离
      gameContext.getClosestEnemy = () => ({ distance: 15 });
      result = enemyInRange.tick(gameContext);
      expect(result).toBe(TaskStatus.Failure); // 15 < 10 为假

      // 没有敌人
      gameContext.getClosestEnemy = () => null;
      result = enemyInRange.tick(gameContext);
      expect(result).toBe(TaskStatus.Failure);
    });

    test('资源可用性检查', () => {
      interface GameContext extends TestContext {
        resources: { gold: number; wood: number };
      }

      const gameContext: GameContext = {
        ...context,
        resources: { gold: 100, wood: 50 }
      };

      const hasEnoughGold = ExecuteActionConditional.createNumericComparison<GameContext>(
        (ctx) => ctx.resources.gold,
        75,
        'greaterEqual',
        'GoldCheck'
      );

      const result = hasEnoughGold.tick(gameContext);
      expect(result).toBe(TaskStatus.Success); // 100 >= 75
    });

    test('装备存在检查', () => {
      interface GameContext extends TestContext {
        player: { weapon?: { name: string } };
      }

      const gameContext: GameContext = {
        ...context,
        player: { weapon: { name: 'sword' } }
      };

      const hasWeapon = ExecuteActionConditional.createPropertyExists<GameContext>(
        (ctx) => ctx.player.weapon,
        'WeaponCheck'
      );

      let result = hasWeapon.tick(gameContext);
      expect(result).toBe(TaskStatus.Success);

      // 移除武器
      delete gameContext.player.weapon;
      result = hasWeapon.tick(gameContext);
      expect(result).toBe(TaskStatus.Failure);
    });

    test('复合条件检查', () => {
      interface GameContext extends TestContext {
        player: { health: number; mana: number };
      }

      const gameContext: GameContext = {
        ...context,
        player: { health: 80, mana: 30 }
      };

      const canCastSpell = new ExecuteActionConditional<GameContext>((ctx) => {
        const { health, mana } = ctx.player;
        const hasEnoughHealth = health > 50;
        const hasEnoughMana = mana >= 25;
        return (hasEnoughHealth && hasEnoughMana) ? TaskStatus.Success : TaskStatus.Failure;
      }, { name: 'CanCastSpell' });

      let result = canCastSpell.tick(gameContext);
      expect(result).toBe(TaskStatus.Success); // 80 > 50 && 30 >= 25

      // 法力不足
      gameContext.player.mana = 20;
      result = canCastSpell.tick(gameContext);
      expect(result).toBe(TaskStatus.Failure); // 80 > 50 && 20 >= 25 为假
    });
  });
});
