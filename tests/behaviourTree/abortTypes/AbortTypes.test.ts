/**
 * AbortTypes 枚举测试
 * 
 * 测试中止类型枚举的定义和工具方法
 */
import { AbortTypes, AbortTypesExt } from '../../../behaviourTree/composites/AbortTypes';

describe('AbortTypes 枚举测试', () => {
  // 测试枚举值定义
  describe('枚举值定义测试', () => {
    test('应该定义正确的枚举值', () => {
      expect(AbortTypes.None).toBe(0);
      expect(AbortTypes.LowerPriority).toBe(1);
      expect(AbortTypes.Self).toBe(2);
      expect(AbortTypes.Both).toBe(3); // Self | LowerPriority = 2 | 1 = 3
    });

    test('Both应该是Self和LowerPriority的组合', () => {
      expect(AbortTypes.Both).toBe(AbortTypes.Self | AbortTypes.LowerPriority);
    });

    test('枚举值应该是唯一的', () => {
      const values = [
        AbortTypes.None,
        AbortTypes.LowerPriority,
        AbortTypes.Self,
        AbortTypes.Both
      ];
      
      const uniqueValues = [...new Set(values)];
      expect(uniqueValues.length).toBe(values.length);
    });
  });

  // 测试AbortTypesExt工具类
  describe('AbortTypesExt工具类测试', () => {
    test('has方法应该正确检查None类型', () => {
      expect(AbortTypesExt.has(AbortTypes.None, AbortTypes.None)).toBe(true);
      expect(AbortTypesExt.has(AbortTypes.None, AbortTypes.Self)).toBe(false);
      expect(AbortTypesExt.has(AbortTypes.None, AbortTypes.LowerPriority)).toBe(false);
      expect(AbortTypesExt.has(AbortTypes.None, AbortTypes.Both)).toBe(false);
    });

    test('has方法应该正确检查Self类型', () => {
      expect(AbortTypesExt.has(AbortTypes.Self, AbortTypes.Self)).toBe(true);
      expect(AbortTypesExt.has(AbortTypes.Self, AbortTypes.None)).toBe(true); // 0 & 2 == 0
      expect(AbortTypesExt.has(AbortTypes.Self, AbortTypes.LowerPriority)).toBe(false);
      expect(AbortTypesExt.has(AbortTypes.Self, AbortTypes.Both)).toBe(false);
    });

    test('has方法应该正确检查LowerPriority类型', () => {
      expect(AbortTypesExt.has(AbortTypes.LowerPriority, AbortTypes.LowerPriority)).toBe(true);
      expect(AbortTypesExt.has(AbortTypes.LowerPriority, AbortTypes.None)).toBe(true); // 0 & 1 == 0
      expect(AbortTypesExt.has(AbortTypes.LowerPriority, AbortTypes.Self)).toBe(false);
      expect(AbortTypesExt.has(AbortTypes.LowerPriority, AbortTypes.Both)).toBe(false);
    });

    test('has方法应该正确检查Both类型', () => {
      expect(AbortTypesExt.has(AbortTypes.Both, AbortTypes.Both)).toBe(true);
      expect(AbortTypesExt.has(AbortTypes.Both, AbortTypes.Self)).toBe(true);
      expect(AbortTypesExt.has(AbortTypes.Both, AbortTypes.LowerPriority)).toBe(true);
      expect(AbortTypesExt.has(AbortTypes.Both, AbortTypes.None)).toBe(true); // 0 & 3 == 0
    });

    test('has方法应该处理位运算组合', () => {
      // 测试自定义组合
      const customCombination = AbortTypes.Self | AbortTypes.LowerPriority;
      expect(customCombination).toBe(AbortTypes.Both);
      
      expect(AbortTypesExt.has(customCombination, AbortTypes.Self)).toBe(true);
      expect(AbortTypesExt.has(customCombination, AbortTypes.LowerPriority)).toBe(true);
      expect(AbortTypesExt.has(customCombination, AbortTypes.Both)).toBe(true);
    });
  });

  // 测试位运算逻辑
  describe('位运算逻辑测试', () => {
    test('应该支持位运算组合', () => {
      const combined = AbortTypes.Self | AbortTypes.LowerPriority;
      expect(combined).toBe(AbortTypes.Both);
      
      // 检查组合后的值包含原始值
      expect((combined & AbortTypes.Self) === AbortTypes.Self).toBe(true);
      expect((combined & AbortTypes.LowerPriority) === AbortTypes.LowerPriority).toBe(true);
    });

    test('应该支持位运算检查', () => {
      // 使用位运算直接检查
      expect((AbortTypes.Both & AbortTypes.Self) === AbortTypes.Self).toBe(true);
      expect((AbortTypes.Both & AbortTypes.LowerPriority) === AbortTypes.LowerPriority).toBe(true);
      expect((AbortTypes.Self & AbortTypes.LowerPriority) === AbortTypes.LowerPriority).toBe(false);
    });

    test('应该正确处理零值检查', () => {
      expect((AbortTypes.None & AbortTypes.Self) === AbortTypes.None).toBe(true);
      expect((AbortTypes.None & AbortTypes.LowerPriority) === AbortTypes.None).toBe(true);
      expect((AbortTypes.None & AbortTypes.Both) === AbortTypes.None).toBe(true);
    });
  });

  // 测试实际使用场景
  describe('实际使用场景测试', () => {
    test('检查节点是否支持自中止', () => {
      const checkSelfAbort = (abortType: AbortTypes): boolean => {
        return AbortTypesExt.has(abortType, AbortTypes.Self);
      };
      
      expect(checkSelfAbort(AbortTypes.None)).toBe(false);
      expect(checkSelfAbort(AbortTypes.Self)).toBe(true);
      expect(checkSelfAbort(AbortTypes.LowerPriority)).toBe(false);
      expect(checkSelfAbort(AbortTypes.Both)).toBe(true);
    });

    test('检查节点是否支持低优先级中止', () => {
      const checkLowerPriorityAbort = (abortType: AbortTypes): boolean => {
        return AbortTypesExt.has(abortType, AbortTypes.LowerPriority);
      };
      
      expect(checkLowerPriorityAbort(AbortTypes.None)).toBe(false);
      expect(checkLowerPriorityAbort(AbortTypes.Self)).toBe(false);
      expect(checkLowerPriorityAbort(AbortTypes.LowerPriority)).toBe(true);
      expect(checkLowerPriorityAbort(AbortTypes.Both)).toBe(true);
    });

    test('检查节点是否支持任何中止类型', () => {
      const hasAnyAbort = (abortType: AbortTypes): boolean => {
        return abortType !== AbortTypes.None;
      };
      
      expect(hasAnyAbort(AbortTypes.None)).toBe(false);
      expect(hasAnyAbort(AbortTypes.Self)).toBe(true);
      expect(hasAnyAbort(AbortTypes.LowerPriority)).toBe(true);
      expect(hasAnyAbort(AbortTypes.Both)).toBe(true);
    });

    test('配置复合节点的中止类型', () => {
      interface MockComposite {
        abortType: AbortTypes;
      }
      
      const selector: MockComposite = { abortType: AbortTypes.None };
      const sequence: MockComposite = { abortType: AbortTypes.Self };
      const parallel: MockComposite = { abortType: AbortTypes.LowerPriority };
      const complex: MockComposite = { abortType: AbortTypes.Both };
      
      // 验证配置
      expect(selector.abortType).toBe(AbortTypes.None);
      expect(sequence.abortType).toBe(AbortTypes.Self);
      expect(parallel.abortType).toBe(AbortTypes.LowerPriority);
      expect(complex.abortType).toBe(AbortTypes.Both);
      
      // 验证功能检查
      expect(AbortTypesExt.has(selector.abortType, AbortTypes.Self)).toBe(false);
      expect(AbortTypesExt.has(sequence.abortType, AbortTypes.Self)).toBe(true);
      expect(AbortTypesExt.has(parallel.abortType, AbortTypes.LowerPriority)).toBe(true);
      expect(AbortTypesExt.has(complex.abortType, AbortTypes.Self)).toBe(true);
      expect(AbortTypesExt.has(complex.abortType, AbortTypes.LowerPriority)).toBe(true);
    });
  });

  // 测试性能
  describe('性能测试', () => {
    test('has方法应该高效执行', () => {
      const iterations = 100000;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        AbortTypesExt.has(AbortTypes.Both, AbortTypes.Self);
        AbortTypesExt.has(AbortTypes.Both, AbortTypes.LowerPriority);
        AbortTypesExt.has(AbortTypes.Self, AbortTypes.LowerPriority);
        AbortTypesExt.has(AbortTypes.None, AbortTypes.Both);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // 应该在100ms内完成
    });

    test('位运算应该比其他比较方式更快', () => {
      const iterations = 50000;
      
      // 测试位运算方式
      const startTime1 = performance.now();
      for (let i = 0; i < iterations; i++) {
        (AbortTypes.Both & AbortTypes.Self) === AbortTypes.Self;
      }
      const bitOperationTime = performance.now() - startTime1;
      
      // 测试has方法
      const startTime2 = performance.now();
      for (let i = 0; i < iterations; i++) {
        AbortTypesExt.has(AbortTypes.Both, AbortTypes.Self);
      }
      const hasMethodTime = performance.now() - startTime2;
      
      // has方法的性能应该接近直接位运算
      expect(hasMethodTime).toBeLessThan(bitOperationTime * 2);
    });
  });

  // 测试边界情况
  describe('边界情况测试', () => {
    test('应该处理无效的枚举值', () => {
      const invalidValue = 999 as AbortTypes;
      
      // has方法应该能处理无效值
      expect(AbortTypesExt.has(invalidValue, AbortTypes.Self)).toBe(true); // 999 & 2 == 2
      expect(AbortTypesExt.has(AbortTypes.Self, invalidValue)).toBe(false); // 2 & 999 != 999
    });

    test('应该处理负数值', () => {
      const negativeValue = -1 as AbortTypes;
      
      // 位运算应该能处理负数
      expect(AbortTypesExt.has(negativeValue, AbortTypes.Self)).toBe(true);
      expect(AbortTypesExt.has(negativeValue, AbortTypes.LowerPriority)).toBe(true);
    });

    test('应该处理零值', () => {
      expect(AbortTypesExt.has(0 as AbortTypes, AbortTypes.None)).toBe(true);
      expect(AbortTypesExt.has(AbortTypes.None, 0 as AbortTypes)).toBe(true);
    });
  });

  // 测试类型安全
  describe('类型安全测试', () => {
    test('枚举值应该是数字类型', () => {
      expect(typeof AbortTypes.None).toBe('number');
      expect(typeof AbortTypes.Self).toBe('number');
      expect(typeof AbortTypes.LowerPriority).toBe('number');
      expect(typeof AbortTypes.Both).toBe('number');
    });

    test('应该支持类型检查', () => {
      const checkAbortType = (value: AbortTypes): boolean => {
        return Object.values(AbortTypes).includes(value);
      };
      
      expect(checkAbortType(AbortTypes.None)).toBe(true);
      expect(checkAbortType(AbortTypes.Self)).toBe(true);
      expect(checkAbortType(AbortTypes.LowerPriority)).toBe(true);
      expect(checkAbortType(AbortTypes.Both)).toBe(true);
      expect(checkAbortType(999 as AbortTypes)).toBe(false);
    });
  });
});
